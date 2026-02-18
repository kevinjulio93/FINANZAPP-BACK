import { Router } from "express";
import { ImportController } from "../controllers/ImportController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { ImportService } from "../../application/services/ImportService";
import { AIServiceFactory } from "../../infrastructure/services/AIServiceFactory";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { CategoryRepository } from "../../infrastructure/repositories/CategoryRepository";

const router: Router = Router();

// Dependency Injection
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const categoryRepository = new CategoryRepository();
const aiService = AIServiceFactory.createService();
const importService = new ImportService(serviceRepository, pagoRepository, aiService, categoryRepository);
const importController = new ImportController(importService);

router.post("/analyze", AuthenticationToken, (req, res) => importController.analyze(req as any, res));
router.post("/confirm", AuthenticationToken, (req, res) => importController.confirm(req as any, res));

export default router;
