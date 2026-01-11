import { IDashboardData } from '../../domain/entities/Dashboard';

export interface IDashboardRepository {
    getDashboardData(userId: string, month: number, year: number): Promise<IDashboardData>;
}
