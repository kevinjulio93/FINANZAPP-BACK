import {Request, Response} from 'express';
import z from 'zod';
import { AuthService } from '../../application/services/AuthService';


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
            const token = await this.authService.login({ email, password });
            return res.status(200).json({ token });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}
