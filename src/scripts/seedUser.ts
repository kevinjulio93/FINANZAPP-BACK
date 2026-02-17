/**
 * Script para crear un usuario demo en la base de datos
 * Ejecutar con: npx ts-node src/scripts/seedUser.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../infrastructure/models/User.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finanzapp';

async function seedUser() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si el usuario ya existe
        const existingUser = await UserModel.findOne({ id: "1" });
        if (existingUser) {
            console.log('⚠️  El usuario demo ya existe en la base de datos');
            await mongoose.disconnect();
            return;
        }

        // Crear hash del password
        const passwordHash = await bcrypt.hash('demo123', 10);

        // Crear el usuario
        const demoUser = new UserModel({
            id: "1",
            name: "Usuario Demo",
            email: "demo@finanzapp.com",
            passwordHash: passwordHash,
            monthlyBudget: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await demoUser.save();
        console.log('✅ Usuario demo creado exitosamente');
        console.log('📧 Email: demo@finanzapp.com');
        console.log('🔑 Password: demo123');

        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error al crear el usuario:', error);
        process.exit(1);
    }
}

seedUser();
