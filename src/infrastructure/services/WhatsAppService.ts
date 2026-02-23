import { WhatsAppApiClient } from "./whatsapp/WhatsAppApiClient";
import { WhatsAppTemplateControl } from "./whatsapp/WhatsAppTemplateControl";
import { WhatsAppMessageService } from "./whatsapp/WhatsAppMessageService";
import { WhatsAppTemplateRepository } from "../../domain/repositories/WhatsAppTemplateRepository";
import { AIServiceFactory } from "./AIServiceFactory";
import { WhatsAppTemplatePurpose, WhatsAppTemplateCategory } from "../../domain/entities/WhatsAppTemplate";

export class WhatsAppService {
    private apiClient: WhatsAppApiClient;
    private templateControl: WhatsAppTemplateControl;
    private messageService: WhatsAppMessageService;

    constructor() {
        this.apiClient = new WhatsAppApiClient();
        const repository = new WhatsAppTemplateRepository();
        const aiService = AIServiceFactory.createService();
        this.templateControl = new WhatsAppTemplateControl(this.apiClient, aiService, repository);
        this.messageService = new WhatsAppMessageService(this.templateControl, this.apiClient);
    }

    /**
     * Legacy method for sending text messages.
     * Note: Future implementations should prefer templates for better deliverability on WhatsApp.
     */
    async sendTextMessage(to: string, message: string): Promise<any> {
        return this.apiClient.sendTextMessage(to, message);
    }

    async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'en_US', components: any[] = []): Promise<any> {
        return this.apiClient.sendTemplateMessage({
            to,
            templateName,
            language: languageCode,
            bodyParams: components.map(c => c.parameters?.map((p: any) => p.text)).flat().filter(Boolean)
        });
    }

    // New High Level Methods

    async sendVerification(phone: string, code: string, language?: string): Promise<void> {
        return this.messageService.sendVerificationMessage({
            phone,
            verificationCode: code,
            language
        });
    }

    async registerTemplate(params: {
        purpose: WhatsAppTemplatePurpose;
        language: string;
        category: WhatsAppTemplateCategory;
        aiPromptContext: Record<string, any>;
    }) {
        return this.templateControl.registerTemplateWithAI(params);
    }

    async createMetaTemplate(id: string) {
        const template = await this.templateControl.getTemplateByPurpose(id as any); // Simplification
        if (!template) throw new Error("Template not found");
        return this.templateControl.createTemplateInMeta(template);
    }
}
