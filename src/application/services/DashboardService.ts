import { IDashboardRepository } from '../../domain/repositories/Interfaces/IDashboardRepository';
import { IDashboardData } from '../../domain/entities/Dashboard';

export class DashboardService {
    constructor(private dashboardRepository: IDashboardRepository) {}
    
    async getDashboardData(userId: string, month?: number, year?: number): Promise<IDashboardData> {
        const now = new Date();
        const currentMonth = month || now.getMonth() + 1;
        const currentYear = year || now.getFullYear();
        
        return this.dashboardRepository.getDashboardData(userId, currentMonth, currentYear);
    }
    
    async getMonthlyComparison(userId: string, month: number, year: number) {
        const currentMonth = await this.dashboardRepository.getDashboardData(userId, month, year);
        
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        
        const previousMonth = await this.dashboardRepository.getDashboardData(userId, prevMonth, prevYear);
        
        return {
            current: currentMonth.monthlyExpenses,
            previous: previousMonth.monthlyExpenses,
            comparison: {
                paidDifference: currentMonth.monthlyExpenses.totalPaid - previousMonth.monthlyExpenses.totalPaid,
                paidPercentageChange: previousMonth.monthlyExpenses.totalPaid > 0 
                    ? ((currentMonth.monthlyExpenses.totalPaid - previousMonth.monthlyExpenses.totalPaid) / previousMonth.monthlyExpenses.totalPaid) * 100
                    : 0,
                estimatedDifference: currentMonth.monthlyExpenses.totalEstimated - previousMonth.monthlyExpenses.totalEstimated,
            }
        };
    }
}
