import z from "zod";
import { CategoryService } from "../../application/services/CategoryService";


const createCategorySchema = z.object({ name: z.string().min(1), color: z.string().min(1) });

export class CategoryController {

    private categoryService: CategoryService;

    constructor(categoryService: CategoryService) {
        this.categoryService = categoryService;
    }

    async createCategory(req: any, res: any): Promise<any> {
        try {
            const { name, color } = createCategorySchema.parse(req.body);
            const userId = req.user.id; // Assuming user ID is available in req.user
            const category = await this.categoryService.createCategory({ name, color, userId });
            return res.status(201).json(category);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getCategories(req: any, res: any): Promise<any> {
        try {
            const userId = req.user.id;
            const { search, page = 1, limit = 10 } = req.query;

            // If page is explicitly set to -1, return all (for dropdowns)
            if (page === 'all' || page === '-1') {
                const categories = await this.categoryService.getCategoriesByUserId(userId);
                return res.status(200).json(categories);
            }

            const response = await this.categoryService.getCategoriesByUserIdPaginated(
                userId,
                search as string,
                parseInt(page as string),
                parseInt(limit as string)
            );
            return res.status(200).json(response);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async updateCategory(req: any, res: any): Promise<any> {
        try {
            const { id } = req.params;
            const { name, color } = createCategorySchema.parse(req.body);
            const category = await this.categoryService.updateCategory(id, { name, color });

            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            return res.status(200).json(category);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async deleteCategory(req: any, res: any): Promise<any> {
        try {
            const { id } = req.params;
            const result = await this.categoryService.deleteCategory(id);

            if (!result) {
                return res.status(404).json({ message: "Category not found" });
            }

            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}