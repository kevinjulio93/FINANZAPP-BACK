import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { VERTEX_CONSTANTS } from "../../constants/vertex.constants";
import { VertexUtils } from "../../utils/vertex.utils";

export class VertexService implements IOpenAIService {
    private get apiKey(): string {
        return process.env.VERTEX_API_KEY || process.env.GEMINI_API_KEY || '';
    }

    private get baseUrl(): string {
        const model = process.env.VERTEX_MODEL || VERTEX_CONSTANTS.DEFAULT_MODEL;
        // Vertex AI API (AI Platform) endpoint as suggested by user
        return VERTEX_CONSTANTS.API_URL_TEMPLATE(model, this.apiKey);
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        if (!this.apiKey) {
            return {
                content: VERTEX_CONSTANTS.ERRORS.API_KEY_MISSING,
                role: VERTEX_CONSTANTS.ROLES.ASSISTANT
            };
        }

        const systemInstructionText = VertexUtils.buildSystemInstruction(context);

        const systemInstruction = {
            role: VERTEX_CONSTANTS.ROLES.USER,
            parts: [{
                text: systemInstructionText
            }]
        };

        const contents = [];

        // Add history
        if (context?.history) {
            // Optimization: Limit context to last 20 messages to improve latency
            const recentHistory = context.history.slice(-20);
            for (const msg of recentHistory) {
                if (msg.role === VERTEX_CONSTANTS.ROLES.SYSTEM) continue;
                contents.push({
                    role: msg.role === VERTEX_CONSTANTS.ROLES.ASSISTANT ? VERTEX_CONSTANTS.ROLES.MODEL : VERTEX_CONSTANTS.ROLES.USER,
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Add current message
        contents.push({
            role: VERTEX_CONSTANTS.ROLES.USER,
            parts: [{ text: message }]
        });

        const requestBody: any = {
            contents,
            systemInstruction: { parts: [{ text: systemInstruction.parts[0].text }] },
            generationConfig: VERTEX_CONSTANTS.GENERATION_CONFIG
        };

        if (tools && tools.length > 0) {
            const geminiTools = VertexUtils.mapOpenAIToolsToGemini(tools);
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
                throw new Error(`${VERTEX_CONSTANTS.ERRORS.API_ERROR_PREFIX} ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return VertexUtils.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error calling Vertex AI:", error);
            return {
                content: VERTEX_CONSTANTS.ERRORS.CONNECTION_FAILED,
                role: VERTEX_CONSTANTS.ROLES.ASSISTANT
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        const contents = [];
        let systemInstructionText = "";

        // Extract system instruction from the full history first
        const systemMsg = messages.find(m => m.role === VERTEX_CONSTANTS.ROLES.SYSTEM);
        if (systemMsg) {
            systemInstructionText = systemMsg.content;
        }

        // Optimization: Limit history to last 20 messages
        const recentMessages = messages.filter(m => m.role !== VERTEX_CONSTANTS.ROLES.SYSTEM).slice(-20);

        for (const msg of recentMessages) {
            // System messages are handled before this loop or ignored here since we filter them

            if (msg.role === 'tool') {
                try {
                    contents.push({
                        role: VERTEX_CONSTANTS.ROLES.FUNCTION,
                        parts: [{
                            functionResponse: {
                                name: msg.name,
                                response: { content: JSON.parse(msg.content) }
                            }
                        }]
                    });
                } catch (e) {
                    contents.push({
                        role: VERTEX_CONSTANTS.ROLES.FUNCTION,
                        parts: [{
                            functionResponse: {
                                name: msg.name,
                                response: { content: msg.content }
                            }
                        }]
                    });
                }
            } else if (msg.role === VERTEX_CONSTANTS.ROLES.ASSISTANT) {
                if (msg.tool_calls) {
                    const parts = msg.tool_calls.map((tc: any) => ({
                        functionCall: {
                            name: tc.function.name,
                            args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
                        }
                    }));
                    contents.push({ role: VERTEX_CONSTANTS.ROLES.MODEL, parts });
                } else {
                    contents.push({ role: VERTEX_CONSTANTS.ROLES.MODEL, parts: [{ text: msg.content || "" }] });
                }
            } else {
                contents.push({ role: VERTEX_CONSTANTS.ROLES.USER, parts: [{ text: msg.content }] });
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
            const geminiTools = VertexUtils.mapOpenAIToolsToGemini(tools);
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
                throw new Error(`${VERTEX_CONSTANTS.ERRORS.API_ERROR_PREFIX} ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return VertexUtils.convertGeminiResponse(data);

        } catch (error) {
            console.error("Error continuing Vertex conversation:", error);
            return {
                content: VERTEX_CONSTANTS.ERRORS.CONNECTION_FAILED,
                role: VERTEX_CONSTANTS.ROLES.ASSISTANT
            };
        }
    }
}
