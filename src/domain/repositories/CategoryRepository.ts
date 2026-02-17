import { ICreateCategory, ICategory } from "../entities/Category";
import { ICategoryRepository } from "./Interfaces/ICategoryRepository";
import { IPaginatedResponse } from "./Interfaces/IPagoRepository";

export class CategoryRepository implements ICategoryRepository {
	create(data: ICreateCategory): Promise<ICategory> {
		throw new Error("Method not implemented.");
	}
	findById(id: string): Promise<ICategory | null> {
		throw new Error("Method not implemented.");
	}
	findByUserId(userId: string): Promise<ICategory[]> {
		throw new Error("Method not implemented.");
	}
	findByUserIdPaginated(userId: string, search?: string, page?: number, limit?: number): Promise<IPaginatedResponse<ICategory>> {
		throw new Error("Method not implemented.");
	}
	update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null> {
		throw new Error("Method not implemented.");
	}
	delete(id: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}