import z from "zod";
import { CategoryService } from "../../application/services/CategoryService";


const createCategorySchema = z.object({ name: z.string().min(1), color: z.string().min(1)});

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
            const userId = req.user.id; // Assuming user ID is available in req.user
            const categories = await this.categoryService.getCategoriesByUserId(userId);
            return res.status(200).json(categories);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }   
}