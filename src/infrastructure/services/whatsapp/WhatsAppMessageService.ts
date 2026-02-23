import { IWhatsAppMessageService } from "../../../domain/services/Interfaces/IWhatsAppMessageService";
import { IWhatsAppTemplateControl } from "../../../domain/services/Interfaces/IWhatsAppTemplateControl";
import { WhatsAppApiClient } from "./WhatsAppApiClient";

export class WhatsAppMessageService implements IWhatsAppMessageService {
    constructor(
        private templateControl: IWhatsAppTemplateControl,
        private apiClient: WhatsAppApiClient
    ) { }

    async sendVerificationMessage(input: {
        phone: string;
        verificationCode: string;
        language?: string;
    }): Promise<void> {
        let template = await this.templateControl.getTemplateByPurpose('PHONE_VERIFICATION', input.language);

        // If not found, register it with AI
        if (!template) {
            console.log('Template PHONE_VERIFICATION not found. Registering with AI...');
            template = await this.templateControl.registerTemplateWithAI({
                purpose: 'PHONE_VERIFICATION',
                language: input.language || 'es_CO',
                category: 'AUTHENTICATION',
                aiPromptContext: { appName: 'FinanzApp' }
            });
        }

        // If local but not in Meta, try to push it
        if (template && template.status === 'LOCAL_ONLY') {
            console.log(`Template ${template.name} is LOCAL_ONLY. Attempting to create in Meta...`);
            try {
                template = await this.templateControl.createTemplateInMeta(template);
                console.log('Template created in Meta successfully.');
            } catch (error: any) {
                console.warn(`Could not create template in Meta: ${error.message}. Falling back to text message for now.`);
            }
        }

        // Try to send using template
        if (template && template.status !== 'LOCAL_ONLY') {
            try {
                await this.apiClient.sendTemplateMessage({
                    to: input.phone,
                    templateName: template.name,
                    language: template.language,
                    bodyParams: [input.verificationCode]
                });
                return;
            } catch (error: any) {
                console.warn('Failed to send template message, falling back to text:', error.message);
            }
        }

        // Final Fallback: Text message
        await this.apiClient.sendTextMessage(input.phone, `Tu código de verificación para FinanzApp es: ${input.verificationCode}`);
    }

    async sendReminderMessage(input: {
        phone: string;
        reminderType: 'APPOINTMENT' | 'PAYMENT' | 'GENERIC';
        variables: string[];
        language?: string;
    }): Promise<void> {
        let purpose: 'REMINDER_APPOINTMENT' | 'REMINDER_GENERIC';
        if (input.reminderType === 'APPOINTMENT') {
            purpose = 'REMINDER_APPOINTMENT';
        } else {
            purpose = 'REMINDER_GENERIC';
        }

        const template = await this.templateControl.getTemplateByPurpose(purpose, input.language);

        if (!template) {
            throw new Error(`No WhatsApp template configured for purpose: ${purpose}`);
        }

        await this.apiClient.sendTemplateMessage({
            to: input.phone,
            templateName: template.name,
            language: template.language,
            bodyParams: input.variables
        });
    }
}
