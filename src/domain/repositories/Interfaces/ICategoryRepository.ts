import { ICategory, ICreateCategory } from "../../entities/Category";
import { IPaginatedResponse } from "./IPagoRepository";

export interface ICategoryRepository {
    create(data: ICreateCategory): Promise<ICategory>;
    findById(id: string): Promise<ICategory | null>;
    findByUserId(userId: string): Promise<ICategory[]>;
    update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null>;
    delete(id: string): Promise<boolean>;
    findByName(userId: string, name: string): Promise<ICategory | null>;
    findByUserIdPaginated(userId: string, search?: string, page?: number, limit?: number): Promise<IPaginatedResponse<ICategory>>;
}