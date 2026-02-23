import { WhatsAppTemplateModel } from "../../infrastructure/models/WhatsAppTemplate.model";
import { WhatsAppTemplateDefinition, WhatsAppTemplatePurpose } from "../entities/WhatsAppTemplate";
import { IWhatsAppTemplateRepository } from "./Interfaces/IWhatsAppTemplateRepository";

export class WhatsAppTemplateRepository implements IWhatsAppTemplateRepository {
    async save(template: WhatsAppTemplateDefinition): Promise<WhatsAppTemplateDefinition> {
        const query = { id: template.id };
        const update = { ...template };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const doc = await WhatsAppTemplateModel.findOneAndUpdate(query, update, options);
        return doc!.toObject() as unknown as WhatsAppTemplateDefinition;
    }

    async findById(id: string): Promise<WhatsAppTemplateDefinition | null> {
        const doc = await WhatsAppTemplateModel.findOne({ id });
        return doc ? (doc.toObject() as unknown as WhatsAppTemplateDefinition) : null;
    }

    async findByPurpose(purpose: WhatsAppTemplatePurpose, language?: string): Promise<WhatsAppTemplateDefinition | null> {
        const query: any = { purpose };
        if (language) {
            query.language = language;
        }
        const doc = await WhatsAppTemplateModel.findOne(query).sort({ createdAt: -1 });
        return doc ? (doc.toObject() as unknown as WhatsAppTemplateDefinition) : null;
    }
}
