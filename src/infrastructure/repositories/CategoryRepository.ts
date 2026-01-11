import { ICategory, ICreateCategory } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";
import { CategoryModel } from "../models/Catergory.model";


export class CategoryRepository implements ICategoryRepository {
    
    async create(data: ICreateCategory): Promise<ICategory> {
        const category = new CategoryModel(data);
        await category.save();
        return category.toObject() as ICategory;
    }

    async findByUserId(userId: string): Promise<ICategory[]> {
        return CategoryModel.find({ userId }).lean() as Promise<ICategory[]>;
    }

    async findById(id: string): Promise<ICategory | null> {
        return CategoryModel.findOne({ id }).lean() as Promise<ICategory | null>;
    }

    async update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null> {
        return CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<ICategory | null>;
    }

    async delete(id: string): Promise<boolean> {
        await CategoryModel.findByIdAndDelete(id); 
        return true;
    }


}