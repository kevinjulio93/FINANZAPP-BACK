import 'dotenv/config';
import { IOpenAIService } from '../../domain/services/Interfaces/IAnalysisService';
import { OllamaService } from './OllamaService';
import { GeminiService } from './GeminiService';

/**
 * Selecciona el proveedor de IA según AI_PROVIDER:
 *  - `gemini` → Gemini (Vertex AI / AI Studio)
 *  - `ollama` → Ollama Cloud (comportamiento anterior)
 */
export class AIServiceFactory {
    static createService(): IOpenAIService {
        const provider = (process.env.AI_PROVIDER || 'ollama').toLowerCase();

        if (provider === 'gemini' || provider === 'vertex') {
            const backend = (process.env.GEMINI_PROVIDER || 'vertex').toLowerCase();
            const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
            console.log(`Initializing AI Service with provider: gemini (${backend}, ${model})`);
            return new GeminiService();
        }

        console.log('Initializing AI Service with provider: ollama');
        return new OllamaService();
    }
}
