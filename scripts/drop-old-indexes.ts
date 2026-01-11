import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropOldIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/finanzas?authSource=admin';
    await mongoose.connect(mongoUri);
    
    
    // Eliminar índice antiguo de id en categories
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');
    
    try {
      await categoriesCollection.dropIndex('id_1');

    } catch (error: any) {
        throw new Error(`Failed to drop index 'id_1': ${error.message}`);
    }
    const indexes = await categoriesCollection.indexes();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

dropOldIndexes();
