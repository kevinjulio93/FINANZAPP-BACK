import mongoose from "mongoose";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { IPagoRepository, ICreatePago } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { ICategoryRepository } from "../../domain/repositories/Interfaces/ICategoryRepository";

interface CsvRow {
    fecha: string;
    descripcion: string;
    monto: number;
    referencia?: string;
}

interface ImportAnalysis {
    rowIndex: number;
    original: CsvRow;
    status: 'auto' | 'ia_review' | 'nuevo' | 'anomalia' | 'error' | 'duplicado';
    suggestedServiceId: string | null;
    suggestedServiceName: string | null;
    suggestedCategoryId: string | null;
    suggestedCategoryName: string | null;
    confidence: number;
    iaInsight: string;
    alternatives: Array<{ serviceId: string; serviceName: string; confidence: number }>;
    anomalyDetail?: string;
    duplicateDetail?: string;
}

export class ImportService {
    constructor(
        private serviceRepository: IServiceRepository,
        private pagoRepository: IPagoRepository,
        private openAIService: IOpenAIService,
        private categoryRepository: ICategoryRepository
    ) { }

    /**
     * Parse raw CSV text into structured rows
     */
    parseCsv(csvText: string): CsvRow[] {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) throw new Error('El archivo CSV debe tener al menos un encabezado y una fila de datos');

        const header = lines[0].toLowerCase().replace(/"/g, '').split(',').map(h => h.trim());

        // Detect column indices
        const fechaIdx = header.findIndex(h => ['fecha', 'date'].includes(h));
        const descIdx = header.findIndex(h => ['descripcion', 'description', 'desc', 'concepto'].includes(h));
        const montoIdx = header.findIndex(h => ['monto', 'amount', 'valor', 'total'].includes(h));
        const refIdx = header.findIndex(h => ['referencia', 'reference', 'ref'].includes(h));

        if (fechaIdx === -1 || descIdx === -1 || montoIdx === -1) {
            throw new Error('No se pudieron detectar las columnas: fecha, descripcion, monto. Verifica los encabezados del CSV.');
        }

        const rows: CsvRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing that handles quoted values
            const values = this.parseCsvLine(line);

            const monto = parseFloat(values[montoIdx]?.replace(/[^0-9.-]/g, '') || '0');

            if (isNaN(monto) || monto <= 0) continue;

            rows.push({
                fecha: values[fechaIdx]?.trim() || '',
                descripcion: values[descIdx]?.trim().replace(/"/g, '') || '',
                monto,
                referencia: refIdx !== -1 ? values[refIdx]?.trim() : undefined
            });
        }

        return rows;
    }

    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    /**
     * Analyze parsed CSV rows using IA + fuzzy matching
     */
    async analyzeImport(userId: string, rows: CsvRow[]): Promise<{ analysis: ImportAnalysis[]; categories: any[] }> {
        // 1. Get user's existing services and categories
        const services = await this.serviceRepository.findByUserId(userId);
        const categories = await this.categoryRepository.findByUserId(userId);

        const categoryMap = new Map<string, { id: string; name: string; color: string }>();
        for (const cat of categories) {
            const catId = ((cat as any)._id || (cat as any).id).toString();
            categoryMap.set(catId, { id: catId, name: (cat as any).name, color: (cat as any).color });
        }

        const serviceList = services.map((s: any) => {
            const svcCatId = (s.categoryId?._id || s.categoryId)?.toString();
            const cat = categoryMap.get(svcCatId);
            return {
                id: (s._id || s.id).toString(),
                name: s.name,
                montoEstimado: s.montoEstimado,
                categoryId: svcCatId || null,
                categoryName: cat?.name || null
            };
        });

        // Build categories response with their services for the frontend
        const categoriesWithServices = Array.from(categoryMap.values()).map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            services: serviceList.filter(s => s.categoryId === cat.id).map(s => ({
                id: s.id,
                name: s.name
            }))
        }));

        if (serviceList.length === 0) {
            // No services: all rows are "nuevo"
            return {
                categories: categoriesWithServices,
                analysis: rows.map((row, idx) => ({
                    rowIndex: idx,
                    original: row,
                    status: 'nuevo' as const,
                    suggestedServiceId: null,
                    suggestedServiceName: null,
                    suggestedCategoryId: null,
                    suggestedCategoryName: null,
                    confidence: 0,
                    iaInsight: 'Sin servicios registrados. Se creará uno nuevo.',
                    alternatives: []
                }))
            };
        }

        // 2. Get historical averages for anomaly detection
        const serviceAverages: Record<string, number> = {};
        for (const svc of serviceList) {
            try {
                const stats = await this.pagoRepository.getServiceAverages(userId, svc.id);
                if (stats && stats.length > 0) {
                    serviceAverages[svc.id] = stats[0].avgPago;
                }
            } catch {
                // ignore
            }
        }

        // 2.5. Pre-load existing payments for duplicate detection
        // Collect all months/years from the incoming rows
        const monthYearPairs = new Set<string>();
        for (const row of rows) {
            const d = this.parseDate(row.fecha);
            if (d) monthYearPairs.add(`${d.getMonth() + 1}-${d.getFullYear()}`);
        }
        const existingPayments: any[] = [];
        for (const pair of monthYearPairs) {
            const [mes, año] = pair.split('-').map(Number);
            try {
                const payments = await this.pagoRepository.findByMonth(userId, mes, año);
                existingPayments.push(...payments);
            } catch { /* ignore */ }
        }

        // 3. Build prompt for IA bulk analysis
        const serviceNamesJSON = JSON.stringify(serviceList.map(s => ({ id: s.id, name: s.name, promedio: serviceAverages[s.id] || s.montoEstimado })));

        const rowsJSON = JSON.stringify(rows.map((r, idx) => ({
            idx,
            descripcion: r.descripcion,
            monto: r.monto,
            fecha: r.fecha,
            referencia: r.referencia || null
        })));

        const iaPrompt = `Eres un asistente de importación financiera. Analiza estos pagos y asócialos con servicios existentes.

SERVICIOS DEL USUARIO:
${serviceNamesJSON}

TRANSACCIONES A ANALIZAR:
${rowsJSON}

Para CADA transacción, responde con un JSON array con:
- idx: índice de la transacción
- serviceId: ID del servicio más probable (o null si no hay match)
- serviceName: Nombre del servicio sugerido
- confidence: 0-100 porcentaje de confianza
- insight: texto breve explicando la sugerencia (ej: "Match exacto con Luz CHEC", "↑20% vs promedio", "Sin coincidencias")
- alternatives: array de hasta 2 alternativas [{serviceId, serviceName, confidence}]
- anomaly: si el monto difiere >20% del promedio del servicio, indica el detalle (o null)

RESPONDE SOLO CON EL JSON ARRAY, SIN MARKDOWN NI TEXTO ADICIONAL.`;

        let analysis: ImportAnalysis[];

        try {
            const iaResponse = await this.openAIService.generateResponse(userId, iaPrompt, {}, undefined);
            const iaContent = iaResponse.content || '';

            // Parse IA response
            let iaResults: any[];
            try {
                // Try to extract JSON from the response
                const jsonMatch = iaContent.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    iaResults = JSON.parse(jsonMatch[0]);
                } else {
                    iaResults = JSON.parse(iaContent);
                }
            } catch {
                console.error('[ImportService] Failed to parse IA response:', iaContent.substring(0, 300));
                // Fallback to fuzzy matching
                analysis = this.fuzzyMatchFallback(rows, serviceList, serviceAverages);
                return { categories: categoriesWithServices, analysis: this.checkDuplicates(analysis, existingPayments) };
            }

            // 4. Build analysis results
            analysis = rows.map((row, idx) => {
                const iaRow = iaResults.find((r: any) => r.idx === idx);
                if (!iaRow) {
                    return this.fuzzyMatchSingleRow(row, idx, serviceList, serviceAverages);
                }

                const confidence = iaRow.confidence || 0;
                let status: ImportAnalysis['status'];

                if (iaRow.anomaly) {
                    status = 'anomalia';
                } else if (!iaRow.serviceId) {
                    status = 'nuevo';
                } else if (confidence >= 80) {
                    status = 'auto';
                } else if (confidence >= 60) {
                    status = 'ia_review';
                } else {
                    status = 'nuevo';
                }

                // Validate date
                const parsedDate = this.parseDate(row.fecha);
                if (!parsedDate || parsedDate > new Date()) {
                    status = 'error';
                }

                return {
                    rowIndex: idx,
                    original: row,
                    status,
                    suggestedServiceId: iaRow.serviceId || null,
                    suggestedServiceName: iaRow.serviceName || null,
                    suggestedCategoryId: (() => {
                        const svc = serviceList.find(s => s.id === iaRow.serviceId);
                        return svc?.categoryId || null;
                    })(),
                    suggestedCategoryName: (() => {
                        const svc = serviceList.find(s => s.id === iaRow.serviceId);
                        return svc?.categoryName || null;
                    })(),
                    confidence,
                    iaInsight: iaRow.insight || '',
                    alternatives: (iaRow.alternatives || []).slice(0, 2),
                    anomalyDetail: iaRow.anomaly || undefined
                };
            });
        } catch (error) {
            console.error('[ImportService] IA analysis failed, using fuzzy fallback:', error);
            analysis = this.fuzzyMatchFallback(rows, serviceList, serviceAverages);
        }

        // 5. Check for duplicates against existing payments
        return { categories: categoriesWithServices, analysis: this.checkDuplicates(analysis, existingPayments) };
    }

    /**
     * Confirm and create payments from analyzed import
     */
    async confirmImport(userId: string, confirmations: Array<{
        rowIndex: number;
        serviceId: string;
        original: CsvRow;
        forceDuplicate?: boolean;
    }>): Promise<{ created: number; duplicatesSkipped: number; errors: string[] }> {
        let created = 0;
        let duplicatesSkipped = 0;
        const errors: string[] = [];

        for (const item of confirmations) {
            try {
                // Resolve or create service on-the-fly if needed
                let serviceId = item.serviceId;
                if (serviceId.startsWith('__NEW_SVC__')) {
                    serviceId = await this.resolveOrCreateService(userId, serviceId, item.original);
                }

                const parsedDate = this.parseDate(item.original.fecha);
                if (!parsedDate) {
                    errors.push(`Fila ${item.rowIndex + 1}: Fecha inválida "${item.original.fecha}"`);
                    continue;
                }

                const mes = parsedDate.getMonth() + 1;
                const año = parsedDate.getFullYear();

                // Check for exact duplicates: same service + same amount + same date
                const existing = await this.pagoRepository.findByMonth(userId, mes, año);
                const exactDuplicate = existing.find((p: any) => {
                    const pServiceId = (p.serviceId as any)?._id?.toString() || p.serviceId?.toString();
                    if (pServiceId !== item.serviceId) return false;
                    // Check same amount (within 1 unit tolerance for rounding)
                    if (Math.abs(p.valorPagado - item.original.monto) > 1) return false;
                    // Check same date
                    const pFecha = new Date(p.fechaPago);
                    return pFecha.toISOString().split('T')[0] === parsedDate.toISOString().split('T')[0];
                });

                if (exactDuplicate && !item.forceDuplicate) {
                    duplicatesSkipped++;
                    errors.push(`Fila ${item.rowIndex + 1}: Pago duplicado (mismo servicio, monto y fecha en ${mes}/${año}). Se omitió.`);
                    continue;
                }

                const pagoData: ICreatePago = {
                    serviceId: serviceId,
                    mes,
                    año,
                    valorPagado: item.original.monto,
                    fechaPago: parsedDate,
                    notas: `Importado: ${item.original.descripcion}`,
                    metodoPago: 'OTRO'
                };

                await this.pagoRepository.create(pagoData);
                created++;
            } catch (err: any) {
                errors.push(`Fila ${item.rowIndex + 1}: ${err.message}`);
            }
        }

        return { created, duplicatesSkipped, errors };
    }

    // --- Fuzzy matching fallback ---

    private fuzzyMatchFallback(rows: CsvRow[], services: any[], averages: Record<string, number>): ImportAnalysis[] {
        return rows.map((row, idx) => this.fuzzyMatchSingleRow(row, idx, services, averages));
    }

    private fuzzyMatchSingleRow(row: CsvRow, idx: number, services: any[], averages: Record<string, number>): ImportAnalysis {
        const desc = row.descripcion.toLowerCase();
        const matches = services
            .map(s => ({
                id: s.id,
                name: s.name,
                score: this.fuzzyScore(desc, s.name.toLowerCase())
            }))
            .filter(m => m.score > 30)
            .sort((a, b) => b.score - a.score);

        const best = matches[0];
        const alternatives = matches.slice(1, 3).map(m => ({
            serviceId: m.id,
            serviceName: m.name,
            confidence: m.score
        }));

        let status: ImportAnalysis['status'] = 'nuevo';
        let anomalyDetail: string | undefined;

        if (best && best.score >= 80) {
            status = 'auto';
            // Check for anomaly
            const avg = averages[best.id];
            if (avg && Math.abs((row.monto - avg) / avg) > 0.2) {
                status = 'anomalia';
                const pct = Math.round(((row.monto - avg) / avg) * 100);
                anomalyDetail = `Monto ${pct > 0 ? '+' : ''}${pct}% vs promedio ($${Math.round(avg).toLocaleString()})`;
            }
        } else if (best && best.score >= 60) {
            status = 'ia_review';
        }

        // Validate date
        const parsedDate = this.parseDate(row.fecha);
        if (!parsedDate || parsedDate > new Date()) {
            status = 'error';
        }

        return {
            rowIndex: idx,
            original: row,
            status,
            suggestedServiceId: best?.id || null,
            suggestedServiceName: best?.name || null,
            suggestedCategoryId: (() => {
                const svc = services.find((s: any) => s.id === best?.id);
                return svc?.categoryId || null;
            })(),
            suggestedCategoryName: (() => {
                const svc = services.find((s: any) => s.id === best?.id);
                return svc?.categoryName || null;
            })(),
            confidence: best?.score || 0,
            iaInsight: best ? `Fuzzy match: ${best.name} (${best.score}%)` : 'Sin coincidencias',
            alternatives,
            anomalyDetail
        };
    }

    /**
     * Check imported rows against existing payments for exact duplicates.
     * A duplicate = same serviceId + same monto + same date.
     * Rows that are duplicates get status 'duplicado' but can still be assigned to different services.
     */
    private checkDuplicates(analysis: ImportAnalysis[], existingPayments: any[]): ImportAnalysis[] {
        return analysis.map(row => {
            // Skip rows without a suggested service or already in error state
            if (!row.suggestedServiceId || row.status === 'error') return row;

            const parsedDate = this.parseDate(row.original.fecha);
            if (!parsedDate) return row;

            const dateStr = parsedDate.toISOString().split('T')[0];

            const duplicate = existingPayments.find((p: any) => {
                const pServiceId = (p.serviceId as any)?._id?.toString() || p.serviceId?.toString();
                if (pServiceId !== row.suggestedServiceId) return false;
                if (Math.abs(p.valorPagado - row.original.monto) > 1) return false;
                const pDate = new Date(p.fechaPago).toISOString().split('T')[0];
                return pDate === dateStr;
            });

            if (duplicate) {
                const serviceName = (duplicate.serviceId as any)?.name || row.suggestedServiceName || 'Servicio';
                return {
                    ...row,
                    status: 'duplicado' as const,
                    duplicateDetail: `Ya existe un pago de $${row.original.monto.toLocaleString()} para ${serviceName} en esta fecha.`,
                    iaInsight: `⚠️ Posible duplicado: ya hay un pago registrado para este servicio con el mismo monto y fecha. Puedes asignarlo a otro servicio si corresponde.`
                };
            }

            return row;
        });
    }

    private async resolveOrCreateService(userId: string, virtualId: string, row: CsvRow): Promise<string> {
        // Format: __NEW_SVC__:[categoryNameOrId]:[serviceName]
        const parts = virtualId.split(':');
        const catRef = parts[1];
        const svcName = parts[2];

        let categoryId = catRef;
        // If catRef is not an ID, create the category
        if (!mongoose.Types.ObjectId.isValid(catRef)) {
            const userCats = await this.categoryRepository.findByUserId(userId);
            let cat = userCats.find(c => c.name.toLowerCase() === catRef.toLowerCase());
            if (!cat) {
                cat = await this.categoryRepository.create({
                    name: catRef,
                    color: '#8B5CF6', // Default violet
                    userId: userId
                });
            }
            categoryId = (cat as any)._id?.toString() || cat.id.toString();
        }

        // Find or create service
        const userSvcs = await this.serviceRepository.findByUserId(userId);
        let svc = userSvcs.find(s => s.name.toLowerCase() === svcName.toLowerCase() && s.categoryId.toString() === categoryId);
        if (!svc) {
            svc = await this.serviceRepository.create({
                name: svcName,
                montoEstimado: row.monto,
                categoryId: new mongoose.Types.ObjectId(categoryId)
            }, userId);
        }

        return (svc as any)._id?.toString() || svc.id.toString();
    }

    private fuzzyScore(a: string, b: string): number {
        // Simple word-overlap score
        const wordsA = a.split(/\s+/).filter(w => w.length > 2);
        const wordsB = b.split(/\s+/).filter(w => w.length > 2);

        if (wordsA.length === 0 || wordsB.length === 0) return 0;

        let matches = 0;
        for (const wa of wordsA) {
            for (const wb of wordsB) {
                if (wa.includes(wb) || wb.includes(wa)) {
                    matches++;
                    break;
                }
            }
        }

        return Math.round((matches / Math.max(wordsA.length, wordsB.length)) * 100);
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d;
    }
}
