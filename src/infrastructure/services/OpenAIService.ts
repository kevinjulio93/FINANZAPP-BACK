import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";

export class OpenAIService implements IOpenAIService {
    private get apiKey(): string {
        return process.env.GEMINI_API_KEY || '';
    }

    private get baseUrl(): string {
        return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    }

    /**
     * Convert OpenAI-style tool definitions to Gemini format
     */
    private convertToolsToGemini(tools?: any[]): any[] | undefined {
        if (!tools || tools.length === 0) return undefined;

        return [{
            functionDeclarations: tools.map(tool => {
                const decl: any = {
                    name: tool.function.name,
                    description: tool.function.description,
                };

                // Only include parameters if they have properties
                const params = tool.function.parameters;
                if (params && params.properties && Object.keys(params.properties).length > 0) {
                    decl.parameters = {
                        type: "OBJECT",
                        properties: params.properties,
                        required: params.required || []
                    };
                }

                return decl;
            })
        }];
    }

    /**
     * Convert OpenAI-style messages array to Gemini format.
     * Handles system, user, assistant (with tool_calls), and tool messages.
     */
    private convertMessagesToGemini(messages: any[]): { systemInstruction?: any; contents: any[] } {
        let systemInstruction: any = undefined;
        const contents: any[] = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];

            if (msg.role === 'system') {
                systemInstruction = { parts: [{ text: msg.content }] };

            } else if (msg.role === 'user') {
                contents.push({
                    role: 'user',
                    parts: [{ text: msg.content }]
                });

            } else if (msg.role === 'assistant') {
                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    contents.push({
                        role: 'model',
                        parts: msg.tool_calls.map((tc: any) => ({
                            functionCall: {
                                name: tc.function.name,
                                args: typeof tc.function.arguments === 'string'
                                    ? JSON.parse(tc.function.arguments)
                                    : tc.function.arguments
                            }
                        }))
                    });
                } else {
                    contents.push({
                        role: 'model',
                        parts: [{ text: msg.content || '' }]
                    });
                }

            } else if (msg.role === 'tool') {
                // Gemini expects tool results as functionResponse parts
                // Group consecutive tool messages into one user message
                const functionResponses: any[] = [];
                let j = i;
                while (j < messages.length && messages[j].role === 'tool') {
                    const toolMsg = messages[j];
                    let parsedContent;
                    try {
                        parsedContent = typeof toolMsg.content === 'string'
                            ? JSON.parse(toolMsg.content)
                            : toolMsg.content;
                    } catch {
                        parsedContent = { result: toolMsg.content };
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: toolMsg.name,
                            response: parsedContent
                        }
                    });
                    j++;
                }
                i = j - 1;

                contents.push({
                    role: 'user',
                    parts: functionResponses
                });
            }
        }

        return { systemInstruction, contents };
    }

    /**
     * Convert Gemini response to OpenAI-like format so ChatService works unchanged.
     */
    private convertGeminiResponse(data: any): any {
        const candidate = data.candidates?.[0];
        if (!candidate) {
            console.error('[Gemini] No candidates in response:', JSON.stringify(data).substring(0, 500));
            return { content: "No obtuve respuesta de la IA.", role: "assistant" };
        }

        const parts = candidate.content?.parts || [];

        // Check for function calls
        const functionCalls = parts.filter((p: any) => p.functionCall);
        if (functionCalls.length > 0) {
            console.log('[Gemini] Function calls detected:', functionCalls.map((p: any) => p.functionCall.name));
            return {
                role: "assistant",
                content: null,
                tool_calls: functionCalls.map((p: any, idx: number) => ({
                    id: `call_${Date.now()}_${idx}`,
                    type: "function",
                    function: {
                        name: p.functionCall.name,
                        arguments: JSON.stringify(p.functionCall.args || {})
                    }
                }))
            };
        }

        // Regular text response
        const textParts = parts.filter((p: any) => p.text);
        const content = textParts.map((p: any) => p.text).join('');
        console.log('[Gemini] Text response length:', content.length);
        return {
            content,
            role: "assistant"
        };
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: "Error: No se ha configurado la API Key de Gemini. Por favor configura GEMINI_API_KEY en el archivo .env.",
                role: "assistant"
            };
        }

        const systemPrompt = `Eres un asistente financiero experto para la aplicación FinanzApp. 
Tu objetivo es ayudar al usuario a entender sus gastos, detectar anomalías y planificar mejor.

Reglas:
1. Sé conciso y amable.
2. Usa emojis para resaltar categorías o alertas (🔴, 🟢, ⚠️).
3. SIEMPRE que el usuario pregunte sobre sus gastos, reportes, anomalías o proyecciones, USA LAS HERRAMIENTAS DISPONIBLES. NUNCA inventes datos.
4. Si el usuario te saluda, responde brevemente y ofrece ayuda con sus finanzas.
5. Contexto actual: El usuario tiene ID ${userId}. La fecha actual es ${new Date().toLocaleDateString('es-CO')}.
6. Responde siempre en español.

IMPORTANTE: Cuando el usuario pregunte por información financiera, DEBES usar las herramientas (functions) disponibles para obtener datos reales. No respondas con datos inventados.`;

        const openAIMessages = [
            { role: "system", content: systemPrompt },
            ...(context?.history || []),
            { role: "user", content: message }
        ];

        const { systemInstruction, contents } = this.convertMessagesToGemini(openAIMessages);
        const geminiTools = this.convertToolsToGemini(tools);

        try {
            const body: any = { contents };
            if (systemInstruction) body.systemInstruction = systemInstruction;
            if (geminiTools) body.tools = geminiTools;

            console.log('[Gemini] Sending request with tools:', geminiTools ? 'yes' : 'no');
            console.log('[Gemini] Request body:', JSON.stringify(body).substring(0, 800));

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[Gemini] Error Status:", response.status, response.statusText);
                console.error("[Gemini] Error Body:", errorText);
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[Gemini] Raw response:', JSON.stringify(data).substring(0, 500));
            return this.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error generating AI response:", error);
            return {
                content: "Lo siento, tuve un problema al procesar tu solicitud. Intenta más tarde.",
                role: "assistant"
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: "Error: No se ha configurado la API Key de Gemini. Por favor configura GEMINI_API_KEY en el archivo .env.",
                role: "assistant"
            };
        }

        const systemPrompt = `Eres un asistente financiero experto para la aplicación FinanzApp. 
Tu objetivo es ayudar al usuario a entender sus gastos, detectar anomalías y planificar mejor.

Reglas:
1. Sé conciso y amable.
2. Usa emojis para resaltar categorías o alertas (🔴, 🟢, ⚠️).
3. Analiza los datos proporcionados por las herramientas y presenta la información de forma clara.
4. Contexto actual: El usuario tiene ID ${userId}. La fecha actual es ${new Date().toLocaleDateString('es-CO')}.
5. Responde siempre en español.`;

        const allMessages = [
            { role: "system", content: systemPrompt },
            ...messages
        ];

        const { systemInstruction, contents } = this.convertMessagesToGemini(allMessages);
        const geminiTools = this.convertToolsToGemini(tools);

        try {
            const body: any = { contents };
            if (systemInstruction) body.systemInstruction = systemInstruction;
            if (geminiTools) body.tools = geminiTools;

            console.log('[Gemini] Sending follow-up request...');
            console.log('[Gemini] Follow-up contents count:', contents.length);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[Gemini] Error Status:", response.status, response.statusText);
                console.error("[Gemini] Error Body:", errorText);
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[Gemini] Follow-up raw response:', JSON.stringify(data).substring(0, 500));
            return this.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error continuing conversation:", error);
            return {
                content: "Lo siento, tuve un problema al continuar la conversación.",
                role: "assistant"
            };
        }
    }
}
