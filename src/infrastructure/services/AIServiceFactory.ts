import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { VertexService } from "./VertexService";
import dotenv from "dotenv";

dotenv.config();

export class AIServiceFactory {
    static createService(): IOpenAIService {
        console.log(`Initializing AI Service with provider: vertex`);
        return new VertexService();
    }
}
