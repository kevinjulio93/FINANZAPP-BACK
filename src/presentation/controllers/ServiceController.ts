import { Request, Response } from "express";
import z from "zod";
import { EstadoServicio } from "../../domain/entities/Service";
import { CategoryService } from "../../application/services/CategoryService";
import { ServiceService } from "../../application/services/ServiceService";


import { t } from "../../infrastructure/i18n/translate";
import { AuthRequest } from "../middleware/auth.middleware";

const createServiceSchema = z.object({
    name: z.string(),
    montoEstimado: z.number().nonnegative(),
    fechaUltimoPago: z.string().optional(),
    fechaLimitePago: z.string().optional(),
    diasRecordatorio: z.array(z.number()).optional(),
    categoryId: z.string(),
    estado: z.enum(Object.values(EstadoServicio) as [string, ...string[]]).optional(),
});

export class ServiceController {
    private serviceService: ServiceService;
    private categoryService: CategoryService;

    constructor(serviceService: ServiceService, categoryService: CategoryService) {
        this.serviceService = serviceService;
        this.categoryService = categoryService;
    }

    async createService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { name, montoEstimado, fechaUltimoPago, fechaLimitePago, diasRecordatorio, categoryId, estado } = createServiceSchema.parse(req.body);
            const userId = req.user!.id;
            const category = await this.categoryService.getCategoryById(categoryId);

            if (!category) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.categoryNotFound") });
            }

            if (category.userId.toString() !== userId) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.categoryNotFound") });
            }

            const service = await this.serviceService.createService({
                name,
                montoEstimado,
                fechaUltimoPago: fechaUltimoPago ? new Date(fechaUltimoPago).toString() : new Date().toString(),
                fechaLimitePago: fechaLimitePago ? new Date(fechaLimitePago) : undefined,
                diasRecordatorio,
                categoryId,
                estado: estado || EstadoServicio.PENDIENTE,
                userId,
            });

            return res.status(201).json(service);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }

    }

    async getServicesByCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const categoryId = req.params.categoryId;

            const category = await this.categoryService.getCategoryById(categoryId);
            if (!category) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.categoryNotFound") });
            }

            if (category.userId.toString() !== userId) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.categoryNotFound") });
            }

            const services = await this.serviceService.getServicesByCategoryId(categoryId);
            return res.status(200).json(services);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async getServicesByUser(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { search, categoryId, page = 1, limit = 10 } = req.query;

            // If page is explicitly set to -1 or all, return all (for dropdowns)
            if (page === 'all' || page === '-1') {
                const services = await this.serviceService.getServicesByUserId(userId);
                return res.status(200).json(services);
            }

            const response = await this.serviceService.getServicesByUserIdPaginated(
                userId,
                search as string,
                categoryId as string,
                parseInt(page as string),
                parseInt(limit as string)
            );
            return res.status(200).json(response);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async duplicateService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            const newService = await this.serviceService.duplicateService(serviceId, userId);

            return res.status(201).json(newService);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async updateService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;
            const { name, montoEstimado, categoryId, fechaLimitePago, fechaUltimoPago, diasRecordatorio } = req.body;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            const updatedService = await this.serviceService.updateService(serviceId, {
                name,
                montoEstimado,
                categoryId,
                fechaLimitePago: fechaLimitePago ? new Date(fechaLimitePago) : undefined,
                fechaUltimoPago: fechaUltimoPago ? new Date(fechaUltimoPago) : undefined,
                diasRecordatorio,
            });

            return res.status(200).json(updatedService);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }

    async deleteService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                const lang = req.user?.language || 'en';
                return res.status(404).json({ message: t(lang, "errors.serviceNotFound") });
            }

            await this.serviceService.deleteService(serviceId);

            return res.status(204).send();
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            return res.status(400).json({ message: t(lang, error.message) });
        }
    }
}