import { IDashboardData } from '../../entities/Dashboard';

export interface IDashboardRepository {
    getDashboardData(userId: string, month: number, year: number): Promise<IDashboardData>;
}
