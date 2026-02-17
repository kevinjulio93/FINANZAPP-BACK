import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { PerplexityService } from "./PerplexityService";
import { GeminiService } from "./GeminiService";
import dotenv from "dotenv";

dotenv.config();

export class AIServiceFactory {
    static createService(): IOpenAIService {
        const provider = process.env.AI_PROVIDER || 'perplexity';

        console.log(`Initializing AI Service with provider: ${provider}`);

        if (provider.toLowerCase() === 'gemini') {
            return new GeminiService();
        }

        return new PerplexityService();
    }
}
