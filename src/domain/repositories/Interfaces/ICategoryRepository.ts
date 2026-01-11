import { ICategory, ICreateCategory } from "../../entities/Category";

export interface ICategoryRepository { 
    create(data: ICreateCategory): Promise<ICategory>;
    findById(id: string): Promise<ICategory | null>;
    findByUserId(userId: string): Promise<ICategory[]>;
    update(id: string, data: Partial<ICreateCategory>): Promise<ICategory | null>;
    delete(id: string): Promise<boolean>;
    
}