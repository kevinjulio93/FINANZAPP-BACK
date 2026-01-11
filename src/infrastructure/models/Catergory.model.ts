import mongoose from "mongoose";
import { ICategory } from "../../domain/entities/Category";


export const CategorySchema = new mongoose.Schema<ICategory>({
    name: { type: String, required: true },
    color: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: (doc, ret: any) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});

export const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);