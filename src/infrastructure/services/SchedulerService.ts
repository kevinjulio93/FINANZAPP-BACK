import cron from 'node-cron';
import { NotificationService } from '../../application/services/NotificationService';

export class SchedulerService {
    constructor(private notificationService: NotificationService) { }

    start() {
        // Schedule for 9:00 AM every day
        cron.schedule('0 9 * * *', async () => {
            // In a real app we might want to use a job queue (BullMQ as spec suggested) but node-cron is fine for MVP
            try {
                await this.notificationService.checkAndSendReminders();
            } catch (error) {
                console.error('Error in scheduled reminder job:', error);
            }
        }, {
            timezone: process.env.CRON_TIMEZONE || "America/Bogota"
        });

        console.log('📅 Scheduler started: 0 9 * * *');
    }
}
