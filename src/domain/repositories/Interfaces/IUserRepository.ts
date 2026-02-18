import { IUser, INewUser } from "../../entities/User";


export interface IUserRepository {
    createUser(user: INewUser): Promise<IUser>;
    createGoogleUser(user: { name: string; email: string; googleId: string }): Promise<IUser>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByGoogleId(googleId: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null>;
}