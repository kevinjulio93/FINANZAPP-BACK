import 'dotenv/config';
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { VertexService } from "./VertexService";

export class AIServiceFactory {
    static createService(): IOpenAIService {
        console.log(`Initializing AI Service with provider: vertex`);
        return new VertexService();
    }
}
