import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { ChatService } from "../../application/services/ChatService";
import { AnalysisService } from "../../application/services/AnalysisService";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { AIServiceFactory } from "../../infrastructure/services/AIServiceFactory";

const router: Router = Router();

// Dependency Injection (Manual for now)
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const analysisService = new AnalysisService(pagoRepository, serviceRepository);
const aiService = AIServiceFactory.createService();
const chatService = new ChatService(analysisService, aiService, pagoRepository, serviceRepository);
const chatController = new ChatController(chatService);

router.post("/", AuthenticationToken, (req, res) => chatController.chat(req as any, res));

export default router;
