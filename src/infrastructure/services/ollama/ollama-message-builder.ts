import { SYSTEM_INSTRUCTION_BASE, FINANCIAL_CONTEXT_HEADER, OLLAMA_CONFIG } from "./ollama.constants";

export class OllamaMessageBuilder {
    build(userMessage: string, context?: any): any[] {
        const messages: any[] = [];

        const systemContent = this.buildSystemInstruction(context?.financialContext);
        messages.push({ role: 'system', content: systemContent });

        if (context?.history) {
            const recentHistory = context.history.slice(-OLLAMA_CONFIG.MAX_HISTORY);
            for (const msg of recentHistory) {
                if (msg.role === 'system') continue;
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        messages.push({ role: 'user', content: userMessage });

        return messages;
    }

    private buildSystemInstruction(financialContext?: string): string {
        if (financialContext) {
            return `${SYSTEM_INSTRUCTION_BASE}${FINANCIAL_CONTEXT_HEADER}${financialContext}`;
        }
        return SYSTEM_INSTRUCTION_BASE;
    }
}
