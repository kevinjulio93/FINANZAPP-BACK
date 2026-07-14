import { Router } from "express";
import { FileController } from "../controllers/FileController";
import { FileService } from "../../application/services/FileService";
import { FileRepository } from "../../infrastructure/repositories/FileRepository";
import { StorageService } from "../../infrastructure/services/StorageService";
import { AuthenticationToken } from "../middleware/auth.middleware";

const router: Router = Router();

// Initialize dependencies
const storageService = new StorageService();
const fileRepository = new FileRepository(storageService);
const fileService = new FileService(fileRepository, storageService);
const fileController = new FileController(fileService);

// Apply authentication middleware
router.use(AuthenticationToken);

// Routes
router.get("/tree", (req, res) => fileController.getFileTree(req as any, res));
router.delete("/:pagoId", (req, res) => fileController.deleteFile(req as any, res));

export default router;
