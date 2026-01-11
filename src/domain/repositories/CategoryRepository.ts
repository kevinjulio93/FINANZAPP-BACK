import { ICreateCategory, ICategory } from "../entities/Category";
import { ICategoryRepository } from "./Interfaces/ICategoryRepository";



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
	update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null> {
		throw new Error("Method not implemented.");
	}
	delete(id: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	} 

}