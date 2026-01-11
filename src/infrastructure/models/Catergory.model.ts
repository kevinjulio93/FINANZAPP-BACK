import mongoose from "mongoose";
import { ICategory } from "../../domain/entities/Category";


export const CategorySchema = new mongoose.Schema<ICategory>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
});

export const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);