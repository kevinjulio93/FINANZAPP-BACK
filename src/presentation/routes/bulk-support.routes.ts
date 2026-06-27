import { Router } from "express";
import multer from "multer";
import { BulkSupportController } from "../controllers/BulkSupportController";
import { AuthenticationToken } from "../middleware/auth.middleware";
import { BulkSupportService } from "../../application/services/BulkSupportService";
import { StorageService } from "../../infrastructure/services/StorageService";
import { ServiceRepository } from "../../infrastructure/repositories/ServiceRepository";
import { PagoRepository } from "../../infrastructure/repositories/PagoRepository";
import { AIServiceFactory } from "../../infrastructure/services/AIServiceFactory";

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

const storageService = new StorageService();
const serviceRepository = new ServiceRepository();
const pagoRepository = new PagoRepository();
const aiService = AIServiceFactory.createService();
const bulkSupportService = new BulkSupportService(storageService, serviceRepository, pagoRepository, aiService);
const bulkSupportController = new BulkSupportController(bulkSupportService);

router.post("/upload", AuthenticationToken, upload.single("file"), (req, res) => bulkSupportController.uploadZip(req as any, res));
router.post("/confirm", AuthenticationToken, (req, res) => bulkSupportController.confirmSupports(req as any, res));

export default router;
