import mongoose from "mongoose";
import { IUser, INewUser } from "../../domain/entities/User";


const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, required: false, unique: true, sparse: true },
    whatsappPhone: { type: String, required: false },
    whatsappVerified: { type: Boolean, default: false },
    whatsappVerificationCode: { type: String, required: false },
    whatsappVerificationExpires: { type: Date, required: false },
    monthlyBudget: { type: Number, default: 0 },
    montosOcultos: { type: Boolean, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);