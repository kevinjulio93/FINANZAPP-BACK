export interface IUser {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    monthlyBudget?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewUser {
    name: string;
    email: string;
    password: string;
}