import { DashboardService } from '../src/application/services/DashboardService';
import { DashboardRepository } from '../src/infrastructure/repositories/DashboardRepository';

describe('DashboardService', () => {
    let dashboardService: DashboardService;
    let mockDashboardRepository: jest.Mocked<DashboardRepository>;
    
    beforeEach(() => {
        mockDashboardRepository = {
            getDashboardData: jest.fn(),
        } as any;
        
        dashboardService = new DashboardService(mockDashboardRepository);
    });
    
    describe('getDashboardData', () => {
        it('should use current month and year if not provided', async () => {
            const userId = 'user123';
            const mockData = {
                overview: {
                    totalServices: 5,
                    totalEstimatedCost: 500,
                    totalPaidThisMonth: 450,
                    pendingPayments: 2,
                    overduePayments: 1,
                },
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month: 1,
                    year: 2026,
                    totalPaid: 450,
                    totalEstimated: 500,
                    servicesCount: 5,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardRepository.getDashboardData.mockResolvedValue(mockData);
            
            const result = await dashboardService.getDashboardData(userId);
            
            expect(result).toEqual(mockData);
            expect(mockDashboardRepository.getDashboardData).toHaveBeenCalledWith(
                userId,
                expect.any(Number),
                expect.any(Number)
            );
        });
        
        it('should use provided month and year', async () => {
            const userId = 'user123';
            const month = 6;
            const year = 2025;
            const mockData = {
                overview: {
                    totalServices: 3,
                    totalEstimatedCost: 300,
                    totalPaidThisMonth: 280,
                    pendingPayments: 1,
                    overduePayments: 0,
                },
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month,
                    year,
                    totalPaid: 280,
                    totalEstimated: 300,
                    servicesCount: 3,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardRepository.getDashboardData.mockResolvedValue(mockData);
            
            const result = await dashboardService.getDashboardData(userId, month, year);
            
            expect(result).toEqual(mockData);
            expect(mockDashboardRepository.getDashboardData).toHaveBeenCalledWith(
                userId,
                month,
                year
            );
        });
    });
    
    describe('getMonthlyComparison', () => {
        it('should compare current month with previous month', async () => {
            const userId = 'user123';
            const month = 3;
            const year = 2026;
            
            const currentData = {
                overview: {} as any,
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month: 3,
                    year: 2026,
                    totalPaid: 500,
                    totalEstimated: 550,
                    servicesCount: 5,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            const previousData = {
                overview: {} as any,
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month: 2,
                    year: 2026,
                    totalPaid: 400,
                    totalEstimated: 500,
                    servicesCount: 5,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardRepository.getDashboardData
                .mockResolvedValueOnce(currentData)
                .mockResolvedValueOnce(previousData);
            
            const result = await dashboardService.getMonthlyComparison(userId, month, year);
            
            expect(result.current).toEqual(currentData.monthlyExpenses);
            expect(result.previous).toEqual(previousData.monthlyExpenses);
            expect(result.comparison.paidDifference).toBe(100); // 500 - 400
            expect(result.comparison.paidPercentageChange).toBe(25); // (100/400) * 100
        });
        
        it('should handle year transition correctly', async () => {
            const userId = 'user123';
            const month = 1;
            const year = 2026;
            
            const currentData = {
                overview: {} as any,
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month: 1,
                    year: 2026,
                    totalPaid: 600,
                    totalEstimated: 650,
                    servicesCount: 6,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            const previousData = {
                overview: {} as any,
                mostExpensiveServices: [],
                monthlyExpenses: {
                    month: 12,
                    year: 2025,
                    totalPaid: 500,
                    totalEstimated: 550,
                    servicesCount: 5,
                },
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardRepository.getDashboardData
                .mockResolvedValueOnce(currentData)
                .mockResolvedValueOnce(previousData);
            
            await dashboardService.getMonthlyComparison(userId, month, year);
            
            expect(mockDashboardRepository.getDashboardData).toHaveBeenCalledWith(userId, 1, 2026);
            expect(mockDashboardRepository.getDashboardData).toHaveBeenCalledWith(userId, 12, 2025);
        });
    });
});
