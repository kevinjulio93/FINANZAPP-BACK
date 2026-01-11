import mongoose from "mongoose";

export enum EstadoServicio {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  VENCIDO = 'VENCIDO'
}

export interface IPagoMensual {
  mes: number;     // 1=Ene, 12=Dic
  año: number;     // 2026
  valorPagado: number;
  fechaPago: Date;
  receiptUrl?: string;  // GCS
}

export interface ICreateService {
  name: string;
  montoEstimado: number;
  categoryId: mongoose.Types.ObjectId;
}

export interface IUpdatePago {
  mes: number;
  año: number;
  valorPagado: number;
  fechaPago: Date;
  receiptUrl?: string;
}

export interface IService {
    id: mongoose.Types.ObjectId;
    name: string;
    montoEstimado: number;
    fechaUltimoPago?: Date;
    estado: EstadoServicio;
    proximoPago: Date; // Calculado desde fechaUltimoPago + 30 dias
    categoryId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}