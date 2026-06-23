import { Request, Response } from "express";
import { ExportImportService } from "../../application/services/ExportImportService";

import { t } from "../../infrastructure/i18n/translate";
import { AuthRequest } from "../middleware/auth.middleware";

export class ExportImportController {
    constructor(private exportImportService: ExportImportService) { }

    async export(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const { entity } = req.params;
            const { month, year } = req.query;

            let csv = "";
            let filename = `export_${entity}.csv`;

            switch (entity) {
                case 'categories':
                    csv = await this.exportImportService.exportCategories(userId);
                    break;
                case 'services':
                    csv = await this.exportImportService.exportServices(userId);
                    break;
                case 'pagos':
                    csv = await this.exportImportService.exportPagos(userId, {
                        month: month ? parseInt(month as string) : undefined,
                        year: year ? parseInt(year as string) : undefined
                    });
                    filename = `export_pagos_${month || 'all'}_${year || 'all'}.csv`;
                    break;
                default:
                    {
                        const lang = req.user?.language || 'en';
                        res.status(400).json({ message: t(lang, "errors.invalidEntity") });
                        return;
                    }
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.status(200).send(csv);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Export Error:', error);
            res.status(500).json({ message: t(lang, error.message || "errors.exportError") });
        }
    }

    async import(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const { entity } = req.params;
            const file = req.file;

            if (!file) {
                const lang = req.user?.language || 'en';
                res.status(400).json({ message: t(lang, "errors.csvRequired") });
                return;
            }

            let result;
            switch (entity) {
                case 'categories':
                    result = await this.exportImportService.importCategories(userId, file.buffer);
                    break;
                case 'services':
                    result = await this.exportImportService.importServices(userId, file.buffer);
                    break;
                case 'pagos':
                    result = await this.exportImportService.importPagos(userId, file.buffer);
                    break;
                default:
                    {
                        const lang = req.user?.language || 'en';
                        res.status(400).json({ message: t(lang, "errors.invalidEntity") });
                        return;
                    }
            }

            res.status(200).json(result);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Import Error:', error);
            res.status(500).json({ message: t(lang, error.message || "errors.importError") });
        }
    }
}
