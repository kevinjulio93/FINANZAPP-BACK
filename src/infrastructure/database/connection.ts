import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/finanzas';
    
    await mongoose.connect(mongoUri);
  } catch (error) {
    throw error;
  }
};
