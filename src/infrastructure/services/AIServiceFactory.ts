import 'dotenv/config';
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { OllamaService } from "./OllamaService";

export class AIServiceFactory {
    static createService(): IOpenAIService {
        console.log(`Initializing AI Service with provider: ollama`);
        return new OllamaService();
    }
}
