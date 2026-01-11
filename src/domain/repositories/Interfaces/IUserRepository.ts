import { IUser, INewUser } from "../../entities/User";


export interface IUserRepository {
    createUser(user: INewUser): Promise<IUser>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
}