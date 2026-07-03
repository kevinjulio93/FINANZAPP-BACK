export class UltraMsgService {
    private instanceId: string;
    private token: string;
    private apiUrl: string;

    constructor() {
        this.instanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
        this.token = process.env.ULTRAMSG_TOKEN || '';
        this.apiUrl = 'https://api.ultramsg.com';
    }

    async sendTextMessage(to: string, message: string): Promise<any> {
        if (!this.instanceId || !this.token) {
            throw new Error('UltraMsg credentials not configured');
        }

        const payload = {
            token: this.token,
            to: to.replace('+', ''),
            body: message,
        };

        const response = await fetch(`${this.apiUrl}/${this.instanceId}/messages/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send UltraMsg message');
        }
        return data;
    }
}
