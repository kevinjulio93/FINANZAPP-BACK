import { Request, Response } from 'express';
import { DashboardController } from '../src/presentation/controllers/DashboardController';
import { DashboardService } from '../src/application/services/DashboardService';

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

describe('DashboardController', () => {
    let dashboardController: DashboardController;
    let mockDashboardService: jest.Mocked<DashboardService>;
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    
    beforeEach(() => {
        mockDashboardService = {
            getDashboardData: jest.fn(),
            getMonthlyComparison: jest.fn(),
        } as any;
        
        dashboardController = new DashboardController(mockDashboardService);
        
        mockRequest = {
            user: { id: 'user123' },
            query: {},
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });
    
    describe('getDashboard', () => {
        it('should return dashboard data successfully', async () => {
            const mockData = {
                overview: {
                    totalServices: 5,
                    totalEstimatedCost: 500,
                    totalPaidThisMonth: 450,
                    pendingPayments: 2,
                    overduePayments: 1,
                },
                mostExpensiveServices: [
                    {
                        serviceId: 'svc1',
                        serviceName: 'Netflix',
                        categoryName: 'Entretenimiento',
                        monthlyAmount: 150,
                    },
                ],
                monthlyExpenses: {
                    month: 1,
                    year: 2026,
                    totalPaid: 450,
                    totalEstimated: 500,
                    servicesCount: 5,
                },
                expensesByCategory: [
                    {
                        categoryId: 'cat1',
                        categoryName: 'Entretenimiento',
                        color: '#FF5733',
                        totalAmount: 200,
                        servicesCount: 2,
                        percentage: 44.44,
                    },
                ],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardService.getDashboardData.mockResolvedValue(mockData);
            
            await dashboardController.getDashboard(mockRequest as any, mockResponse as any);
            
            expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
                'user123',
                undefined,
                undefined
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockData);
        });
        
        it('should handle query parameters for month and year', async () => {
            mockRequest.query = { month: '6', year: '2025' };
            
            const mockData = {
                overview: {} as any,
                mostExpensiveServices: [],
                monthlyExpenses: {} as any,
                expensesByCategory: [],
                paymentTrends: [],
                upcomingPayments: [],
            };
            
            mockDashboardService.getDashboardData.mockResolvedValue(mockData);
            
            await dashboardController.getDashboard(mockRequest as any, mockResponse as any);
            
            expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
                'user123',
                6,
                2025
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should handle errors', async () => {
            const error = new Error('Database error');
            mockDashboardService.getDashboardData.mockRejectedValue(error);
            
            await dashboardController.getDashboard(mockRequest as any, mockResponse as any);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });
    
    describe('getMonthlyComparison', () => {
        it('should return monthly comparison successfully', async () => {
            const mockComparison = {
                current: {
                    month: 1,
                    year: 2026,
                    totalPaid: 500,
                    totalEstimated: 550,
                    servicesCount: 5,
                },
                previous: {
                    month: 12,
                    year: 2025,
                    totalPaid: 400,
                    totalEstimated: 450,
                    servicesCount: 4,
                },
                comparison: {
                    paidDifference: 100,
                    paidPercentageChange: 25,
                    estimatedDifference: 100,
                },
            };
            
            mockDashboardService.getMonthlyComparison.mockResolvedValue(mockComparison);
            
            await dashboardController.getMonthlyComparison(mockRequest as any, mockResponse as any);
            
            expect(mockDashboardService.getMonthlyComparison).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockComparison);
        });
        
        it('should handle errors', async () => {
            const error = new Error('Comparison error');
            mockDashboardService.getMonthlyComparison.mockRejectedValue(error);
            
            await dashboardController.getMonthlyComparison(mockRequest as any, mockResponse as any);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Comparison error' });
        });
    });
});
