import { WhatsAppTemplateDefinition, WhatsAppTemplatePurpose } from "../../entities/WhatsAppTemplate";

export interface IWhatsAppTemplateRepository {
    save(template: WhatsAppTemplateDefinition): Promise<WhatsAppTemplateDefinition>;
    findById(id: string): Promise<WhatsAppTemplateDefinition | null>;
    findByPurpose(purpose: WhatsAppTemplatePurpose, language?: string): Promise<WhatsAppTemplateDefinition | null>;
}
