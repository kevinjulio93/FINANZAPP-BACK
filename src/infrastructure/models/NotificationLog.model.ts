import mongoose from 'mongoose';
import { INotificationLog } from '../../domain/entities/NotificationLog';

const NotificationLogSchema = new mongoose.Schema<INotificationLog>({
    userId: { type: String, required: true, index: true },
    serviceId: { type: String, required: true, index: true },
    fechaLimite: { type: Date, required: true },
    diasAntes: { type: Number, required: true },
    mensajeEnviado: { type: String, required: true },
    whatsappMessageId: { type: String, required: true },
    estado: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const NotificationLogModel = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
