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
            const { search } = req.query;
            const pagos = await this.pagoService.getPagosByUserId(userId, search as string);
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

    // Endpoints de reportes
    async getReportePagosSortedByDate(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const pagos = await this.pagoService.getPagosSortedByDate(userId);
            return res.status(200).json(pagos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getReportePagosByMonth(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { mes, año } = req.query;

            if (!mes || !año) {
                return res.status(400).json({ message: "Mes y año son requeridos" });
            }

            const pagos = await this.pagoService.getPagosByMonth(
                userId,
                parseInt(mes as string),
                parseInt(año as string)
            );
            return res.status(200).json(pagos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getReportePagosByYear(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { año } = req.query;

            if (!año) {
                return res.status(400).json({ message: "Año es requerido" });
            }

            const pagos = await this.pagoService.getPagosByYear(userId, parseInt(año as string));
            return res.status(200).json(pagos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getReportePagosByCategoryMonth(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { categoryId } = req.params;
            const { año } = req.query;

            if (!año) {
                return res.status(400).json({ message: "Año es requerido" });
            }

            // Verify category ownership
            const category = await this.categoryService.getCategoryById(categoryId);
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            const reporte = await this.pagoService.getPagosByCategoryGroupedByMonth(
                userId,
                categoryId,
                parseInt(año as string)
            );
            return res.status(200).json(reporte);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getReportePagosByCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { categoryId } = req.params;

            // Verify category ownership
            const category = await this.categoryService.getCategoryById(categoryId);
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            const pagos = await this.pagoService.getPagosByCategorySortedByDate(userId, categoryId);
            return res.status(200).json(pagos);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getMonthlyStats(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { mes, año } = req.query;

            if (!mes || !año) {
                return res.status(400).json({ message: "Mes y año son requeridos" });
            }

            const stats = await this.pagoService.getMonthlyStats(
                userId,
                parseInt(mes as string),
                parseInt(año as string)
            );
            return res.status(200).json(stats);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getServiceAverages(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { serviceId } = req.params;

            const averages = await this.pagoService.getServiceAverages(userId, serviceId);

            if (!averages || averages.length === 0) {
                return res.status(404).json({ message: "No hay datos suficientes para este servicio" });
            }

            return res.status(200).json(averages[0]);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getPaymentReport(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { mes, año } = req.query;

            if (!año) {
                return res.status(400).json({ message: "Año es requerido" });
            }

            const report = await this.pagoService.getPaymentReport(
                userId,
                mes ? parseInt(mes as string) : undefined,
                parseInt(año as string)
            );

            return res.status(200).json(report);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}
