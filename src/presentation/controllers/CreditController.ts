import { Request, Response } from 'express';
import { CreditService } from '../../application/services/CreditService';
import z from 'zod';
import { TipoPago } from '../../domain/entities/Credit';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

const createCreditSchema = z.object({
    nombre: z.string().min(1),
    valorInicial: z.number().positive(),
    tasaInteresAnual: z.number().min(0).max(100),
    plazoMeses: z.number().int().positive(),
    subsidioPorcentaje: z.number().min(0).max(100).optional(),
    fechaInicio: z.string().transform(str => new Date(str)),
    tipoPago: z.nativeEnum(TipoPago).optional(),
});

const abonoSchema = z.object({
    monto: z.number().positive(),
    fecha: z.string().transform(str => new Date(str)).optional(),
});

const simulacionSchema = z.object({
    montoAbono: z.number().positive(),
});

export class CreditController {
    constructor(private creditService: CreditService) {}

    async createCredit(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const data = createCreditSchema.parse(req.body);

            const credit = await this.creditService.createCredit({
                ...data,
                userId,
            });

            return res.status(201).json(credit);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getCredits(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const credits = await this.creditService.getCreditsByUserId(userId);
            return res.status(200).json(credits);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getCreditById(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            return res.status(200).json(credit);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getProyeccion(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            const proyeccion = await this.creditService.getProyeccion(id);
            return res.status(200).json(proyeccion);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async simularAbono(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { montoAbono } = simulacionSchema.parse(req.body);

            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            const simulacion = await this.creditService.simularAbono(id, montoAbono);
            return res.status(200).json(simulacion);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async registrarAbono(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const data = abonoSchema.parse(req.body);

            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            const abono = await this.creditService.registrarAbono({
                creditId: id,
                monto: data.monto,
                fecha: data.fecha,
            });

            return res.status(201).json(abono);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getAbonos(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            const abonos = await this.creditService.getAbonosByCredit(id);
            return res.status(200).json(abonos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async deleteCredit(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const credit = await this.creditService.getCreditById(id);

            if (!credit) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            if (credit.userId !== req.user!.id) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            await this.creditService.deleteCredit(id);
            return res.status(200).json({ message: 'Crédito eliminado correctamente' });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}
