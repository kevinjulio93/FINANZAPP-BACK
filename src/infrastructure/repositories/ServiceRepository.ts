import mongoose from "mongoose";
import { ICreateService, IPagoMensual, IService } from "../../domain/entities/Service";
import { ServiceModel } from "../models/Service.model";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { CategoryModel } from "../models/Catergory.model";


export class ServiceRepository implements IServiceRepository {
    async create(data: ICreateService, userId: string): Promise<IService> {
        const service = new ServiceModel({
            ...data,
            userId: new mongoose.Types.ObjectId(userId),
        });
        await service.save();
        return service.toObject() as IService;
    }

    async findByCategoryId(categoryId: string): Promise<IService[]> {
        const services = await ServiceModel.find({ categoryId }).lean();
        return services.map(s => ({
            ...s,
            id: (s as any)._id.toString(),
            categoryId: (s as any).categoryId.toString()
        })) as unknown as IService[];
    }

    async findByUserId(userId: string): Promise<IService[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userCategoryIds = await CategoryModel.distinct('_id', { userId: userObjectId });

        const services = await ServiceModel.find({
            categoryId: { $in: userCategoryIds }
        }).lean();

        return services.map(s => ({
            ...s,
            id: (s as any)._id.toString(),
            categoryId: (s as any).categoryId.toString()
        })) as unknown as IService[];
    }

    async findById(id: string): Promise<IService | null> {
        const service = await ServiceModel.findById(id).lean();
        if (!service) return null;
        return {
            ...service,
            id: (service as any)._id.toString(),
            categoryId: (service as any).categoryId.toString()
        } as unknown as IService;
    }

    async update(id: string, data: Partial<ICreateService>): Promise<IService | null> {
        const service = await ServiceModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!service) return null;
        return {
            ...service,
            id: (service as any)._id.toString(),
            categoryId: (service as any).categoryId.toString()
        } as unknown as IService;
    }

    async delete(id: string): Promise<boolean> {
        try {
            // Eliminar pagos asociados al servicio
            await mongoose.model('PagoMensual').deleteMany({ serviceId: id });

            // Eliminar el servicio
            await ServiceModel.findByIdAndDelete(id);

            return true;
        } catch (error) {
            console.error('Error in ServiceRepository.delete:', error);
            throw error;
        }
    }

    async addPagoMensual(serviceId: string, pago: IPagoMensual): Promise<IService | null> {
        const service = await ServiceModel.findById(serviceId);
        if (!service) {
            return null;
        }

        (service as any).pagosMensuales.push(pago);
        await service.save();
        return service.toObject() as IService;
    }
}