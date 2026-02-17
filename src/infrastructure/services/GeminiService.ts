import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";

export class GeminiService implements IOpenAIService {
    private get apiKey(): string {
        return process.env.GEMINI_API_KEY || '';
    }

    private get baseUrl(): string {
        return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${this.apiKey}`;
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: "Error: No se ha configurado la API Key de Gemini. Por favor configura GEMINI_API_KEY en el archivo .env.",
                role: "assistant"
            };
        }

        const systemInstruction = {
            role: "user",
            parts: [{
                text: `System: Eres el asistente financiero inteligente de FinanzApp.
Tu misión es ayudar al usuario a tomar mejores decisiones financieras analizando sus gastos e ingresos y resolviendo dudas sobre la aplicación.

📘 CONTEXTO Y MANUAL DE FINANZAPP:
1. 🏠 Dashboard: Vista general con "Spending by Service", "Monthly Expenses" y resumen de gastos totales.
2. 📂 Categorías y Servicios: 
   - Organiza gastos en Categorías (ej: Hogar, Alimentación).
   - Dentro de cada categoría, administra Servicios (ej: Alquiler, Supermercado).
3. 💳 Pagos:
   - Registro manual de gastos individuales.
   - 📤 Importar CSV: Permite cargar gastos masivos desde archivos bancarios.
   - 🔄 Comparar Meses: Herramienta para analizar variaciones de gastos entre dos periodos.
4. ⚙️ Configuración:
   - Cambio de moneda (USD/COP/EUR).
   - Cambio de idioma (ES/EN/FR).
   - Tema Claro/Oscuro.

REGLAS DE INTERACCIÓN:
1. 🛡️ PRIVACIDAD: NUNCA menciones IDs técnicos.
2. 📊 DATOS REALES: Si preguntan por gastos/anomalías/proyecciones, USA LAS HERRAMIENTAS (get_payment_report, etc).
3. 💬 ESTILO: Sé amable y usa emojis (💰, 📉, 🚨).
4. 📅 FECHA ACTUAL: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
5. 🌍 IDIOMA: Responde siempre en español.

${context?.financialContext ? `\n\n📊 DATOS FINANCIEROS ACTUALES DEL USUARIO:\n${context.financialContext}` : ""}`
            }]
        };

        const contents = [];

        // Add history
        if (context?.history) {
            for (const msg of context.history) {
                if (msg.role === 'system') continue;
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Add current message
        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        // Add system instruction as the first message part for better adherence in some models, 
        // or effectively prepended. Gemini supports system_instruction, but let's just make it context at start if SDK not used?
        // Actually REST API has `systemInstruction` field. Let's use that.
        // Wait, `systemInstruction` is a separate top-level field.
        const requestBody: any = {
            contents,
            systemInstruction: { parts: [{ text: systemInstruction.parts[0].text }] },
            generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                topK: 40
            }
        };

        if (tools && tools.length > 0) {
            const geminiTools = this.mapOpenAIToolsToGemini(tools);
            requestBody.tools = geminiTools;
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return this.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error calling Gemini:", error);
            return {
                content: "Lo siento, hubo un error al conectar con Gemini AI.",
                role: "assistant"
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        // Convert OpenAI message format to Gemini content format
        // This is tricky because we might have tool calls and tool results in the history.
        // Gemini expects a specific flow: user -> model (function call) -> function (function response) -> model.

        const contents = [];
        let systemInstructionText = "";

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstructionText = msg.content;
                continue;
            }

            if (msg.role === 'tool') {
                // OpenAI: role: tool, tool_call_id: "...", name: "...", content: "..."
                // Gemini: role: function, parts: [{ functionResponse: { name: "...", response: { ... } } }]
                try {
                    contents.push({
                        role: "function",
                        parts: [{
                            functionResponse: {
                                name: msg.name,
                                response: { content: JSON.parse(msg.content) }
                            }
                        }]
                    });
                } catch (e) {
                    // Fallback for non-JSON content
                    contents.push({
                        role: "function",
                        parts: [{
                            functionResponse: {
                                name: msg.name,
                                response: { content: msg.content }
                            }
                        }]
                    });
                }
            } else if (msg.role === 'assistant') {
                if (msg.tool_calls) {
                    // Assistant requested a tool call
                    // Gemini: role: model, parts: [{ functionCall: { name: "...", args: { ... } } }]
                    const parts = msg.tool_calls.map((tc: any) => ({
                        functionCall: {
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments)
                        }
                    }));
                    contents.push({ role: "model", parts });
                } else {
                    contents.push({ role: "model", parts: [{ text: msg.content }] });
                }
            } else {
                // User
                contents.push({ role: "user", parts: [{ text: msg.content }] });
            }
        }

        const requestBody: any = {
            contents,
            generationConfig: {
                temperature: 0.2
            }
        };

        if (systemInstructionText) {
            requestBody.systemInstruction = { parts: [{ text: systemInstructionText }] };
        }

        if (tools && tools.length > 0) {
            const geminiTools = this.mapOpenAIToolsToGemini(tools);
            requestBody.tools = geminiTools;
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return this.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error continuing Gemini conversation:", error);
            return {
                content: "Lo siento, error de conexión con Gemini.",
                role: "assistant"
            };
        }
    }

    private mapOpenAIToolsToGemini(tools: any[]): any[] {
        // Defines the tools available to the model.
        // Gemini expects: { function_declarations: [ ... ] }
        const functionDeclarations = tools.map(t => {
            const fn = t.function;
            // Gemini is very strict about types.
            // OpenAI params are JSON Schema. Gemini uses a subset.
            // We assume compatibility for now.
            return {
                name: fn.name,
                description: fn.description,
                parameters: fn.parameters
            };
        });

        return [{ function_declarations: functionDeclarations }];
    }

    private convertGeminiResponse(data: any): any {
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
            return { content: "No response from Gemini.", role: "assistant" };
        }

        const part = candidate.content.parts[0];

        // Check for function call
        if (part.functionCall) {
            // Convert to OpenAI tool_calls format
            // OpenAI: tool_calls: [{ id: "...", type: "function", function: { name: "...", arguments: "..." } }]
            // We generate a dummy ID because Gemini doesn't key them the same way in response loop
            const callId = `call_${Math.random().toString(36).substring(7)}`;

            return {
                role: "assistant",
                content: null,
                tool_calls: [{
                    id: callId,
                    type: "function",
                    function: {
                        name: part.functionCall.name,
                        arguments: JSON.stringify(part.functionCall.args)
                    }
                }]
            };
        }

        return {
            role: "assistant",
            content: part.text
        };
    }
}
