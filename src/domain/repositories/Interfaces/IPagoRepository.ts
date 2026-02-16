import { IPagoMensualDocument } from "../../../infrastructure/models/PagoMensual.model";

export interface ICreatePago {
    serviceId: string;
    mes: number;
    año: number;
    valorPagado: number;
    fechaPago: Date;
    metodoPago?: string;
    notas?: string;
}

export interface IPagoRepository {
    create(data: ICreatePago): Promise<IPagoMensualDocument>;
    findById(id: string): Promise<IPagoMensualDocument | null>;
    findAll(): Promise<IPagoMensualDocument[]>;
    findByServiceId(serviceId: string): Promise<IPagoMensualDocument[]>;
    findByUserId(userId: string): Promise<IPagoMensualDocument[]>;
    update(id: string, data: Partial<ICreatePago>): Promise<IPagoMensualDocument | null>;
    delete(id: string): Promise<boolean>;
}
