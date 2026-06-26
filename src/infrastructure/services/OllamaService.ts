import { Ollama } from 'ollama';
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { OllamaMessageBuilder } from "./ollama/ollama-message-builder";
import { OllamaResponseParser } from "./ollama/ollama-response-parser";
import { OllamaKnowledgeRetriever } from "./ollama/ollama-knowledge-retriever";
import { OllamaMessageFilter } from "./ollama/ollama-message-filter";
import { OLLAMA_CONFIG, OLLAMA_ERRORS } from "./ollama/ollama.constants";

export class OllamaService implements IOpenAIService {
    private ollama: Ollama;
    private model: string;
    private messageBuilder: OllamaMessageBuilder;
    private responseParser: OllamaResponseParser;
    private knowledgeRetriever: OllamaKnowledgeRetriever;
    private messageFilter: OllamaMessageFilter;

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
        this.knowledgeRetriever = new OllamaKnowledgeRetriever();
        this.messageFilter = new OllamaMessageFilter();
    }

    async generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any> {
        // Filter blocked messages before sending to the model
        const filterResult = this.messageFilter.filter(message);
        if (filterResult.blocked) {
            return {
                role: 'assistant',
                content: filterResult.response,
            };
        }

        // Retrieve relevant knowledge from the knowledge base
        const knowledge = this.knowledgeRetriever.retrieve(message);
        const enrichedContext = { ...context, knowledge };

        const messages = this.messageBuilder.build(message, enrichedContext);

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

    async *generateResponseStream(userId: string, message: string, context?: any, tools?: any[]): AsyncGenerator<string, void, unknown> {
        // Filter blocked messages
        const filterResult = this.messageFilter.filter(message);
        if (filterResult.blocked) {
            yield filterResult.response!;
            return;
        }

        // Retrieve relevant knowledge
        const knowledge = this.knowledgeRetriever.retrieve(message);
        const enrichedContext = { ...context, knowledge };
        const chatMessages = this.messageBuilder.build(message, enrichedContext);

        try {
            const options: any = {
                model: this.model,
                messages: chatMessages,
                stream: true,
            };

            if (tools && tools.length > 0) {
                options.tools = tools;
            }

            const stream = await this.ollama.chat(options) as any;

            for await (const chunk of stream) {
                if (chunk.message?.content) {
                    yield chunk.message.content;
                }
            }
        } catch (error) {
            console.error("Error streaming Ollama:", error);
            yield OLLAMA_ERRORS.CONNECTION_FAILED;
        }
    }
}
