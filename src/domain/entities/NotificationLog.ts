export interface INotificationLog {
    id: string;
    userId: string;
    serviceId: string;
    fechaLimite: Date;
    diasAntes: number;
    mensajeEnviado: string;
    whatsappMessageId: string;
    estado: 'pending' | 'sent' | 'failed' | 'read';
    createdAt: Date;
}
