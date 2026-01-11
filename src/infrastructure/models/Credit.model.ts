import mongoose, { Schema, Document } from 'mongoose';
import { EstadoCredito, TipoPago } from '../../domain/entities/Credit';

export interface ICreditDocument extends Document {
    userId: mongoose.Types.ObjectId;
    nombre: string;
    valorInicial: number;
    saldoActual: number;
    tasaInteresAnual: number;
    plazoMeses: number;
    cuotaMensual: number;
    subsidioPorcentaje: number;
    fechaInicio: Date;
    estado: EstadoCredito;
    tipoPago: TipoPago;
    createdAt: Date;
    updatedAt: Date;
}

const CreditSchema = new Schema<ICreditDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        valorInicial: {
            type: Number,
            required: true,
            min: 0,
        },
        saldoActual: {
            type: Number,
            required: true,
            min: 0,
        },
        tasaInteresAnual: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        plazoMeses: {
            type: Number,
            required: true,
            min: 1,
        },
        cuotaMensual: {
            type: Number,
            required: true,
            min: 0,
        },
        subsidioPorcentaje: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        fechaInicio: {
            type: Date,
            required: true,
        },
        estado: {
            type: String,
            enum: Object.values(EstadoCredito),
            default: EstadoCredito.ACTIVO,
        },
        tipoPago: {
            type: String,
            enum: Object.values(TipoPago),
            default: TipoPago.MENSUAL,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

CreditSchema.index({ userId: 1, estado: 1 });
CreditSchema.index({ userId: 1, fechaInicio: -1 });

export const CreditModel = mongoose.model<ICreditDocument>('Credit', CreditSchema);
