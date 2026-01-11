import mongoose, { Schema, Document } from 'mongoose';

export interface IPagoMensualDocument extends Document {
    serviceId: mongoose.Types.ObjectId;
    mes: number;
    año: number;
    valorPagado: number;
    fechaPago: Date;
    metodoPago?: string;
    notas?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PagoMensualSchema = new Schema<IPagoMensualDocument>(
    {
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: true,
        },
        mes: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        año: {
            type: Number,
            required: true,
        },
        valorPagado: {
            type: Number,
            required: true,
            min: 0,
        },
        fechaPago: {
            type: Date,
            required: true,
            default: Date.now,
        },
        metodoPago: {
            type: String,
            enum: ['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'OTRO'],
        },
        notas: {
            type: String,
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

// Índice compuesto para búsquedas eficientes por servicio y mes/año
PagoMensualSchema.index({ serviceId: 1, mes: 1, año: 1 });

export const PagoMensualModel = mongoose.model<IPagoMensualDocument>('PagoMensual', PagoMensualSchema);
