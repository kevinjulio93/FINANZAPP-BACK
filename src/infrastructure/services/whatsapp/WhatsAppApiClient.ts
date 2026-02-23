export class WhatsAppApiClient {
    private apiUrl: string;
    private token: string;
    private phoneId: string;

    constructor() {
        this.token = process.env.WHATSAPP_TOKEN || '';
        this.phoneId = process.env.WHATSAPP_PHONE_ID || '';
        this.apiUrl = `https://graph.facebook.com/v22.0`;
    }

    async sendTextMessage(to: string, message: string): Promise<any> {
        if (!this.token || !this.phoneId) {
            throw new Error('WhatsApp credentials not configured');
        }

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace('+', ''),
            type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        };

        const response = await fetch(`${this.apiUrl}/${this.phoneId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to send WhatsApp message');
        }
        return data;
    }

    async sendTemplateMessage(params: {
        to: string;
        templateName: string;
        language: string;
        bodyParams?: string[];
    }): Promise<any> {
        if (!this.token || !this.phoneId) {
            throw new Error('WhatsApp credentials not configured');
        }

        const payload = {
            messaging_product: 'whatsapp',
            to: params.to.replace('+', ''),
            type: 'template',
            template: {
                name: params.templateName,
                language: { code: params.language },
                components: params.bodyParams?.length
                    ? [
                        {
                            type: 'body',
                            parameters: params.bodyParams.map((v) => ({
                                type: 'text',
                                text: v,
                            })),
                        },
                    ]
                    : undefined,
            },
        };

        const response = await fetch(`${this.apiUrl}/${this.phoneId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to send WhatsApp message');
        }
        return data;
    }

    async createTemplate(wabaId: string, template: any): Promise<any> {
        const url = `${this.apiUrl}/${wabaId}/message_templates`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            console.error('[WHATSAPP API ERROR]', JSON.stringify(data, null, 2));
            const message = data.error?.message || 'Failed to create WhatsApp template';
            const subcode = data.error?.error_subcode ? ` (Subcode: ${data.error.error_subcode})` : '';
            const details = data.error?.error_data?.details ? `: ${data.error.error_data.details}` : '';
            throw new Error(`${message}${subcode}${details}`);
        }
        return data;
    }

    async deleteTemplate(wabaId: string, templateName: string): Promise<any> {
        const url = `${this.apiUrl}/${wabaId}/message_templates?name=${templateName}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        const data = await response.json() as any;

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to delete WhatsApp template');
        }
        return data;
    }

    async listTemplates(wabaId: string): Promise<any> {
        const url = `${this.apiUrl}/${wabaId}/message_templates`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        const data = await response.json() as any;

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to list WhatsApp templates');
        }
        return data;
    }
}
