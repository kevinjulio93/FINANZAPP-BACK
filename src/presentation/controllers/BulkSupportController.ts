import { Request, Response } from "express";
import { BulkSupportService } from "../../application/services/BulkSupportService";
import { AuthRequest } from "../middleware/auth.middleware";
import { t } from "../../infrastructure/i18n/translate";

export class BulkSupportController {
    private bulkSupportService: BulkSupportService;

    constructor(bulkSupportService: BulkSupportService) {
        this.bulkSupportService = bulkSupportService;
    }

    async uploadZip(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const lang = req.user?.language || 'en';

            if (!req.file) {
                return res.status(400).json({ message: t(lang, "errors.fileRequired") });
            }

            if (!req.file.originalname.endsWith('.zip')) {
                return res.status(400).json({ message: t(lang, "errors.invalidFileType") });
            }

            const result = await this.bulkSupportService.analyzeZip(userId, req.file.buffer);
            return res.status(200).json(result);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Bulk Support Upload Error:', error);
            return res.status(500).json({ message: t(lang, error.message || "errors.internalError") });
        }
    }

    async confirmSupports(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const lang = req.user?.language || 'en';
            const { supports } = req.body;

            if (!supports || !Array.isArray(supports)) {
                return res.status(400).json({ message: t(lang, "errors.invalidSupports") });
            }

            await this.bulkSupportService.confirmSupports(userId, supports);
            return res.status(200).json({ message: t(lang, "supportsConfirmed") });
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Bulk Support Confirm Error:', error);
            return res.status(500).json({ message: t(lang, error.message || "errors.internalError") });
        }
    }
}
