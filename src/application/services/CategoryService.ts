import { ICategory } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";


export class CategoryService {
    constructor(private categoryRepository: ICategoryRepository) {
    }

    async createCategory(data: { name: string; color: string; userId: string }): Promise<ICategory> {
        return this.categoryRepository.create(data);
    }

    async getCategoriesByUserId(userId: string): Promise<ICategory[]> {
        return this.categoryRepository.findByUserId(userId);
    }

    async getCategoryById(id: string): Promise<ICategory | null> {
        return this.categoryRepository.findById(id);
    }

    async updateCategory(id: string, data: Partial<{ name: string; color: string; userId: string }>): Promise<ICategory | null> {
        return this.categoryRepository.update(id, data);
    }
    
    async deleteCategory(id: string): Promise<boolean> {
        const result = await this.categoryRepository.delete(id);
        return result;
    }
}