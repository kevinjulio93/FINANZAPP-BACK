import 'dotenv/config';
import mongoose from 'mongoose';
import { WhatsAppTemplateModel } from './src/infrastructure/models/WhatsAppTemplate.model';

async function check() {
    await mongoose.connect(process.env.MONGO_URI!);
    const templates = await WhatsAppTemplateModel.find({});
    console.log('Templates in DB:', JSON.stringify(templates, null, 2));
    await mongoose.disconnect();
}

check();
