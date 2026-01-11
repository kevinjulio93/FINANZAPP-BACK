import { ICredit, ICreateCredit, IAbonoCapital, ICreateAbonoCapital } from '../../entities/Credit';

export interface ICreditRepository {
    create(data: ICreateCredit): Promise<ICredit>;
    findById(id: string): Promise<ICredit | null>;
    findByUserId(userId: string): Promise<ICredit[]>;
    update(id: string, data: Partial<ICredit>): Promise<ICredit | null>;
    delete(id: string): Promise<boolean>;
    
    // Abonos a capital
    createAbono(data: ICreateAbonoCapital): Promise<IAbonoCapital>;
    getAbonosByCredit(creditId: string): Promise<IAbonoCapital[]>;
    deleteAbono(id: string): Promise<boolean>;
}
