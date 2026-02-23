import { WhatsAppTemplateDefinition, WhatsAppTemplateCategory, WhatsAppTemplatePurpose } from "../../entities/WhatsAppTemplate";

export interface IWhatsAppTemplateControl {
    // Crear template en Meta (vía Graph API) a partir de una definición interna
    createTemplateInMeta(
        definition: WhatsAppTemplateDefinition
    ): Promise<WhatsAppTemplateDefinition>;

    // Registrar template en tu sistema (BD) usando IA para generar texto
    registerTemplateWithAI(
        params: {
            purpose: WhatsAppTemplatePurpose;
            language: string;
            category: WhatsAppTemplateCategory;
            aiPromptContext: Record<string, any>; // descripción de caso de uso: verificación, recordatorio, etc.
        }
    ): Promise<WhatsAppTemplateDefinition>;

    // Obtener template por propósito (para uso en el módulo de envío)
    getTemplateByPurpose(
        purpose: WhatsAppTemplatePurpose,
        language?: string
    ): Promise<WhatsAppTemplateDefinition | null>;
}
