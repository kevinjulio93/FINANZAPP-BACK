import { Request, Response } from "express";
import z from "zod";
import { PagoService } from "../../application/services/PagoService";
import { ServiceService } from "../../application/services/ServiceService";
import { CategoryService } from "../../application/services/CategoryService";

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

const createPagoSchema = z.object({
    serviceId: z.string(),
    mes: z.number().int().min(1).max(12),
    año: z.number().int().positive(),
    valorPagado: z.number().positive(),
    fechaPago: z.string(),
    metodoPago: z.enum(['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'OTRO']).optional(),
    notas: z.string().optional(),
});

const updatePagoSchema = createPagoSchema.partial();

export class PagoController {
    private pagoService: PagoService;
    private serviceService: ServiceService;
    private categoryService: CategoryService;

    constructor(pagoService: PagoService, serviceService: ServiceService, categoryService: CategoryService) {
        this.pagoService = pagoService;
        this.serviceService = serviceService;
        this.categoryService = categoryService;
    }

    async createPago(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const data = createPagoSchema.parse(req.body);

            // Verify service exists and user owns it
            const service = await this.serviceService.getServiceById(data.serviceId);
            if (!service) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const pago = await this.pagoService.createPago({
                ...data,
                fechaPago: new Date(data.fechaPago),
            });

            return res.status(201).json(pago);
        } catch (error) {
            console.error('Create pago error:', error);
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getPagos(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const pagos = await this.pagoService.getPagosByUserId(userId);
            return res.status(200).json(pagos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getPagoById(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const pagoId = req.params.id;

            const pago = await this.pagoService.getPagoById(pagoId);
            if (!pago) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            // Verify ownership through service
            const service = await this.serviceService.getServiceById(pago.serviceId.toString());
            if (!service) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            return res.status(200).json(pago);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async updatePago(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const pagoId = req.params.id;
            const data = updatePagoSchema.parse(req.body);

            const pago = await this.pagoService.getPagoById(pagoId);
            if (!pago) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            // Verify ownership
            const service = await this.serviceService.getServiceById(pago.serviceId.toString());
            if (!service) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            const updateData: any = { ...data };
            if (data.fechaPago) {
                updateData.fechaPago = new Date(data.fechaPago);
            }

            const updatedPago = await this.pagoService.updatePago(pagoId, updateData);
            return res.status(200).json(updatedPago);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async deletePago(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const pagoId = req.params.id;

            const pago = await this.pagoService.getPagoById(pagoId);
            if (!pago) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            // Verify ownership
            const service = await this.serviceService.getServiceById(pago.serviceId.toString());
            if (!service) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }

            await this.pagoService.deletePago(pagoId);
            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}
