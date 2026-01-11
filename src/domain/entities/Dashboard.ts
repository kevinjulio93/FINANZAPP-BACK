export interface IServiceStats {
    totalServices: number;
    totalEstimatedCost: number;
    totalPaidThisMonth: number;
    pendingPayments: number;
    overduePayments: number;
}

export interface IMostExpensiveService {
    serviceId: string;
    serviceName: string;
    categoryName: string;
    monthlyAmount: number;
}

export interface IMonthlyExpense {
    month: number;
    year: number;
    totalPaid: number;
    totalEstimated: number;
    servicesCount: number;
}

export interface ICategoryExpense {
    categoryId: string;
    categoryName: string;
    color: string;
    totalAmount: number;
    servicesCount: number;
    percentage: number;
}

export interface IPaymentTrend {
    month: string; // "2026-01"
    totalPaid: number;
    totalEstimated: number;
    variance: number; // diferencia entre pagado y estimado
}

export interface IDashboardData {
    overview: IServiceStats;
    mostExpensiveServices: IMostExpensiveService[];
    monthlyExpenses: IMonthlyExpense;
    expensesByCategory: ICategoryExpense[];
    paymentTrends: IPaymentTrend[]; // últimos 6 meses
    upcomingPayments: {
        serviceId: string;
        serviceName: string;
        amount: number;
        dueDate: Date;
        status: string;
    }[];
}
