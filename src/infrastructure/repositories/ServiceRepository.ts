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

    findByCategoryId(categoryId: string): Promise<IService[]> {
        return ServiceModel.find({ categoryId }).lean() as Promise<IService[]>;
    }

    async findByUserId(userId: string): Promise<IService[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userCategoryIds = await CategoryModel.distinct('_id', { userId: userObjectId });
        
        return ServiceModel.find({ 
            categoryId: { $in: userCategoryIds } 
        }).lean() as Promise<IService[]>;
    }

    async findById(id: string): Promise<IService | null> {
        return ServiceModel.findOne({ id }).lean() as Promise<IService | null>;
    }

    async update(id: string, data: Partial<ICreateService>): Promise<IService | null> {
        return ServiceModel.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<IService | null>;
    }

    async delete(id: string): Promise<boolean> {
        await ServiceModel.findByIdAndDelete(id); 
        return true;
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