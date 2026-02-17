import { IAnalysisService } from "../../domain/services/Interfaces/IAnalysisService";
import { IPagoRepository } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";

export class AnalysisService implements IAnalysisService {
    private pagoRepository: IPagoRepository;
    private serviceRepository: IServiceRepository;

    constructor(pagoRepository: IPagoRepository, serviceRepository: IServiceRepository) {
        this.pagoRepository = pagoRepository;
        this.serviceRepository = serviceRepository;
    }

    async analyzeUserFinances(userId: string): Promise<any> {
        const anomalies = await this.getAnomalies(userId);
        const projections = await this.getProjections(userId);

        return {
            anomalies,
            projections,
            insights: this.generateInsights(anomalies, projections)
        };
    }

    async getAnomalies(userId: string): Promise<any[]> {
        const services = await this.serviceRepository.findByUserId(userId);
        const anomalies: any[] = [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        const currentPayments = await this.pagoRepository.findByMonth(userId, currentMonth, currentYear);

        for (const service of services) {
            const rawServiceId = (service as any)._id?.toString() || service.id;
            if (!rawServiceId) continue;

            const servicePayment = currentPayments.find(p => {
                const pServiceId = (p.serviceId as any)._id
                    ? (p.serviceId as any)._id.toString()
                    : p.serviceId.toString();
                return pServiceId === rawServiceId;
            });

            if (servicePayment) {
                const stats = await this.pagoRepository.getServiceAverages(userId, rawServiceId);

                if (stats && stats.length > 0) {
                    const avg = stats[0].avgPago;
                    const valor = servicePayment.valorPagado;

                    if (avg > 0) {
                        const diff = valor - avg;
                        const percentage = (diff / avg) * 100;

                        if (Math.abs(percentage) > 20) {
                            anomalies.push({
                                type: percentage > 0 ? 'HIGH_SPEND' : 'LOW_SPEND',
                                serviceId: rawServiceId,
                                serviceName: service.name,
                                currentAmount: valor,
                                averageAmount: Math.round(avg),
                                percentageDiff: Math.round(percentage),
                                month: currentMonth,
                                year: currentYear
                            });
                        }
                    }
                }
            }
        }
        return anomalies;
    }

    async getProjections(userId: string): Promise<any> {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        const last3Months = [];
        for (let i = 1; i <= 3; i++) {
            let m = currentDate.getMonth() + 1 - i;
            let y = currentYear;
            if (m <= 0) {
                m += 12;
                y -= 1;
            }
            last3Months.push({ m, y });
        }

        let totalAvg = 0;
        let monthsCount = 0;

        for (const { m, y } of last3Months) {
            const report = await this.pagoRepository.getPaymentReport(userId, m, y);
            if (report.totalGastado > 0) {
                totalAvg += report.totalGastado;
                monthsCount++;
            }
        }

        const baseline = monthsCount > 0 ? totalAvg / monthsCount : 0;

        const projections = [];
        for (let i = 1; i <= 6; i++) {
            const factor = 1 + (0.005 * i);

            let nextM = currentDate.getMonth() + 1 + i;
            let nextY = currentYear;
            if (nextM > 12) {
                nextM -= 12;
                nextY += 1;
            }

            projections.push({
                month: nextM,
                year: nextY,
                amount: Math.round(baseline * factor)
            });
        }

        return {
            baseline,
            forecast: projections
        };
    }

    private generateInsights(anomalies: any[], projections: any): string[] {
        const insights = [];

        if (anomalies.length > 0) {
            const high = anomalies.filter(a => a.type === 'HIGH_SPEND');
            if (high.length > 0) {
                insights.push(`Detecté ${high.length} gastos inusuales este mes (más de 20% promedio).`);
            }
        }

        if (projections.forecast.length > 0) {
            const nextMonth = projections.forecast[0];
            insights.push(`Se proyecta un gasto de $${nextMonth.amount} para el próximo mes.`);
        }

        return insights;
    }
}
