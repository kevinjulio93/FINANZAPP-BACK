import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './infrastructure/database/connection';
import authRoutes from './presentation/routes/auth.routes';
import categoryRoutes from './presentation/routes/category.routes';
import serviceRoutes from './presentation/routes/service.routes';
import dashboardRoutes from './presentation/routes/dashboard.routes';
import creditRoutes from './presentation/routes/credit.routes';
import pagoRoutes from './presentation/routes/pago.routes';
import chatRoutes from './presentation/routes/chat.routes';
import importRoutes from './presentation/routes/import.routes';
import comparisonRoutes from './presentation/routes/comparison.routes';
import whatsappRoutes from './presentation/routes/whatsapp.routes';
import exportImportRoutes from './presentation/routes/export-import.routes';
import { setupSwagger } from './config/swagger';
import { SchedulerService } from './infrastructure/services/SchedulerService';
import { NotificationService } from './application/services/NotificationService';
import { UserRepository } from './domain/repositories/UserRepository';
import { AIMessageService } from './application/services/AIMessageService';
import { WhatsAppService } from './infrastructure/services/WhatsAppService';
import { VertexService } from './infrastructure/services/VertexService';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Scheduler
const userRepository = new UserRepository();
const vertexService = new VertexService();
const aiMessageService = new AIMessageService(vertexService);
const whatsappService = new WhatsAppService();
const notificationService = new NotificationService(userRepository, aiMessageService, whatsappService);
const schedulerService = new SchedulerService(notificationService);

schedulerService.start();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/import', importRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/export-import', exportImportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
