import 'dotenv/config';
import { IWhatsAppTemplateControl } from "../../../domain/services/Interfaces/IWhatsAppTemplateControl";
import { WhatsAppTemplateDefinition, WhatsAppTemplatePurpose, WhatsAppTemplateCategory } from "../../../domain/entities/WhatsAppTemplate";
import { IWhatsAppTemplateRepository } from "../../../domain/repositories/Interfaces/IWhatsAppTemplateRepository";
import { WhatsAppApiClient } from "./WhatsAppApiClient";
import { IOpenAIService } from "../../../domain/services/Interfaces/IAnalysisService";
import mongoose from 'mongoose';

export class WhatsAppTemplateControl implements IWhatsAppTemplateControl {
    constructor(
        private apiClient: WhatsAppApiClient,
        private aiService: IOpenAIService,
        private repository: IWhatsAppTemplateRepository,
        private wabaId: string = process.env.WHATSAPP_WABA_ID || ''
    ) {
        console.log(`[WHATSAPP] Initialized with WABA_ID: ${this.wabaId}`);
    }

    async createTemplateInMeta(definition: WhatsAppTemplateDefinition): Promise<WhatsAppTemplateDefinition> {
        if (!this.wabaId) {
            throw new Error('WHATSAPP_WABA_ID is not configured in .env');
        }
        const payload = {
            name: definition.name.toLowerCase(),
            category: definition.category,
            language: definition.language,
            components: definition.components.map(comp => {
                if (comp.type === 'BODY') {
                    const body: any = { type: 'BODY' };
                    if (comp.add_security_recommendation) {
                        body.add_security_recommendation = true;
                    } else if (comp.text) {
                        body.text = comp.text;
                    }

                    // Solo añadir example si no es autenticación o si tenemos texto y no seguridad
                    if (comp.example && definition.category !== 'AUTHENTICATION') {
                        body.example = comp.example;
                    }
                    return body;
                }
                if (comp.type === 'FOOTER') {
                    return {
                        type: 'FOOTER',
                        text: comp.text
                    };
                }
                if (comp.type === 'BUTTONS') {
                    return {
                        type: 'BUTTONS',
                        buttons: comp.buttons
                    };
                }
                return comp;
            })
        };

        console.log('[WHATSAPP] Creating template with payload:', JSON.stringify(payload, null, 2));

        const result = await this.apiClient.createTemplate(this.wabaId, payload);

        definition.metaTemplateId = result.id;
        definition.status = 'PENDING'; // Usually pending after creation

        return await this.repository.save(definition);
    }

    async registerTemplateWithAI(params: {
        purpose: WhatsAppTemplatePurpose;
        language: string;
        category: WhatsAppTemplateCategory;
        aiPromptContext: Record<string, any>;
    }): Promise<WhatsAppTemplateDefinition> {
        let prompt = '';
        if (params.category === 'AUTHENTICATION') {
            prompt = `Genera un mensaje MUY BREVE para un código de verificación de WhatsApp en ${params.language}. 
            DEBE contener exactamente una variable {{1}} para el código. 
            Ejemplo: "Tu código de verificación de FinanzApp es {{1}}."
            No añadas saludos ni despedidas. Responde SOLO con el texto.`;
        } else {
            prompt = `Genera un body para un template de WhatsApp categoría ${params.category} en ${params.language} para ${params.purpose}. 
            Contexto adicional: ${JSON.stringify(params.aiPromptContext)}.
            Usa variables {{1}}, {{2}}, etc. si es necesario.
            Responde SOLO con el texto del body.`;
        }

        const components: any[] = [];

        if (params.category === 'AUTHENTICATION') {
            // Para AUTHENTICATION, Meta prefiere add_security_recommendation: true
            // Esto genera automáticamente un cuerpo tipo: "<CÓDIGO> es tu código de verificación..."
            // No incluimos FOOTER ya que Meta arroja error de campos inesperados.
            components.push({
                type: 'BODY',
                add_security_recommendation: true
            });

            components.push({
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'OTP',
                        otp_type: 'COPY_CODE',
                        text: 'Copiar código'
                    }
                ]
            });
        } else {
            // Para otras categorías (UTILITY, MARKETING) seguimos usando IA
            const aiResponse = await this.aiService.generateResponse('system', prompt);
            const bodyText = aiResponse.content;

            components.push({
                type: 'BODY',
                text: bodyText,
                example: bodyText.includes('{{1}}') ? {
                    body_text: [['123456']]
                } : undefined
            });
        }

        const definition: WhatsAppTemplateDefinition = {
            id: new mongoose.Types.ObjectId().toHexString(),
            name: `auth_otp_verification`,
            language: params.language,
            category: params.category,
            components: components,
            status: 'LOCAL_ONLY',
            purpose: params.purpose
        };

        return await this.repository.save(definition);
    }

    async getTemplateByPurpose(purpose: WhatsAppTemplatePurpose, language?: string): Promise<WhatsAppTemplateDefinition | null> {
        return await this.repository.findByPurpose(purpose, language);
    }
}
