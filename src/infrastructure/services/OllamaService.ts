import { Ollama } from 'ollama';
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";

export class OllamaService implements IOpenAIService {
    private ollama: Ollama;
    private model: string;

    constructor() {
        this.ollama = new Ollama({
            host: process.env.OLLAMA_HOST || 'https://ollama.com',
            headers: {
                Authorization: 'Bearer ' + (process.env.OLLAMA_API_KEY || ''),
            },
        });
        this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        const messages: any[] = [];

        // System instruction
        const systemMsg = context?.financialContext
            ? `Eres el asistente financiero inteligente de FinanzApp. Ayudas al usuario a tomar mejores decisiones financieras analizando sus gastos e ingresos.

📊 DATOS FINANCIEROS ACTUALES DEL USUARIO:
${context.financialContext}

REGLAS:
1. NUNCA menciones IDs técnicos.
2. Si preguntan por gastos/anomalías/proyecciones, USA LAS HERRAMIENTAS disponibles.
3. Sé amable y usa emojis (💰, 📉, 🚨).
4. Responde siempre en español.`
            : `Eres el asistente financiero inteligente de FinanzApp. Responde siempre en español.`;

        messages.push({ role: 'system', content: systemMsg });

        // Add history
        if (context?.history) {
            const recentHistory = context.history.slice(-20);
            for (const msg of recentHistory) {
                if (msg.role === 'system') continue;
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        // Current message
        messages.push({ role: 'user', content: message });

        try {
            const options: any = {
                model: this.model,
                messages,
                stream: false,
            };

            if (tools && tools.length > 0) {
                options.tools = tools.map((t: any) => t.function);
            }

            const response = await this.ollama.chat(options) as any;

            return {
                role: 'assistant',
                content: response.message?.content,
                tool_calls: response.message?.tool_calls?.map((tc: any) => ({
                    id: tc.id || `call_${Math.random().toString(36).substring(7)}`,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: JSON.stringify(tc.function.arguments),
                    },
                })),
            };
        } catch (error) {
            console.error("Error calling Ollama:", error);
            return {
                content: "Lo siento, hubo un error al conectar con el asistente.",
                role: 'assistant',
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        try {
            const options: any = {
                model: this.model,
                messages,
                stream: false,
            };

            if (tools && tools.length > 0) {
                options.tools = tools.map((t: any) => t.function);
            }

            const response = await this.ollama.chat(options) as any;

            return {
                role: 'assistant',
                content: response.message?.content,
                tool_calls: response.message?.tool_calls?.map((tc: any) => ({
                    id: tc.id || `call_${Math.random().toString(36).substring(7)}`,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: JSON.stringify(tc.function.arguments),
                    },
                })),
            };
        } catch (error) {
            console.error("Error continuing Ollama conversation:", error);
            return {
                content: "Lo siento, hubo un error al conectar con el asistente.",
                role: 'assistant',
            };
        }
    }
}
