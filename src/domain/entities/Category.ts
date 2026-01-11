import mongoose from "mongoose";

export interface ICreateCategory {
    name: string;
    color: string;
    userId: string;
}

export interface ICategory {
    id: string;
    name: string;
    color: string;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}