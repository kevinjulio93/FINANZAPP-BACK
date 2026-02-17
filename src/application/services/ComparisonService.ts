import { IPagoRepository } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";

interface ComparisonRow {
    serviceId: string;
    serviceName: string;
    months: Record<string, number | null>; // "2026-01" => 150000
    iaAnalysis: string;
    actionSuggested: string;
}

interface ComparisonResult {
    rows: ComparisonRow[];
    totals: Record<string, number>;
    iaSummary: string;
}

export class ComparisonService {
    constructor(
        private pagoRepository: IPagoRepository,
        private serviceRepository: IServiceRepository,
        private openAIService: IOpenAIService
    ) { }

    /**
     * Generate comparison table for selected months with IA insights
     */
    async compareMonths(userId: string, months: Array<{ mes: number; año: number }>): Promise<ComparisonResult> {
        if (months.length < 2 || months.length > 12) {
            throw new Error('Selecciona entre 2 y 12 meses para comparar');
        }

        // 1. Get all services
        const services = await this.serviceRepository.findByUserId(userId);
        const serviceMap = new Map<string, string>();
        services.forEach((s: any) => {
            serviceMap.set((s._id || s.id).toString(), s.name);
        });

        // 2. Fetch payments for each month
        const monthlyData: Record<string, any[]> = {};
        for (const { mes, año } of months) {
            const key = `${año}-${String(mes).padStart(2, '0')}`;
            const payments = await this.pagoRepository.findByMonth(userId, mes, año);
            monthlyData[key] = payments;
        }

        // 3. Build comparison rows
        const monthKeys = months.map(m => `${m.año}-${String(m.mes).padStart(2, '0')}`);
        const rows: ComparisonRow[] = [];

        for (const [serviceId, serviceName] of serviceMap) {
            const monthValues: Record<string, number | null> = {};

            for (const key of monthKeys) {
                const payment = monthlyData[key]?.find((p: any) => {
                    const pServiceId = (p.serviceId as any)?._id?.toString() || p.serviceId?.toString();
                    return pServiceId === serviceId;
                });
                monthValues[key] = payment ? (payment as any).valorPagado : null;
            }

            // Only include services that have at least one payment
            const hasData = Object.values(monthValues).some(v => v !== null);
            if (!hasData) continue;

            rows.push({
                serviceId,
                serviceName,
                months: monthValues,
                iaAnalysis: '', // Will be filled by IA
                actionSuggested: ''
            });
        }

        // 4. Calculate totals
        const totals: Record<string, number> = {};
        for (const key of monthKeys) {
            totals[key] = rows.reduce((sum, row) => sum + (row.months[key] || 0), 0);
        }

        // 5. IA analysis
        const comparisonData = rows.map(r => ({
            service: r.serviceName,
            values: monthKeys.map(k => ({ month: k, amount: r.months[k] }))
        }));

        const iaPrompt = `Analiza esta comparación de gastos mensuales y da insights por servicio.

DATOS:
${JSON.stringify(comparisonData)}

TOTALES POR MES:
${JSON.stringify(totals)}

Para cada servicio, responde con JSON array:
- service: nombre del servicio
- analysis: texto breve de tendencia (ej: "Tendencia alcista +10%", "Estable ±2%", "Pico inusual +15%")
- action: emoji + acción sugerida (ej: "📈 Monitorear", "✅ OK", "❓ Revisar", "⚠️ Presupuesto")

Al final incluye un campo "summary" con resumen general.

Responde en formato: { "rows": [...], "summary": "..." }
SOLO JSON, SIN MARKDOWN.`;

        try {
            const iaResponse = await this.openAIService.generateResponse(userId, iaPrompt, {}, undefined);
            const iaContent = iaResponse.content || '';

            let iaData: any;
            try {
                const jsonMatch = iaContent.match(/\{[\s\S]*\}/);
                iaData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(iaContent);
            } catch {
                console.error('[ComparisonService] Failed to parse IA response');
                iaData = { rows: [], summary: 'Análisis IA no disponible' };
            }

            // Merge IA insights into rows
            for (const row of rows) {
                const iaRow = iaData.rows?.find((r: any) =>
                    r.service?.toLowerCase() === row.serviceName.toLowerCase()
                );
                if (iaRow) {
                    row.iaAnalysis = iaRow.analysis || '';
                    row.actionSuggested = iaRow.action || '';
                } else {
                    // Calculate basic trend without IA
                    const values = Object.values(row.months).filter(v => v !== null) as number[];
                    if (values.length >= 2) {
                        const first = values[0];
                        const last = values[values.length - 1];
                        const pct = Math.round(((last - first) / first) * 100);
                        row.iaAnalysis = `${pct > 0 ? '+' : ''}${pct}% cambio`;
                        row.actionSuggested = Math.abs(pct) > 20 ? '⚠️ Revisar' : '✅ OK';
                    }
                }
            }

            return {
                rows,
                totals,
                iaSummary: iaData.summary || ''
            };
        } catch {
            // Fallback without IA
            for (const row of rows) {
                const values = Object.values(row.months).filter(v => v !== null) as number[];
                if (values.length >= 2) {
                    const first = values[0];
                    const last = values[values.length - 1];
                    const pct = Math.round(((last - first) / first) * 100);
                    row.iaAnalysis = `${pct > 0 ? '+' : ''}${pct}% cambio`;
                    row.actionSuggested = Math.abs(pct) > 20 ? '⚠️ Revisar' : '✅ OK';
                }
            }

            return { rows, totals, iaSummary: 'Análisis IA no disponible' };
        }
    }
}
