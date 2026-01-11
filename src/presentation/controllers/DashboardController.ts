import { Request, Response } from 'express';
import { DashboardService } from '../../application/services/DashboardService';
import z from 'zod';

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

const querySchema = z.object({
    month: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    year: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

export class DashboardController {
    constructor(private dashboardService: DashboardService) {}
    
    async getDashboard(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { month, year } = querySchema.parse(req.query);
            
            const data = await this.dashboardService.getDashboardData(userId, month, year);
            
            return res.status(200).json(data);
        } catch (error) {
            console.error('Error getting dashboard:', error);
            return res.status(400).json({ message: (error as Error).message });
        }
    }
    
    async getMonthlyComparison(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { month, year } = querySchema.parse(req.query);
            
            const now = new Date();
            const currentMonth = month || now.getMonth() + 1;
            const currentYear = year || now.getFullYear();
            
            const comparison = await this.dashboardService.getMonthlyComparison(
                userId, 
                currentMonth, 
                currentYear
            );
            
            return res.status(200).json(comparison);
        } catch (error) {
            console.error('Error getting monthly comparison:', error);
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}
