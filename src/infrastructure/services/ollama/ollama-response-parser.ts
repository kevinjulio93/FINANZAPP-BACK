export class OllamaResponseParser {
    parse(response: any): any {
        return {
            role: 'assistant',
            content: response.message?.content,
            tool_calls: this.parseToolCalls(response.message?.tool_calls),
        };
    }

    private parseToolCalls(toolCalls: any[] | undefined): any[] | undefined {
        if (!toolCalls || toolCalls.length === 0) return undefined;

        return toolCalls.map((tc: any) => ({
            id: tc.id || this.generateCallId(),
            type: 'function',
            function: {
                name: tc.function.name,
                arguments: JSON.stringify(tc.function.arguments),
            },
        }));
    }

    private generateCallId(): string {
        return `call_${Math.random().toString(36).substring(7)}`;
    }
}
