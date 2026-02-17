import { Router } from "express";
import { ImportController } from "../controllers/ImportController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { ImportService } from "../../application/services/ImportService";
import { OpenAIService } from "../../infrastructure/services/OpenAIService";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { CategoryRepository } from "../../infrastructure/repositories/CategoryRepository";

const router: Router = Router();

// Dependency Injection
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const openAIService = new OpenAIService();
const categoryRepository = new CategoryRepository();
const importService = new ImportService(serviceRepository, pagoRepository, openAIService, categoryRepository);
const importController = new ImportController(importService);

router.post("/analyze", AuthenticationToken, (req, res) => importController.analyze(req as any, res));
router.post("/confirm", AuthenticationToken, (req, res) => importController.confirm(req as any, res));

export default router;
