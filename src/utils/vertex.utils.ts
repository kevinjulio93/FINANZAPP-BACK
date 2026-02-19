
import { VERTEX_CONSTANTS } from "../constants/vertex.constants";

export class VertexUtils {
    static mapOpenAIToolsToGemini(tools: any[]): any[] {
        const functionDeclarations = tools.map(t => {
            const fn = t.function;
            return {
                name: fn.name,
                description: fn.description,
                parameters: fn.parameters
            };
        });

        return [{ function_declarations: functionDeclarations }];
    }

    static convertGeminiResponse(data: any): any {
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
            return {
                content: VERTEX_CONSTANTS.ERRORS.NO_RESPONSE,
                role: VERTEX_CONSTANTS.ROLES.ASSISTANT
            };
        }

        const part = candidate.content.parts[0];

        if (part.functionCall) {
            const callId = `call_${Math.random().toString(36).substring(7)}`;

            return {
                role: VERTEX_CONSTANTS.ROLES.ASSISTANT,
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
            role: VERTEX_CONSTANTS.ROLES.ASSISTANT,
            content: part.text
        };
    }

    static getFormattedDate(): string {
        return new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static buildSystemInstruction(context?: any): string {
        const date = this.getFormattedDate();
        let prompt = VERTEX_CONSTANTS.SYSTEM_INSTRUCTION.replace("{CURRENT_DATE}", date);

        if (context?.financialContext) {
            prompt += `\n\n📊 DATOS FINANCIEROS ACTUALES DEL USUARIO:\n${context.financialContext}`;
        }
        return prompt;
    }
}
