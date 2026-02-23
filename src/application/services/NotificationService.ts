import { AIMessageService } from "./AIMessageService";
import { WhatsAppService } from "../../infrastructure/services/WhatsAppService";
import { NotificationLogModel } from "../../infrastructure/models/NotificationLog.model";
import { IUserRepository } from "../../domain/repositories/Interfaces/IUserRepository";
import { ServiceModel } from "../../infrastructure/models/Service.model";

export class NotificationService {
    constructor(
        private userRepository: IUserRepository,
        private aiMessageService: AIMessageService,
        private whatsappService: WhatsAppService
    ) { }

    async checkAndSendReminders() {
        console.log("⏰ checking for due payments...");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // This query needs to find services where TODAY + X days = fechaLimitePago
        // Easier approach: Get all services with fechaLimitePago set and not paid
        // But iterating all might be slow if many services.
        // For efficiency, we can query only relevant ones. 
        // Let's implement a query in repository or use mongoose directly here for simplicity if repository method missing.

        // Assuming we look for reminders 3 days before and 1 day before (as per spec default)
        // Or specific 'diasRecordatorio' field.

        // Let's iterate services that have fechaLimitePago defined and evaluate in JS for now (MVP).
        // Or build a range query: fechaLimitePago in [Today+1, Today+3]

        const services = await ServiceModel.find({
            fechaLimitePago: { $exists: true, $ne: null },
            estado: { $ne: 'PAGADO' }
        });

        for (const service of services) {
            if (!service.fechaLimitePago || !service.diasRecordatorio) continue;

            const dueDay = new Date(service.fechaLimitePago).getDate();

            // Iterate over each reminder config (e.g. 3 days before, 1 day before)
            for (const remindersDay of service.diasRecordatorio) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + remindersDay);

                if (targetDate.getDate() === dueDay) {
                    // It is time to send a reminder!
                    await this.sendReminder(service, remindersDay);
                }
            }
        }
    }

    private async sendReminder(service: any, daysRemaining: number) {
        try {
            const user = await this.userRepository.getUserById(service.userId.toString());
            if (!user || !user.whatsappPhone) return;

            // Check if already sent today (to avoid duplicates if script runs multiple times)
            const existingLog = await NotificationLogModel.findOne({
                serviceId: service.id,
                fechaLimite: service.fechaLimitePago,
                diasAntes: daysRemaining,
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            });

            if (existingLog) {
                console.log(`Skipping duplicate reminder for service ${service.name}`);
                return;
            }

            console.log(`Sending reminder for ${service.name} to ${user.name} (${daysRemaining} days left)`);

            // 1. Generate AI Message
            const message = await this.aiMessageService.generateReminder(user, service, daysRemaining);

            // 2. Send via WhatsApp
            // user.whatsappPhone should be formatted correctly (spec says E.164)
            const waResponse = await this.whatsappService.sendTextMessage(user.whatsappPhone, message);

            // 3. Log
            await NotificationLogModel.create({
                userId: user.id,
                serviceId: service.id,
                fechaLimite: service.fechaLimitePago,
                diasAntes: daysRemaining,
                mensajeEnviado: message,
                whatsappMessageId: waResponse?.messages?.[0]?.id || 'unknown',
                estado: waResponse ? 'sent' : 'failed'
            });

        } catch (error) {
            console.error(`Error sending reminder for service ${service.id}:`, error);
        }
    }
}
