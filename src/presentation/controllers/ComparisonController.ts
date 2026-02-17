import { Request, Response } from "express";
import { ComparisonService } from "../../application/services/ComparisonService";

interface AuthRequest extends Request {
    user?: { id: string };
}

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
                return res.status(400).json({ message: "Se requieren al menos 2 meses para comparar" });
            }

            const result = await this.comparisonService.compareMonths(userId, months);
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Comparison Error:', error);
            return res.status(500).json({ message: error.message || "Error al generar la comparación" });
        }
    }
}
