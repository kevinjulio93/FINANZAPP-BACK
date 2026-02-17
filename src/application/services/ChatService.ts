import { IAnalysisService, IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { IPagoRepository } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { AnalysisService } from "./AnalysisService";

export class ChatService {
    private analysisService: AnalysisService;
    private openAIService: IOpenAIService;
    private pagoRepository: IPagoRepository;
    private serviceRepository: IServiceRepository;

    constructor(
        analysisService: AnalysisService,
        openAIService: IOpenAIService,
        pagoRepository: IPagoRepository,
        serviceRepository: IServiceRepository
    ) {
        this.analysisService = analysisService;
        this.openAIService = openAIService;
        this.pagoRepository = pagoRepository;
        this.serviceRepository = serviceRepository;
    }

    async processMessage(userId: string, message: string, history: any[] = []): Promise<any> {
        // Define available tools
        const tools = [
            {
                type: "function",
                function: {
                    name: "get_payment_report",
                    description: "Obtiene un reporte detallado de gastos para un mes y año específicos, o el año completo si no se especifica mes.",
                    parameters: {
                        type: "object",
                        properties: {
                            mes: { type: "number", description: "Mes (1-12), opcional." },
                            año: { type: "number", description: "Año (YYYY), por defecto actual." }
                        },
                        required: ["año"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_anomalies",
                    description: "Detecta gastos inusuales (anomalías) en el mes actual comparado con el promedio histórico.",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_projections",
                    description: "Genera una proyección de gastos para los próximos 6 meses.",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            }
        ];

        // 1. Initial call to LLM
        let aiResponse = await this.openAIService.generateResponse(userId, message, { history }, tools);

        // 2. Handle tool calls if any
        if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
            const toolResults = [];

            for (const toolCall of aiResponse.tool_calls) {
                const fnName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = null;

                console.log(`Executing tool: ${fnName}`, args);

                try {
                    switch (fnName) {
                        case "get_payment_report":
                            const year = args.año || new Date().getFullYear();
                            result = await this.pagoRepository.getPaymentReport(userId, args.mes, year);
                            // Simplify result for LLM (reduce token usage)
                            if (result.porCategoria) {
                                result.porCategoria = result.porCategoria.map((c: any) => ({
                                    category: c.categoryName,
                                    total: c.total,
                                    services: c.servicios.map((s: any) => `${s.serviceName}: $${s.total}`)
                                }));
                            }
                            delete result.mes;
                            delete result.año;
                            delete result.topExpenses;
                            break;

                        case "get_anomalies":
                            result = await this.analysisService.getAnomalies(userId);
                            break;

                        case "get_projections":
                            result = await this.analysisService.getProjections(userId);
                            break;

                        default:
                            result = { error: "Function not found" };
                    }
                } catch (err: any) {
                    result = { error: err.message };
                }

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: fnName,
                    content: JSON.stringify(result)
                });
            }

            // 3. Second call to LLM with tool results
            const messagesForFollowUp = [
                ...(history || []),
                { role: "user", content: message },
                aiResponse, // Assistant message requesting tool call
                ...toolResults // Tool outputs
            ];

            aiResponse = await this.openAIService.continueConversation(userId, messagesForFollowUp, tools);
        }

        return aiResponse;
    }
}
