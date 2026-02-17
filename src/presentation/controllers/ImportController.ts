import { Request, Response } from "express";
import { ImportService } from "../../application/services/ImportService";

interface AuthRequest extends Request {
    user?: { id: string };
}

export class ImportController {
    constructor(private importService: ImportService) { }

    /**
     * POST /api/import/analyze
     * Body: { csvContent: string } OR { rows: CsvRow[] }
     * Accepts raw CSV text (server-side parsing) or pre-mapped rows from frontend
     */
    async analyze(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { csvContent, rows: preMapppedRows } = req.body;

            let rows;

            if (preMapppedRows && Array.isArray(preMapppedRows) && preMapppedRows.length > 0) {
                // Frontend already mapped the columns — use rows directly
                rows = preMapppedRows.map((r: any) => ({
                    fecha: String(r.fecha || ''),
                    descripcion: String(r.descripcion || ''),
                    monto: parseFloat(r.monto) || 0,
                    referencia: r.referencia ? String(r.referencia) : undefined
                })).filter((r: any) => r.monto > 0);
            } else if (csvContent && typeof csvContent === 'string') {
                // Legacy: parse CSV server-side
                rows = this.importService.parseCsv(csvContent);
            } else {
                return res.status(400).json({ message: "Se requiere csvContent o rows[]" });
            }

            if (rows.length === 0) {
                return res.status(400).json({ message: "No se encontraron filas válidas" });
            }

            // IA analysis
            const { analysis, categories } = await this.importService.analyzeImport(userId, rows);

            // Summary stats
            const summary = {
                total: analysis.length,
                auto: analysis.filter(a => a.status === 'auto').length,
                iaReview: analysis.filter(a => a.status === 'ia_review').length,
                nuevo: analysis.filter(a => a.status === 'nuevo').length,
                anomalia: analysis.filter(a => a.status === 'anomalia').length,
                error: analysis.filter(a => a.status === 'error').length,
                duplicado: analysis.filter(a => a.status === 'duplicado').length,
            };

            return res.status(200).json({ analysis, summary, categories });
        } catch (error: any) {
            console.error('Import Analyze Error:', error);
            return res.status(500).json({ message: error.message || "Error al analizar el archivo" });
        }
    }

    /**
     * POST /api/import/confirm
     * Body: { confirmations: Array<{ rowIndex, serviceId, original }> }
     * Creates confirmed payments
     */
    async confirm(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { confirmations } = req.body;

            if (!confirmations || !Array.isArray(confirmations) || confirmations.length === 0) {
                return res.status(400).json({ message: "Se requiere al menos una confirmación" });
            }

            const result = await this.importService.confirmImport(userId, confirmations.map((c: any) => ({
                ...c,
                forceDuplicate: c.forceDuplicate || false
            })));

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Import Confirm Error:', error);
            return res.status(500).json({ message: error.message || "Error al confirmar la importación" });
        }
    }
}
