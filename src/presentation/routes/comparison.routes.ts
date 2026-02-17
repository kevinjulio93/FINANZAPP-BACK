import { Router } from "express";
import { ComparisonController } from "../controllers/ComparisonController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { ComparisonService } from "../../application/services/ComparisonService";
import { OpenAIService } from "../../infrastructure/services/OpenAIService";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";

const router: Router = Router();

// Dependency Injection
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const openAIService = new OpenAIService();
const comparisonService = new ComparisonService(pagoRepository, serviceRepository, openAIService);
const comparisonController = new ComparisonController(comparisonService);

router.post("/", AuthenticationToken, (req, res) => comparisonController.compare(req as any, res));

export default router;
