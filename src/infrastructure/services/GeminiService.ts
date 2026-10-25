import { GoogleAuth } from 'google-auth-library';
import { IOpenAIService } from '../../domain/services/Interfaces/IAnalysisService';
import { FINANCIAL_CONTEXT_HEADER, SYSTEM_INSTRUCTION_BASE } from './ollama/ollama.constants';

/**
 * Servicio de IA sobre Gemini.
 *
 * Soporta dos backends con el MISMO contrato que OllamaService:
 *  - `vertex`  → Gemini Enterprise Agent Platform (ex Vertex AI). Se paga con
 *                créditos de Google Cloud. Requiere service account o API key.
 *  - `studio`  → Gemini API (AI Studio). Tiene tier gratuito real.
 *
 * Variables de entorno:
 *   AI_PROVIDER=gemini            (para que la factory use este servicio)
 *   GEMINI_PROVIDER=vertex|studio (default: vertex)
 *   GEMINI_MODEL=gemini-3.5-flash-lite
 *   GOOGLE_CLOUD_PROJECT=gen-lang-client-0913583676
 *   GEMINI_LOCATION=global        (los modelos 3.x/4 SOLO existen en global)
 *   GEMINI_API_KEY=...            (studio, o vertex en modo express)
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/service-account.json (vertex)
 */

const PROVIDER = (process.env.GEMINI_PROVIDER || 'vertex').toLowerCase();
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0913583676';
const LOCATION = process.env.GEMINI_LOCATION || 'global';
const API_KEY = process.env.GEMINI_API_KEY || '';

const MAX_HISTORY = 20;
const CONNECTION_ERROR = 'Lo siento, hubo un error al conectar con el asistente.';

const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token;
    }
    const client = await auth.getClient();
    const res = await client.getAccessToken();
    if (!res?.token) {
        throw new Error('No se pudo obtener un access token de Google Cloud');
    }
    cachedToken = {
        token: res.token,
        // GoogleAuth no siempre expone la expiración: asumimos 45 min.
        expiresAt: Date.now() + 45 * 60 * 1000,
    };
    return res.token;
}

/** Convierte el JSON Schema de OpenAI a la forma que espera Gemini. */
function toGeminiSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return undefined;

    if (Array.isArray(schema)) return schema.map(toGeminiSchema);

    const out: any = {};
    for (const [key, value] of Object.entries(schema)) {
        if (key === 'additionalProperties') continue;
        if (key === 'type' && typeof value === 'string') {
            out.type = value.toUpperCase();
            continue;
        }
        out[key] =
            key === 'properties' || key === 'items' || key === 'required'
                ? toGeminiSchema(value)
                : value;
    }

    if (out.properties) {
        for (const propKey of Object.keys(out.properties)) {
            out.properties[propKey] = toGeminiSchema(out.properties[propKey]);
        }
    }

    return out;
}

function toGeminiTools(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return [
        {
            functionDeclarations: tools
                .filter((t) => t?.function?.name)
                .map((t) => ({
                    name: t.function.name,
                    description: t.function.description,
                    parameters: toGeminiSchema(t.function.parameters),
                })),
        },
    ];
}

export class GeminiService implements IOpenAIService {
    private endpoint(action: string): string {
        if (PROVIDER === 'studio') {
            return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:${action}`;
        }
        const host =
            LOCATION === 'global'
                ? 'https://aiplatform.googleapis.com'
                : `https://${LOCATION}-aiplatform.googleapis.com`;
        return `${host}/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:${action}`;
    }

    private async headers(): Promise<Record<string, string>> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (PROVIDER === 'studio') {
            headers['x-goog-api-key'] = API_KEY;
            return headers;
        }

        // Vertex: service account (ADC) o API key en modo express.
        if (API_KEY) {
            return headers;
        }
        headers.Authorization = `Bearer ${await getAccessToken()}`;
        return headers;
    }

    private url(action: string): string {
        const base = this.endpoint(action);
        if (PROVIDER === 'vertex' && API_KEY) {
            return `${base}?key=${API_KEY}`;
        }
        if (action === 'streamGenerateContent') {
            return `${base}?alt=sse`;
        }
        return base;
    }

    private buildSystemInstruction(context?: any): any {
        let text = SYSTEM_INSTRUCTION_BASE;
        if (context?.financialContext) {
            text += `${FINANCIAL_CONTEXT_HEADER}${context.financialContext}`;
        }
        if (context?.knowledge) {
            text += `\n\n📚 CONOCIMIENTO DE FINANZAPP:\n${context.knowledge}`;
        }
        return { parts: [{ text }] };
    }

    /** Historial OpenAI/Ollama → contents de Gemini. */
    private historyToContents(history: any[]): any[] {
        const contents: any[] = [];

        for (const msg of (history || []).slice(-MAX_HISTORY)) {
            if (!msg) continue;

            // Respuesta cruda de Gemini guardada por nosotros (conserva thoughtSignature)
            if (msg.__gemini) {
                contents.push(msg.__gemini);
                continue;
            }

            if (msg.role === 'system') continue;

            if (msg.role === 'tool') {
                let payload: any;
                try {
                    payload = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                } catch {
                    payload = { result: msg.content };
                }
                contents.push({
                    role: 'user',
                    parts: [{ functionResponse: { name: msg.name, response: payload } }],
                });
                continue;
            }

            if (msg.role === 'assistant' || msg.role === 'model') {
                const parts: any[] = [];
                if (msg.content) parts.push({ text: msg.content });
                for (const call of msg.tool_calls || []) {
                    parts.push({
                        functionCall: {
                            name: call.function?.name,
                            args:
                                typeof call.function?.arguments === 'string'
                                    ? safeJson(call.function.arguments)
                                    : call.function?.arguments || {},
                        },
                    });
                }
                if (parts.length > 0) contents.push({ role: 'model', parts });
                continue;
            }

            if (typeof msg.content === 'string' && msg.content.length > 0) {
                contents.push({ role: 'user', parts: [{ text: msg.content }] });
            }
        }

        return contents;
    }

    private buildBody(message: string, context: any, tools?: any[]): any {
        const contents = this.historyToContents(context?.history || []);
        contents.push({ role: 'user', parts: [{ text: message }] });

        const body: any = {
            contents,
            systemInstruction: this.buildSystemInstruction(context),
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
            },
        };

        const geminiTools = toGeminiTools(tools);
        if (geminiTools) body.tools = geminiTools;

        return body;
    }

    private async call(action: string, body: any): Promise<any> {
        const response = await fetch(this.url(action), {
            method: 'POST',
            headers: await this.headers(),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new Error(`Gemini ${action} ${response.status}: ${detail.slice(0, 500)}`);
        }

        return response.json();
    }

    private parseResponse(data: any): any {
        const candidate = data?.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        const text = parts
            .filter((p: any) => typeof p.text === 'string')
            .map((p: any) => p.text)
            .join('');

        const toolCalls = parts
            .filter((p: any) => p.functionCall)
            .map((p: any, index: number) => ({
                id: p.functionCall.id || `call_${Date.now()}_${index}`,
                type: 'function',
                function: {
                    name: p.functionCall.name,
                    arguments: JSON.stringify(p.functionCall.args || {}),
                },
            }));

        return {
            role: 'assistant',
            content: text,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            // Se reenvía en el siguiente turno para no romper el function calling
            // de los modelos 3.x/4 (thoughtSignature).
            __gemini: { role: 'model', parts },
        };
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        try {
            const data = await this.call('generateContent', this.buildBody(message, context, tools));
            return this.parseResponse(data);
        } catch (error) {
            console.error('Error calling Gemini:', error);
            return { role: 'assistant', content: CONNECTION_ERROR };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        try {
            const contents = this.historyToContents(messages);
            const body: any = {
                contents,
                systemInstruction: this.buildSystemInstruction(undefined),
                generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
            };
            const geminiTools = toGeminiTools(tools);
            if (geminiTools) body.tools = geminiTools;

            const data = await this.call('generateContent', body);
            return this.parseResponse(data);
        } catch (error) {
            console.error('Error continuing Gemini conversation:', error);
            return { role: 'assistant', content: CONNECTION_ERROR };
        }
    }

    async *generateResponseStream(
        userId: string,
        message: string,
        context?: any,
        tools?: any[]
    ): AsyncGenerator<string, void, unknown> {
        try {
            const body = this.buildBody(message, context, tools);

            const response = await fetch(this.url('streamGenerateContent'), {
                method: 'POST',
                headers: await this.headers(),
                body: JSON.stringify(body),
            });

            if (!response.ok || !response.body) {
                const detail = await response.text();
                throw new Error(`Gemini stream ${response.status}: ${detail.slice(0, 500)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const payload = trimmed.slice(5).trim();
                    if (!payload || payload === '[DONE]') continue;

                    try {
                        const chunk = JSON.parse(payload);
                        const parts = chunk?.candidates?.[0]?.content?.parts || [];
                        for (const part of parts) {
                            if (typeof part.text === 'string' && part.text.length > 0) {
                                yield part.text;
                            }
                        }
                    } catch {
                        // fragmento incompleto: se ignora
                    }
                }
            }
        } catch (error) {
            console.error('Error streaming Gemini:', error);
            yield CONNECTION_ERROR;
        }
    }
}

function safeJson(value: string): any {
    try {
        return JSON.parse(value);
    } catch {
        return { result: value };
    }
}
