import mongoose from "mongoose";
import { UserModel } from "../../infrastructure/models/User.model";
import { INewUser, IUser } from "../entities/User";
import { IUserRepository } from "./Interfaces/IUserRepository";
import bcrypt from 'bcryptjs';




export class UserRepository  implements IUserRepository {

    async createUser(user: INewUser): Promise<IUser> {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = new UserModel({
            id: new mongoose.Types.ObjectId().toHexString(),
            name: user.name,
            email: user.email,
            passwordHash: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await newUser.save();
        return newUser.toObject() as IUser;
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email }) as Promise<IUser | null>;
    }

    async getUserById(id: string): Promise<IUser | null> {
        return UserModel.findOne({ id }) as Promise<IUser | null>;
    }
}