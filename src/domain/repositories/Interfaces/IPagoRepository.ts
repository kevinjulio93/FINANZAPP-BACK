import { IPagoMensualDocument } from "../../../infrastructure/models/PagoMensual.model";

export interface ICreatePago {
    serviceId: string;
    mes: number;
    año: number;
    valorPagado: number;
    fechaPago: Date;
    metodoPago?: string;
    notas?: string;
    supportUrl?: string;
}

export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface IPagoFilters {
    search?: string;
    serviceId?: string;
    categoryId?: string;
    mes?: number;
    año?: number;
}

export interface IPagoRepository {
    create(data: ICreatePago): Promise<IPagoMensualDocument>;
    findById(id: string): Promise<IPagoMensualDocument | null>;
    findAll(): Promise<IPagoMensualDocument[]>;
    findByServiceId(serviceId: string): Promise<IPagoMensualDocument[]>;
    findByUserId(
        userId: string,
        filters: IPagoFilters,
        page?: number,
        limit?: number
    ): Promise<IPaginatedResponse<IPagoMensualDocument>>;
    update(id: string, data: Partial<ICreatePago>): Promise<IPagoMensualDocument | null>;
    delete(id: string): Promise<boolean>;
    deleteMany(ids: string[]): Promise<number>;

    // Métodos para reportes
    findByUserIdSortedByDate(userId: string): Promise<IPagoMensualDocument[]>;
    findByMonth(userId: string, mes: number, año: number): Promise<IPagoMensualDocument[]>;
    findByYear(userId: string, año: number): Promise<IPagoMensualDocument[]>;
    findByCategoryGroupedByMonth(userId: string, categoryId: string, año: number): Promise<any>;
    findByCategorySortedByDate(userId: string, categoryId: string): Promise<IPagoMensualDocument[]>;
    getMonthlyStats(userId: string, mes: number, año: number): Promise<any>;
    getServiceAverages(userId: string, serviceId: string): Promise<any>;
    getPaymentReport(userId: string, mes: number | undefined, año: number): Promise<any>;
}
