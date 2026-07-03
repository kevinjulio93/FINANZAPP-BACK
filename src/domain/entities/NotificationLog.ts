export interface INotificationLog {
    id: string;
    userId: string;
    serviceId: string;
    tipo: 'payment_reminder' | 'missing_date_reminder';
    fechaLimite: Date;
    diasAntes: number;
    mensajeEnviado: string;
    whatsappMessageId: string;
    estado: 'pending' | 'sent' | 'failed' | 'read';
    createdAt: Date;
}
