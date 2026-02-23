export interface IWhatsAppMessageService {
    sendVerificationMessage(input: {
        phone: string;           // 57...
        verificationCode: string;
        language?: string;
    }): Promise<void>;

    sendReminderMessage(input: {
        phone: string;
        reminderType: 'APPOINTMENT' | 'PAYMENT' | 'GENERIC';
        variables: string[];     // valores para {{1}}, {{2}}, etc.
        language?: string;
    }): Promise<void>;
}
