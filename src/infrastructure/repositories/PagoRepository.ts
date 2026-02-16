import mongoose from "mongoose";
import { IPagoRepository, ICreatePago } from "../../domain/repositories/Interfaces/IPagoRepository";
import { PagoMensualModel, IPagoMensualDocument } from "../models/PagoMensual.model";
import { ServiceModel } from "../models/Service.model";

export class PagoRepository implements IPagoRepository {
    async create(data: ICreatePago): Promise<IPagoMensualDocument> {
        const pago = new PagoMensualModel({
            ...data,
            serviceId: new mongoose.Types.ObjectId(data.serviceId),
        });
        await pago.save();
        return pago;
    }

    async findById(id: string): Promise<IPagoMensualDocument | null> {
        return PagoMensualModel.findById(id);
    }

    async findAll(): Promise<IPagoMensualDocument[]> {
        return PagoMensualModel.find();
    }

    async findByServiceId(serviceId: string): Promise<IPagoMensualDocument[]> {
        return PagoMensualModel.find({ serviceId: new mongoose.Types.ObjectId(serviceId) });
    }

    async findByUserId(userId: string): Promise<IPagoMensualDocument[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get all services for this user's categories
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId) // Only services with matching category
            .map(service => service._id);

        return PagoMensualModel.find({
            serviceId: { $in: serviceIds }
        });
    }

    async update(id: string, data: Partial<ICreatePago>): Promise<IPagoMensualDocument | null> {
        const updateData: any = { ...data };
        if (data.serviceId) {
            updateData.serviceId = new mongoose.Types.ObjectId(data.serviceId);
        }
        return PagoMensualModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        await PagoMensualModel.findByIdAndDelete(id);
        return true;
    }
}
