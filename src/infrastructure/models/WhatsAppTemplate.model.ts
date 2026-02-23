import mongoose, { Schema, Document } from 'mongoose';
import { WhatsAppTemplateDefinition } from '../../domain/entities/WhatsAppTemplate';

export interface IWhatsAppTemplateDocument extends Omit<WhatsAppTemplateDefinition, 'id'>, Document { }

const WhatsAppTemplateSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    language: { type: String, required: true },
    category: { type: String, required: true },
    components: { type: Array, required: true },
    metaTemplateId: { type: String },
    status: { type: String, required: true },
    purpose: { type: String, required: true },
}, { timestamps: true });

export const WhatsAppTemplateModel = mongoose.model<IWhatsAppTemplateDocument>('WhatsAppTemplate', WhatsAppTemplateSchema);
