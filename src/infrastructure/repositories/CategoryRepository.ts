import { ICategory, ICreateCategory } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";
import { CategoryModel } from "../models/Catergory.model";
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
        return CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<ICategory | null>;
    }

    async delete(id: string): Promise<boolean> {
        await CategoryModel.findByIdAndDelete(id); 
        return true;
    }


}