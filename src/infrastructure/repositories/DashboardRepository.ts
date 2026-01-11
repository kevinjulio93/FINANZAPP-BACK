import { IDashboardRepository } from '../../domain/repositories/Interfaces/IDashboardRepository';
import { 
    IDashboardData, 
    IServiceStats, 
    IMostExpensiveService,
    IMonthlyExpense,
    ICategoryExpense,
    IPaymentTrend
} from '../../domain/entities/Dashboard';
import { ServiceModel } from '../models/Service.model';
import { CategoryModel } from '../models/Catergory.model';
import { PagoMensualModel } from '../models/PagoMensual.model';
import mongoose from 'mongoose';
import { EstadoServicio } from '../../domain/entities/Service';

export class DashboardRepository implements IDashboardRepository {
    
    async getDashboardData(userId: string, month: number, year: number): Promise<IDashboardData> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Overview Stats
        const overview = await this.getOverviewStats(userObjectId, month, year);
        
        // Most Expensive Services (top 5)
        const mostExpensiveServices = await this.getMostExpensiveServices(userObjectId);
        
        // Monthly Expenses (current month)
        const monthlyExpenses = await this.getMonthlyExpenses(userObjectId, month, year);
        
        // Expenses by Category
        const expensesByCategory = await this.getExpensesByCategory(userObjectId, month, year);
        
        // Payment Trends (last 6 months)
        const paymentTrends = await this.getPaymentTrends(userObjectId, month, year);
        
        // Upcoming Payments (next 7 days)
        const upcomingPayments = await this.getUpcomingPayments(userObjectId);
        
        return {
            overview,
            mostExpensiveServices,
            monthlyExpenses,
            expensesByCategory,
            paymentTrends,
            upcomingPayments,
        };
    }
    
    private async getOverviewStats(userId: mongoose.Types.ObjectId, month: number, year: number): Promise<IServiceStats> {
        const services = await ServiceModel.find({ userId }).lean();
        
        const totalServices = services.length;
        const totalEstimatedCost = services.reduce((sum, s) => sum + s.montoEstimado, 0);
        
        // Pagos del mes actual
        const pagosMes = await PagoMensualModel.find({
            mes: month,
            año: year,
        }).lean();
        
        const serviceIds = services.map(s => s._id);
        const pagosUsuario = pagosMes.filter(p => 
            serviceIds.some(id => id.toString() === p.serviceId.toString())
        );
        
        const totalPaidThisMonth = pagosUsuario.reduce((sum, p) => sum + p.valorPagado, 0);
        
        const pendingPayments = services.filter(s => s.estado === EstadoServicio.PENDIENTE).length;
        const overduePayments = services.filter(s => s.estado === EstadoServicio.VENCIDO).length;
        
        return {
            totalServices,
            totalEstimatedCost,
            totalPaidThisMonth,
            pendingPayments,
            overduePayments,
        };
    }
    
    private async getMostExpensiveServices(userId: mongoose.Types.ObjectId): Promise<IMostExpensiveService[]> {
        const services = await ServiceModel
            .find({ userId })
            .sort({ montoEstimado: -1 })
            .limit(5)
            .populate('categoryId')
            .lean();
        
        return services.map(s => ({
            serviceId: s._id.toString(),
            serviceName: s.name,
            categoryName: (s.categoryId as any)?.name || 'Sin categoría',
            monthlyAmount: s.montoEstimado,
        }));
    }
    
    private async getMonthlyExpenses(userId: mongoose.Types.ObjectId, month: number, year: number): Promise<IMonthlyExpense> {
        const services = await ServiceModel.find({ userId }).lean();
        const serviceIds = services.map(s => s._id);
        
        const pagos = await PagoMensualModel.find({
            serviceId: { $in: serviceIds },
            mes: month,
            año: year,
        }).lean();
        
        const totalPaid = pagos.reduce((sum, p) => sum + p.valorPagado, 0);
        const totalEstimated = services.reduce((sum, s) => sum + s.montoEstimado, 0);
        
        return {
            month,
            year,
            totalPaid,
            totalEstimated,
            servicesCount: services.length,
        };
    }
    
    private async getExpensesByCategory(userId: mongoose.Types.ObjectId, month: number, year: number): Promise<ICategoryExpense[]> {
        const services = await ServiceModel
            .find({ userId })
            .populate('categoryId')
            .lean();
        
        const serviceIds = services.map(s => s._id);
        const pagos = await PagoMensualModel.find({
            serviceId: { $in: serviceIds },
            mes: month,
            año: year,
        }).lean();
        
        const categoryMap = new Map<string, ICategoryExpense>();
        
        for (const service of services) {
            const category = service.categoryId as any;
            const categoryId = category?._id?.toString() || 'uncategorized';
            const categoryName = category?.name || 'Sin categoría';
            const categoryColor = category?.color || '#CCCCCC';
            
            // Buscar pagos de este servicio
            const servicePagos = pagos.filter(p => p.serviceId.toString() === service._id.toString());
            const totalPaid = servicePagos.reduce((sum, p) => sum + p.valorPagado, 0);
            
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, {
                    categoryId,
                    categoryName,
                    color: categoryColor,
                    totalAmount: 0,
                    servicesCount: 0,
                    percentage: 0,
                });
            }
            
            const categoryData = categoryMap.get(categoryId)!;
            categoryData.totalAmount += totalPaid > 0 ? totalPaid : service.montoEstimado;
            categoryData.servicesCount += 1;
        }
        
        const expenses = Array.from(categoryMap.values());
        const total = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
        
        expenses.forEach(e => {
            e.percentage = total > 0 ? (e.totalAmount / total) * 100 : 0;
        });
        
        return expenses.sort((a, b) => b.totalAmount - a.totalAmount);
    }
    
    private async getPaymentTrends(userId: mongoose.Types.ObjectId, currentMonth: number, currentYear: number): Promise<IPaymentTrend[]> {
        const services = await ServiceModel.find({ userId }).lean();
        const serviceIds = services.map(s => s._id);
        
        const trends: IPaymentTrend[] = [];
        
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            let month = currentMonth - i;
            let year = currentYear;
            
            if (month <= 0) {
                month += 12;
                year -= 1;
            }
            
            const pagos = await PagoMensualModel.find({
                serviceId: { $in: serviceIds },
                mes: month,
                año: year,
            }).lean();
            
            const totalPaid = pagos.reduce((sum, p) => sum + p.valorPagado, 0);
            const totalEstimated = services.reduce((sum, s) => sum + s.montoEstimado, 0);
            
            trends.push({
                month: `${year}-${month.toString().padStart(2, '0')}`,
                totalPaid,
                totalEstimated,
                variance: totalPaid - totalEstimated,
            });
        }
        
        return trends;
    }
    
    private async getUpcomingPayments(userId: mongoose.Types.ObjectId): Promise<any[]> {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const services = await ServiceModel
            .find({
                userId,
                proximoPago: { $gte: today, $lte: nextWeek },
            })
            .sort({ proximoPago: 1 })
            .lean();
        
        return services.map(s => ({
            serviceId: s._id.toString(),
            serviceName: s.name,
            amount: s.montoEstimado,
            dueDate: s.proximoPago,
            status: s.estado,
        }));
    }
}
