import { Request, Response } from "express";
import z from "zod";
import { EstadoServicio } from "../../domain/entities/Service";
import { CategoryService } from "../../application/services/CategoryService";
import { ServiceService } from "../../application/services/ServiceService";


interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

const createServiceSchema = z.object({
    name: z.string(),
    montoEstimado: z.number().nonnegative(),
    fechaUltimoPago: z.string().optional(),
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
            const { name, montoEstimado, fechaUltimoPago, categoryId, estado } = createServiceSchema.parse(req.body);
            const userId = req.user!.id;
            const category = await this.categoryService.getCategoryById(categoryId);

            if (!category) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            if (category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            const service = await this.serviceService.createService({
                name,
                montoEstimado,
                fechaUltimoPago: fechaUltimoPago ? new Date(fechaUltimoPago).toString() : new Date().toString(),
                categoryId,
                estado: estado || EstadoServicio.PENDIENTE,
                userId,
            });

            return res.status(201).json(service);
        } catch (error) {
            console.error('💥 Error:', error);
            return res.status(400).json({ message: (error as Error).message });
        }

    }

    async getServicesByCategory(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const categoryId = req.params.categoryId;

            const category = await this.categoryService.getCategoryById(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            if (category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Categoría no encontrada" });
            }

            const services = await this.serviceService.getServicesByCategoryId(categoryId);
            return res.status(200).json(services);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async getServicesByUser(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const services = await this.serviceService.getServicesByUserId(userId);
            return res.status(200).json(services);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async duplicateService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const newService = await this.serviceService.duplicateService(serviceId, userId);

            return res.status(201).json(newService);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async updateService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;
            const { name, montoEstimado, categoryId } = req.body;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const updatedService = await this.serviceService.updateService(serviceId, {
                name,
                montoEstimado,
                categoryId,
            });

            return res.status(200).json(updatedService);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }

    async deleteService(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const serviceId = req.params.id;

            const service = await this.serviceService.getServiceById(serviceId);
            if (!service) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            const category = await this.categoryService.getCategoryById(service.categoryId.toString());
            if (!category || category.userId.toString() !== userId) {
                return res.status(404).json({ message: "Servicio no encontrado" });
            }

            await this.serviceService.deleteService(serviceId);

            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    }
}