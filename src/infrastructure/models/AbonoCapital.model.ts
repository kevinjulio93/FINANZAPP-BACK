import mongoose, { Schema, Document } from 'mongoose';

export interface IAbonoCapitalDocument extends Document {
    creditId: mongoose.Types.ObjectId;
    monto: number;
    fecha: Date;
    saldoAnterior: number;
    saldoNuevo: number;
    cuotaAnterior: number;
    cuotaNueva: number;
    plazoAnterior: number;
    plazoNuevo: number;
    createdAt: Date;
    updatedAt: Date;
}

const AbonoCapitalSchema = new Schema<IAbonoCapitalDocument>(
    {
        creditId: {
            type: Schema.Types.ObjectId,
            ref: 'Credit',
            required: true,
        },
        monto: {
            type: Number,
            required: true,
            min: 0,
        },
        fecha: {
            type: Date,
            required: true,
            default: Date.now,
        },
        saldoAnterior: {
            type: Number,
            required: true,
        },
        saldoNuevo: {
            type: Number,
            required: true,
        },
        cuotaAnterior: {
            type: Number,
            required: true,
        },
        cuotaNueva: {
            type: Number,
            required: true,
        },
        plazoAnterior: {
            type: Number,
            required: true,
        },
        plazoNuevo: {
            type: Number,
            required: true,
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

AbonoCapitalSchema.index({ creditId: 1, fecha: -1 });

export const AbonoCapitalModel = mongoose.model<IAbonoCapitalDocument>('AbonoCapital', AbonoCapitalSchema);
