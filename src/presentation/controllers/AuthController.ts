import { Request, Response } from 'express';
import z from 'zod';
import { AuthService } from '../../application/services/AuthService';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({ name: z.string(), email: z.string().email(), password: z.string().min(6) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export class AuthController {

    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async register(req: Request, res: Response): Promise<Response> {
        try {
            const { name, email, password } = registerSchema.parse(req.body);
            const user = await this.authService.register({ name, email, password });
            return res.status(201).json(user);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await this.authService.login({ email, password });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await this.authService.getCurrentUser(userId);
            return res.status(200).json(user);
        } catch (error) {
            return res.status(404).json({ message: (error as Error).message });
        }
    }

    async updateCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const updateSchema = z.object({
                name: z.string().min(1).max(100).optional(),
                email: z.string().email().optional(),
                monthlyBudget: z.number().min(0).optional(),
            });

            const data = updateSchema.parse(req.body);

            const updatedUser = await this.authService.updateUser(userId, data);
            return res.status(200).json(updatedUser);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: "Validation error",
                    errors: error.errors
                });
            }
            return res.status(500).json({ message: (error as Error).message });
        }
    }
}
