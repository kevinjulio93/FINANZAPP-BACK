import { Request, Response } from "express";
import { ComparisonService } from "../../application/services/ComparisonService";

import { t } from "../../infrastructure/i18n/translate";
import { AuthRequest } from "../middleware/auth.middleware";

export class ComparisonController {
    constructor(private comparisonService: ComparisonService) { }

    /**
     * POST /api/comparison
     * Body: { months: [{ mes: 1, año: 2026 }, { mes: 2, año: 2026 }] }
     */
    async compare(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { months } = req.body;

            if (!months || !Array.isArray(months) || months.length < 2) {
                const lang = req.user?.language || 'en';
                return res.status(400).json({ message: t(lang, "errors.comparisonMinMonths") });
            }

            const result = await this.comparisonService.compareMonths(userId, months);
            return res.status(200).json(result);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Comparison Error:', error);
            return res.status(500).json({ message: t(lang, error.message || "errors.comparisonError") });
        }
    }
}
