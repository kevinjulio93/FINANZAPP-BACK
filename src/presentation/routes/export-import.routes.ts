import { Router } from "express";
import multer from "multer";
import { ExportImportController } from "../controllers/ExportImportController";
import { ExportImportService } from "../../application/services/ExportImportService";
import { CategoryRepository } from "../../infrastructure/repositories/CategoryRepository";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { AuthenticationToken } from "../middleware/auth.middleware";

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Dependency Injection
const categoryRepository = new CategoryRepository();
const serviceRepository = new ServiceRepository();
const pagoRepository = new PagoRepository();
const exportImportService = new ExportImportService(categoryRepository, serviceRepository, pagoRepository);
const exportImportController = new ExportImportController(exportImportService);

// Routes
router.get("/export/:entity", AuthenticationToken, (req, res) => exportImportController.export(req as any, res));
router.post("/import/:entity", AuthenticationToken, upload.single("file"), (req, res) => exportImportController.import(req as any, res));

export default router;
