import { Ollama } from 'ollama';
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { OllamaMessageBuilder } from "./ollama/ollama-message-builder";
import { OllamaResponseParser } from "./ollama/ollama-response-parser";
import { OLLAMA_CONFIG, OLLAMA_ERRORS } from "./ollama/ollama.constants";

export class OllamaService implements IOpenAIService {
    private ollama: Ollama;
    private model: string;
    private messageBuilder: OllamaMessageBuilder;
    private responseParser: OllamaResponseParser;

    constructor() {
        this.ollama = new Ollama({
            host: process.env.OLLAMA_HOST || OLLAMA_CONFIG.DEFAULT_HOST,
            headers: {
                Authorization: 'Bearer ' + (process.env.OLLAMA_API_KEY || ''),
            },
        });
        this.model = process.env.OLLAMA_MODEL || OLLAMA_CONFIG.DEFAULT_MODEL;
        this.messageBuilder = new OllamaMessageBuilder();
        this.responseParser = new OllamaResponseParser();
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        const messages = this.messageBuilder.build(message, context);

        try {
            const options: any = {
                model: this.model,
                messages,
                stream: OLLAMA_CONFIG.DEFAULT_STREAM,
            };

            if (tools && tools.length > 0) {
                options.tools = tools;
            }

            const response = await this.ollama.chat(options) as any;
            return this.responseParser.parse(response);

        } catch (error) {
            console.error("Error calling Ollama:", error);
            return {
                content: OLLAMA_ERRORS.CONNECTION_FAILED,
                role: 'assistant',
            };
        }
    }

    async continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any> {
        try {
            const options: any = {
                model: this.model,
                messages,
                stream: OLLAMA_CONFIG.DEFAULT_STREAM,
            };

            if (tools && tools.length > 0) {
                options.tools = tools;
            }

            const response = await this.ollama.chat(options) as any;
            return this.responseParser.parse(response);

        } catch (error) {
            console.error("Error continuing Ollama conversation:", error);
            return {
                content: OLLAMA_ERRORS.CONNECTION_FAILED,
                role: 'assistant',
            };
        }
    }
}
