import { ICategory } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";


export class CategoryService {
    constructor(private categoryRepository: ICategoryRepository) {
    }

    async createCategory(data: { name: string; color: string; userId: string }): Promise<ICategory> {
        const existing = await this.categoryRepository.findByName(data.userId, data.name);
        if (existing) {
            throw new Error("CATEGORY_ALREADY_EXISTS");
        }
        return this.categoryRepository.create(data);
    }

    async getCategoriesByUserId(userId: string): Promise<ICategory[]> {
        const result = await this.categoryRepository.findByUserId(userId);
        return result;
    }

    async getCategoriesByUserIdPaginated(userId: string, search?: string, page?: number, limit?: number) {
        return this.categoryRepository.findByUserIdPaginated(userId, search, page, limit);
    }

    async getCategoryById(id: string): Promise<ICategory | null> {
        const result = await this.categoryRepository.findById(id);
        return result;
    }

    async updateCategory(id: string, data: Partial<{ name: string; color: string; userId: string }>): Promise<ICategory | null> {
        if (data.name && data.userId) {
            const existing = await this.categoryRepository.findByName(data.userId, data.name);
            if (existing && existing.id !== id) {
                throw new Error("CATEGORY_ALREADY_EXISTS");
            }
        }
        return this.categoryRepository.update(id, data);
    }

    async deleteCategory(id: string): Promise<boolean> {
        const result = await this.categoryRepository.delete(id);
        return result;
    }
}