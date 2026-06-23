import z from "zod";
import { CategoryService } from "../../application/services/CategoryService";
import { t } from "../../infrastructure/i18n/translate";
import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";


const createCategorySchema = z.object({ name: z.string().min(1), color: z.string().min(1) });

export class CategoryController {

    private categoryService: CategoryService;

    constructor(categoryService: CategoryService) {
        this.categoryService = categoryService;
    }

    async createCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { name, color } = createCategorySchema.parse(req.body);
            const userId = req.user!.id; // Assuming user ID is available in req.user
            const category = await this.categoryService.createCategory({ name, color, userId });
            return res.status(201).json(category);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            if (error.message === "CATEGORY_ALREADY_EXISTS") {
                return res.status(409).json({ message: t(lang, 'errors.categoryAlreadyExists') });
            }
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async getCategories(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
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
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, (error as Error).message) });
        }
    }

    async updateCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { name, color } = createCategorySchema.parse(req.body);
            const userId = req.user!.id;
            const category = await this.categoryService.updateCategory(id, { name, color, userId });

            if (!category) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, 'errors.categoryNotFound') });
            }

            return res.status(200).json(category);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            if (error.message === "CATEGORY_ALREADY_EXISTS") {
                return res.status(409).json({ message: t(lang, 'errors.categoryAlreadyExists') });
            }
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async deleteCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const result = await this.categoryService.deleteCategory(id);

            if (!result) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, 'errors.categoryNotFound') });
            }

            return res.status(204).send();
        } catch (error) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, (error as Error).message) });
        }
    }
}