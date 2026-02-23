export interface IUser {
    id: string;
    name: string;
    email: string;
    passwordHash?: string;
    googleId?: string;
    whatsappPhone?: string;
    whatsappVerified?: boolean;
    whatsappVerificationCode?: string;
    whatsappVerificationExpires?: Date;
    monthlyBudget?: number;
    montosOcultos?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewUser {
    name: string;
    email: string;
    password: string;
}