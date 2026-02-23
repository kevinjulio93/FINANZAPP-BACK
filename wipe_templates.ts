import 'dotenv/config';
import mongoose from 'mongoose';
import { WhatsAppTemplateModel } from './src/infrastructure/models/WhatsAppTemplate.model';

async function check() {
    await mongoose.connect(process.env.MONGO_URI!);
    const deleted = await WhatsAppTemplateModel.deleteMany({});
    console.log('Deleted templates:', deleted.deletedCount);
    await mongoose.disconnect();
}

check();
