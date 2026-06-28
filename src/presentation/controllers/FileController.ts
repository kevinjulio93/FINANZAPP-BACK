import { Response } from "express";
import { FileService } from "../../application/services/FileService";
import { AuthRequest } from "../middleware/auth.middleware";
import { t } from "../../infrastructure/i18n/translate";

export class FileController {
    private fileService: FileService;

    constructor(fileService: FileService) {
        this.fileService = fileService;
    }

    async getFileTree(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const tree = await this.fileService.getFileTree(userId);
            return res.status(200).json(tree);
        } catch (error: any) {
            const lang = req.user?.language || "en";
            console.error("File Tree Error:", error);
            return res.status(500).json({ message: t(lang, "errors.internalError") });
        }
    }

    async deleteFile(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const lang = req.user?.language || "en";
            const { pagoId } = req.params;

            if (!pagoId) {
                return res.status(400).json({ message: t(lang, "errors.invalidId") });
            }

            await this.fileService.deleteFile(userId, pagoId);
            return res.status(200).json({ message: t(lang, "files.fileDeleted") });
        } catch (error: any) {
            const lang = req.user?.language || "en";
            console.error("File Delete Error:", error);
            return res.status(500).json({ message: t(lang, error.message || "errors.internalError") });
        }
    }
}
