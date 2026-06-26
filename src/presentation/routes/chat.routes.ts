import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { ChatService } from "../../application/services/ChatService";
import { AnalysisService } from "../../application/services/AnalysisService";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { CategoryRepository } from "../../infrastructure/repositories/CategoryRepository";
import { DashboardRepository } from "../../infrastructure/repositories/DashboardRepository";
import { AIServiceFactory } from "../../infrastructure/services/AIServiceFactory";

const router: Router = Router();

// Dependency Injection
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const categoryRepository = new CategoryRepository();
const dashboardRepository = new DashboardRepository();
const analysisService = new AnalysisService(pagoRepository, serviceRepository);
const aiService = AIServiceFactory.createService();
const chatService = new ChatService(analysisService, aiService, pagoRepository, serviceRepository, categoryRepository, dashboardRepository);
const chatController = new ChatController(chatService);

router.post("/", AuthenticationToken, (req, res) => chatController.chat(req as any, res));
router.post("/stream", AuthenticationToken, (req, res) => chatController.chatStream(req as any, res));

export default router;
