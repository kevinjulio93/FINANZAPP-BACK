import { Request, Response } from 'express';
import { CreditService } from '../../application/services/CreditService';
import z from 'zod';
import { TipoPago } from '../../domain/entities/Credit';
import { OwnershipValidator } from '../../utils/ownership.validator';

import { t } from '../../infrastructure/i18n/translate';
import { AuthRequest } from '../middleware/auth.middleware';

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
    constructor(private creditService: CreditService) { }

    private handleError(res: Response, req: AuthRequest, error: any) {
        const lang = req.user?.language || 'en';
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: t(lang, "errors.invalidData"),
                errors: error.errors
            });
        }
        return res.status(400).json({ message: t(lang, error.message) });
    }

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
            return this.handleError(res, req, error);
        }
    }

    async getCredits(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const credits = await this.creditService.getCreditsByUserId(userId);
            return res.status(200).json(credits);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async getCreditById(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const credit = await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);
            return res.status(200).json(credit);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async getProyeccion(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);
            const proyeccion = await this.creditService.getProyeccion(id);
            return res.status(200).json(proyeccion);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async simularAbono(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { montoAbono } = simulacionSchema.parse(req.body);

            await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);

            const simulacion = await this.creditService.simularAbono(id, montoAbono);
            return res.status(200).json(simulacion);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async registrarAbono(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const data = abonoSchema.parse(req.body);

            await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);

            const abono = await this.creditService.registrarAbono({
                creditId: id,
                monto: data.monto,
                fecha: data.fecha,
            });

            return res.status(201).json(abono);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async getAbonos(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);
            const abonos = await this.creditService.getAbonosByCredit(id);
            return res.status(200).json(abonos);
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }

    async deleteCredit(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            await OwnershipValidator.validateCreditOwnership(this.creditService, id, req.user!.id);
            await this.creditService.deleteCredit(id);
            const lang = req.user?.language || 'en';
            return res.status(200).json({ message: t(lang, 'credits.deleted') });
        } catch (error) {
            return this.handleError(res, req, error);
        }
    }
}
