import { ICategory, ICreateCategory } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";
import { IPaginatedResponse } from "../../domain/repositories/Interfaces/IPagoRepository";
import { CategoryModel } from "../models/Catergory.model";
import { ServiceModel } from "../models/Service.model";
import mongoose from "mongoose";


export class CategoryRepository implements ICategoryRepository {

    async create(data: ICreateCategory): Promise<ICategory> {
        const category = new CategoryModel({
            ...data,
            userId: new mongoose.Types.ObjectId(data.userId),
        });
        await category.save();
        return category.toObject() as ICategory;
    }

    async findByUserId(userId: string): Promise<ICategory[]> {

        const objectId = new mongoose.Types.ObjectId(userId);
        const categories = await CategoryModel.find({ userId: objectId }).lean();
        const result = categories.map(cat => ({
            ...cat,
            id: cat._id.toString(),
            userId: cat.userId,
        })) as ICategory[];
        return result;
    }

    async findByUserIdPaginated(
        userId: string,
        search?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IPaginatedResponse<ICategory>> {
        const objectId = new mongoose.Types.ObjectId(userId);
        let query: any = { userId: objectId };

        if (search) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        const skip = (page - 1) * limit;
        const total = await CategoryModel.countDocuments(query);
        const categories = await CategoryModel.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const data = categories.map(cat => ({
            ...cat,
            id: cat._id.toString(),
            userId: cat.userId,
        })) as ICategory[];

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByName(userId: string, name: string): Promise<ICategory | null> {
        const objectId = new mongoose.Types.ObjectId(userId);
        const category = await CategoryModel.findOne({
            userId: objectId,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case insensitive exact match
        }).lean();

        if (!category) return null;

        return {
            ...category,
            id: (category._id as any).toString(),
            userId: category.userId.toString(),
        } as unknown as ICategory;
    }

    async findById(id: string): Promise<ICategory | null> {
        try {

            const category = await CategoryModel.findById(id).lean();

            if (!category) return null;

            const result = {
                id: (category._id as any).toString(),
                name: category.name,
                color: category.color,
                userId: category.userId,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            } as ICategory;

            return result;
        } catch (error) {
            return null;
        }
    }

    async update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null> {
        const category = await CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!category) return null;
        return {
            ...category,
            id: (category._id as any).toString(),
            userId: (category as any).userId.toString(),
        } as unknown as ICategory;
    }

    async delete(id: string): Promise<boolean> {
        try {
            // 1. Obtener todos los servicios de esta categoría
            const services = await ServiceModel.find({ categoryId: id });
            const serviceIds = services.map(s => s._id);

            // 2. Eliminar todos los pagos asociados a esos servicios
            if (serviceIds.length > 0) {
                await mongoose.model('PagoMensual').deleteMany({ serviceId: { $in: serviceIds } });
            }

            // 3. Eliminar los servicios
            await ServiceModel.deleteMany({ categoryId: id });

            // 4. Eliminar la categoría
            await CategoryModel.findByIdAndDelete(id);

            return true;
        } catch (error) {
            console.error('Error in CategoryRepository.delete:', error);
            throw error;
        }
    }


}