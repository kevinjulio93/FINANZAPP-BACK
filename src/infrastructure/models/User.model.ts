import mongoose from "mongoose";
import { IUser, INewUser } from "../../domain/entities/User";


const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);