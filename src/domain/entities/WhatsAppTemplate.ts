export type WhatsAppTemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';

export interface WhatsAppTemplateComponentBody {
    type: 'BODY';
    text?: string;           // Opcional si se usa add_security_recommendation
    add_security_recommendation?: boolean;
    example?: {
        body_text: string[][];
    };
}

export interface WhatsAppTemplateComponentButtons {
    type: 'BUTTONS';
    buttons: Array<{
        type: 'FLOW' | 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER' | 'OTP';
        text: string;
        flow_action?: 'navigate';
        flow_json?: string;
        navigate_screen?: string;
        url?: string;
        phone_number?: string;
        otp_type?: 'COPY_CODE' | 'ONE_TAP';
    }>;
}

export interface WhatsAppTemplateComponentFooter {
    type: 'FOOTER';
    text: string;
}

export type WhatsAppTemplateComponent =
    | WhatsAppTemplateComponentBody
    | WhatsAppTemplateComponentFooter
    | WhatsAppTemplateComponentButtons;

export type WhatsAppTemplatePurpose = 'PHONE_VERIFICATION' | 'REMINDER_GENERIC' | 'REMINDER_APPOINTMENT';
export type WhatsAppTemplateStatus = 'LOCAL_ONLY' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WhatsAppTemplateDefinition {
    id: string;                         // interno
    name: string;                       // minúscula, snake_case (p.ej. phone_verification_code)
    language: string;                   // en_US, es_ES, etc.
    category: WhatsAppTemplateCategory;
    components: WhatsAppTemplateComponent[];
    metaTemplateId?: string;            // id devuelto por Meta si lo guardas
    status: WhatsAppTemplateStatus;
    purpose: WhatsAppTemplatePurpose;
}
