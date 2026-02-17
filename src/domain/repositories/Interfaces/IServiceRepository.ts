import { ICreateService, IPagoMensual, IService } from "../../entities/Service";
import { IPaginatedResponse } from "./IPagoRepository";


export interface IServiceRepository {
    create(data: ICreateService, userId: string): Promise<IService>;
    findByUserId(userId: string): Promise<IService[]>;
    findByCategoryId(categoryId: string): Promise<IService[]>;
    findById(id: string): Promise<IService | null>;
    update(id: string, data: Partial<ICreateService>): Promise<IService | null>;
    delete(id: string): Promise<boolean>;
    addPagoMensual(serviceId: string, pago: IPagoMensual): Promise<IService | null>;
    findByUserIdPaginated(userId: string, search?: string, categoryId?: string, page?: number, limit?: number): Promise<IPaginatedResponse<IService>>;
}