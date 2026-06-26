import { IAnalysisService, IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { IPagoRepository } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";
import { IDashboardRepository } from "../../domain/repositories/Interfaces/IDashboardRepository";
import { AnalysisService } from "./AnalysisService";

export class ChatService {
    private analysisService: AnalysisService;
    private openAIService: IOpenAIService;
    private pagoRepository: IPagoRepository;
    private serviceRepository: IServiceRepository;
    private categoryRepository: ICategoryRepository;
    private dashboardRepository: IDashboardRepository;

    constructor(
        analysisService: AnalysisService,
        openAIService: IOpenAIService,
        pagoRepository: IPagoRepository,
        serviceRepository: IServiceRepository,
        categoryRepository: ICategoryRepository,
        dashboardRepository: IDashboardRepository
    ) {
        this.analysisService = analysisService;
        this.openAIService = openAIService;
        this.pagoRepository = pagoRepository;
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
        this.dashboardRepository = dashboardRepository;
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
            },
            {
                type: "function",
                function: {
                    name: "get_services",
                    description: "Obtiene todos los servicios del usuario con su estado, monto estimado y fecha límite de pago.",
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
                    name: "get_categories",
                    description: "Obtiene todas las categorías del usuario con su color.",
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
                    name: "get_dashboard",
                    description: "Obtiene las métricas del dashboard: resumen de gastos, servicios más caros, gastos por categoría, tendencias de pago y próximos pagos.",
                    parameters: {
                        type: "object",
                        properties: {
                            mes: { type: "number", description: "Mes (1-12), opcional. Por defecto mes actual." },
                            año: { type: "number", description: "Año (YYYY), opcional. Por defecto año actual." }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_upcoming_payments",
                    description: "Obtiene los servicios próximos a vencer (próximos 7 días) y los servicios vencidos.",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            }
        ];

        // 0. Fetch financial context
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        let financialContext = "";

        try {
            const report = await this.pagoRepository.getPaymentReport(userId, currentMonth, currentYear);
            if (report) {
                financialContext = `Estado Financiero Actual (${currentMonth}/${currentYear}):
- Total Gastado este mes: $${report.totalGastado}
- Desglose por Categorías: ${report.porCategoria.map((c: any) => `${c.categoryName}: $${c.total}`).join(", ")}
- Top 5 Gastos: ${report.topExpenses.map((t: any) => `${t.merchant} ($${t.amount})`).join(", ")}`;
            }
        } catch (error) {
            console.error("Error fetching financial context:", error);
        }

        // 1. Initial call to LLM
        let aiResponse = await this.openAIService.generateResponse(userId, message, { history, financialContext }, tools);

        // 2. Handle tool calls if any
        if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
            const toolResults = [];

            for (const toolCall of aiResponse.tool_calls) {
                const fnName = toolCall.function.name;
                const args = typeof toolCall.function.arguments === 'string'
                    ? JSON.parse(toolCall.function.arguments)
                    : toolCall.function.arguments;
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

                        case "get_services":
                            const services = await this.serviceRepository.findByUserId(userId);
                            result = services.map((s: any) => ({
                                name: s.name,
                                montoEstimado: s.montoEstimado,
                                estado: s.estado,
                                fechaLimitePago: s.fechaLimitePago,
                                categoria: s.categoryId,
                            }));
                            break;

                        case "get_categories":
                            const categories = await this.categoryRepository.findByUserId(userId);
                            result = categories.map((c: any) => ({
                                name: c.name,
                                color: c.color,
                            }));
                            break;

                        case "get_dashboard":
                            const month = args.mes || currentMonth;
                            const dashYear = args.año || currentYear;
                            result = await this.dashboardRepository.getDashboardData(userId, month, dashYear);
                            break;

                        case "get_upcoming_payments":
                            const allServices = await this.serviceRepository.findByUserId(userId);
                            const today = new Date();
                            const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                            result = {
                                proximosAVencer: allServices
                                    .filter((s: any) => s.fechaLimitePago && s.fechaLimitePago >= today && s.fechaLimitePago <= sevenDaysFromNow)
                                    .map((s: any) => ({
                                        name: s.name,
                                        monto: s.montoEstimado,
                                        vence: s.fechaLimitePago,
                                        estado: s.estado,
                                    })),
                                vencidos: allServices
                                    .filter((s: any) => s.fechaLimitePago && s.fechaLimitePago < today && s.estado !== 'PAGADO')
                                    .map((s: any) => ({
                                        name: s.name,
                                        monto: s.montoEstimado,
                                        vence: s.fechaLimitePago,
                                        estado: s.estado,
                                    })),
                            };
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
