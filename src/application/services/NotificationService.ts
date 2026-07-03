import { AIMessageService } from "./AIMessageService";
import { UltraMsgService } from "../../infrastructure/services/UltraMsgService";
import { NotificationLogModel } from "../../infrastructure/models/NotificationLog.model";
import { IUserRepository } from "../../domain/repositories/Interfaces/IUserRepository";
import { ServiceModel } from "../../infrastructure/models/Service.model";

export class NotificationService {
    constructor(
        private userRepository: IUserRepository,
        private aiMessageService: AIMessageService,
        private ultraMsgService: UltraMsgService
    ) { }

    async checkAndSendReminders() {
        console.log("⏰ checking for due payments...");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const services = await ServiceModel.find({
            fechaLimitePago: { $exists: true, $ne: null },
            estado: { $ne: 'PAGADO' }
        });

        let remindersSent = 0;

        for (const service of services) {
            if (!service.fechaLimitePago || !service.diasRecordatorio) continue;

            const dueDate = new Date(service.fechaLimitePago);
            dueDate.setHours(0, 0, 0, 0);

            for (const remindersDay of service.diasRecordatorio) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + remindersDay);
                targetDate.setHours(0, 0, 0, 0);

                if (targetDate.getTime() === dueDate.getTime()) {
                    await this.sendReminder(service, remindersDay);
                    remindersSent++;
                }
            }
        }

        // If no reminders were sent, notify users with services missing payment dates
        if (remindersSent === 0) {
            console.log("No reminders triggered. Checking for services without payment dates...");
            await this.sendMissingDateReminders();
        }
    }

    private async sendMissingDateReminders() {
        try {
            // Find users who have at least one service without fechaLimitePago
            const usersWithMissingDates = await ServiceModel.aggregate([
                {
                    $match: {
                        $or: [
                            { fechaLimitePago: { $exists: false } },
                            { fechaLimitePago: null }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$userId',
                        servicesWithoutDate: { $sum: 1 }
                    }
                }
            ]);

            for (const entry of usersWithMissingDates) {
                const userId = entry._id.toString();
                const user = await this.userRepository.getUserById(userId);
                if (!user || !user.whatsappPhone) continue;

                // Check if already sent this week (avoid spamming)
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                const existingLog = await NotificationLogModel.findOne({
                    userId,
                    tipo: 'missing_date_reminder',
                    createdAt: { $gte: weekAgo }
                });

                if (existingLog) {
                    console.log(`Skipping missing-date reminder for ${user.name} (already sent this week)`);
                    continue;
                }

                const message = `📅 *FinanzApp* - Configura tus fechas de pago\n\nHola ${user.name}, tienes ${entry.servicesWithoutDate} servicio(s) sin fecha límite de pago configurada. Para recibir recordatorios, edita cada servicio y establece su fecha de pago.\n\n¡Así no olvidarás ningún pago! 🚀`;

                console.log(`Sending missing-date reminder to ${user.name} (${entry.servicesWithoutDate} services)`);

                const response = await this.ultraMsgService.sendTextMessage(user.whatsappPhone, message);

                await NotificationLogModel.create({
                    userId: user.id,
                    serviceId: 'none',
                    tipo: 'missing_date_reminder',
                    fechaLimite: new Date(),
                    diasAntes: 0,
                    mensajeEnviado: message,
                    whatsappMessageId: response?.id || 'unknown',
                    estado: response ? 'sent' : 'failed'
                });
            }
        } catch (error) {
            console.error('Error sending missing-date reminders:', error);
        }
    }

    private async sendReminder(service: any, daysRemaining: number) {
        try {
            const user = await this.userRepository.getUserById(service.userId.toString());
            if (!user || !user.whatsappPhone) return;

            const existingLog = await NotificationLogModel.findOne({
                serviceId: service.id,
                fechaLimite: service.fechaLimitePago,
                diasAntes: daysRemaining,
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            });

            if (existingLog) {
                console.log(`Skipping duplicate reminder for service ${service.name}`);
                return;
            }

            console.log(`Sending reminder for ${service.name} to ${user.name} (${daysRemaining} days left)`);

            const message = await this.aiMessageService.generateReminder(user, service, daysRemaining);

            const response = await this.ultraMsgService.sendTextMessage(user.whatsappPhone, message);

            await NotificationLogModel.create({
                userId: user.id,
                serviceId: service.id,
                tipo: 'payment_reminder',
                fechaLimite: service.fechaLimitePago,
                diasAntes: daysRemaining,
                mensajeEnviado: message,
                whatsappMessageId: response?.id || 'unknown',
                estado: response ? 'sent' : 'failed'
            });

        } catch (error) {
            console.error(`Error sending reminder for service ${service.id}:`, error);
        }
    }
}
