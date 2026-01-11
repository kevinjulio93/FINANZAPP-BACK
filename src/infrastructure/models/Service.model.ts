import mongoose from "mongoose";
import { EstadoServicio, IService } from "../../domain/entities/Service";


const ServiceSchema = new mongoose.Schema<IService>({
    name: { type: String, required: true },
    montoEstimado: { type: Number, required: true },
    fechaUltimoPago: { type: Date },
    estado: { type: String, enum: Object.values(EstadoServicio), default: EstadoServicio.PENDIENTE },
    proximoPago: { type: Date, required: false },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

ServiceSchema.virtual('pagosMensuales', {
    ref: 'PagoMensual',
    localField: '_id',
    foreignField: 'serviceId',
});

ServiceSchema.virtual('id').get(function() {
    // @ts-ignore
    return this._id.toString();
});

export const ServiceModel = mongoose.model<IService>("Service", ServiceSchema);