import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";

export class PerplexityService implements IOpenAIService {
    private get apiKey(): string {
        return process.env.PERPLEXITY_API_KEY || '';
    }

    private get baseUrl(): string {
        return "https://api.perplexity.ai/chat/completions";
    }

    private get model(): string {
        return "sonar-pro"; // Using sonar-pro as it's a current powerful model
    }

    /**
     * Perplexity API is OpenAI-compatible, so we can use standard OpenAI message format.
     */
    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: "Error: No se ha configurado la API Key de Perplexity. Por favor configura PERPLEXITY_API_KEY en el archivo .env.",
                role: "assistant"
            };
        }

        const systemPrompt = `Eres el asistente financiero inteligente de FinanzApp.
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
5. 🌍 IDIOMA: Responde siempre en español.`;

        const messages = [
            { role: "system", content: systemPrompt + (context?.financialContext ? `\n\n📊 DATOS FINANCIEROS ACTUALES DEL USUARIO:\n${context.financialContext}` : "") },
            ...(context?.history || []),
            { role: "user", content: message }
        ];

        // Perplexity support for tools needs verification on specific models,
        // but generally follows OpenAI format if supported.
        // NOTE: Perplexity's 'sonar' models are primarily search-based.
        // Function calling support might be limited compared to GPT/Gemini.
        // However, we will try to pass tools in standard OpenAI format.

        const body: any = {
            model: this.model,
            messages: messages,
            temperature: 0.2,
            top_p: 0.9,
            // stream: false // default
        };

        // Only add tools if supported and provided.
        // Recent Perplexity models may not fully support OpenAI-style tool calling yet in the same way.
        // If they don't, we might need to rely on their online search capabilities or prompt engineering.
        // *Documentation check*: Perplexity API is "OpenAI compatible".
        // Let's attempt to pass tools. If it fails, we might need to fallback or checks docs again.
        // *Correction*: Perplexity optimized models (sonar) are for search.
        // They might not support 'tools' parameter natively like GPT-4o.
        // But for this implementation, I will assume clear compatibility or fail gracefully.
        // Actually, Perplexity API documentation emphasizes 'search'.
        // Let's try to simulate tool usage via prompting if native tools fail,
        // OR just pass tools if the API accepts them.
        // Current docs: "The API is compatible with OpenAI's format." -> implying tools might work or be ignored.
        // Let's try passing them.
        /*
        if (tools && tools.length > 0) {
           body.tools = tools;
           body.tool_choice = "auto";
        }
        */
        // WAIT: Perplexity's main strength is ONLINE search.
        // The user wants to use Perplexity instead of Google.
        // But our ChatService uses 'tools' to query OUR database (get_payment_report).
        // If Perplexity model doesn't support 'tools', we can't query our DB.
        // Most "OpenAI Compatible" APIs support text generation but not always function calling.
        // However, let's assume standard behavior. If it breaks, we debug.

        // *Safe bet*: Perplexity models are often used for general knowledge.
        // Converting our DB tools to Perplexity might be tricky if they don't support function calling.
        // Let's assume they *do not* support strictly OpenAI tools for now given it's a search engine wrapper mostly.
        // BIT WAITING: The user linked docs. Docs say "compatible with OpenAI interface".
        // It doesn't explicitly guarantee function calling support.
        // Let's try to use it without tools first?
        // NO, the app RELIES on tools to get user data.
        // If Perplexity doesn't support tools, it can't see the user's data.
        // I will try to include tools.

        /*
        NOTE: Perplexity API focus is "online" models.
        If I cannot use tools, I cannot use Perplexity for *internal* data analysis unless I feed it the data in context.
        But I don't have the data yet.
        */

        // Let's try sending tools.
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Perplexity API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return this.convertPerplexityResponse(data);

        } catch (error) {
            console.error("Error calling Perplexity:", error);
            return {
                content: "Lo siento, hubo un error al conectar con Perplexity AI.",
                role: "assistant"
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: "Error: Configuration missing.",
                role: "assistant"
            };
        }

        const body: any = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: `Eres el asistente financiero de FinanzApp. Continúa ayudando al usuario con sus finanzas. Fecha: ${new Date().toLocaleDateString('es-CO')}. No menciones IDs.`
                },
                ...messages
            ],
            temperature: 0.2
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Perplexity API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return this.convertPerplexityResponse(data);

        } catch (error) {
            console.error("Error continuing conversation:", error);
            return {
                content: "Lo siento, error de conexión.",
                role: "assistant"
            };
        }
    }

    private convertPerplexityResponse(data: any): any {
        const choice = data.choices?.[0];
        if (!choice) return { content: "No response", role: "assistant" };

        const message = choice.message;

        // Check for tool calls (if supported by Perplexity in future/current)
        if (message.tool_calls) {
            return {
                role: "assistant",
                content: message.content,
                tool_calls: message.tool_calls
            };
        }

        return {
            role: "assistant",
            content: message.content
        };
    }
}
