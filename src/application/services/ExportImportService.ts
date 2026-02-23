import { createObjectCsvStringifier } from 'csv-writer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { ICategoryRepository } from '../../domain/repositories/Interfaces/ICategoryRepository';
import { IServiceRepository } from '../../domain/repositories/Interfaces/IServiceRepository';
import { IPagoRepository } from '../../domain/repositories/Interfaces/IPagoRepository';

export class ExportImportService {
    constructor(
        private categoryRepository: ICategoryRepository,
        private serviceRepository: IServiceRepository,
        private pagoRepository: IPagoRepository
    ) { }

    // --- Export Methods ---

    async exportCategories(userId: string): Promise<string> {
        const categories = await this.categoryRepository.findByUserId(userId);
        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'id' },
                { id: 'name', title: 'nombre' },
                { id: 'color', title: 'colorHex' },
                { id: 'userId', title: 'userId' },
                { id: 'createdAt', title: 'createdAt' }
            ]
        });

        // Map categories to ensure string IDs
        const records = categories.map(cat => ({
            ...cat,
            id: cat.id?.toString(),
            userId: cat.userId?.toString()
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }

    async exportServices(userId: string): Promise<string> {
        const services = await this.serviceRepository.findByUserId(userId);
        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'id' },
                { id: 'name', title: 'nombre' },
                { id: 'categoryId', title: 'categoryId' },
                { id: 'montoEstimado', title: 'montoEstimado' },
                { id: 'estado', title: 'estado' },
                { id: 'fechaUltimoPago', title: 'fechaUltimoPago' }
            ]
        });

        const records = services.map(s => ({
            ...s,
            id: s.id?.toString(),
            categoryId: (s.categoryId as any)?._id?.toString() || s.categoryId?.toString(),
            fechaUltimoPago: s.fechaUltimoPago ? new Date(s.fechaUltimoPago).toISOString() : ''
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }

    async exportPagos(userId: string, filters: { month?: number, year?: number } = {}): Promise<string> {
        let pagos = [];
        if (filters.month && filters.year) {
            pagos = await this.pagoRepository.findByMonth(userId, filters.month, filters.year);
        } else {
            pagos = await this.pagoRepository.findByUserIdSortedByDate(userId);
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'id' },
                { id: 'serviceId', title: 'serviceId' },
                { id: 'mes', title: 'mes' },
                { id: 'año', title: 'año' },
                { id: 'valorPagado', title: 'valorPagado' },
                { id: 'fechaPago', title: 'fechaPago' },
                { id: 'metodoPago', title: 'metodoPago' },
                { id: 'notas', title: 'notas' }
            ]
        });

        const records = pagos.map((p: any) => ({
            id: (p._id || p.id)?.toString(),
            serviceId: (p.serviceId as any)?._id?.toString() || p.serviceId?.toString(),
            mes: p.mes,
            año: p.año,
            valorPagado: p.valorPagado,
            fechaPago: p.fechaPago ? new Date(p.fechaPago).toISOString().split('T')[0] : '',
            metodoPago: p.metodoPago,
            notas: p.notas
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }

    // --- Import Methods ---

    async importCategories(userId: string, csvBuffer: Buffer): Promise<{ created: number, updated: number, errors: string[] }> {
        const records: any[] = await this.parseCsvBuffer(csvBuffer);
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const record of records) {
            try {
                const name = record.nombre || record.name;
                const color = record.colorHex || record.color || '#8B5CF6';

                if (!name) {
                    errors.push('Nombre de categoría faltante');
                    continue;
                }

                const existing = await this.categoryRepository.findByUserId(userId);
                const found = existing.find(c => c.name.toLowerCase() === name.toLowerCase());

                if (found) {
                    await this.categoryRepository.update(found.id, { name, color });
                    updated++;
                } else {
                    await this.categoryRepository.create({ name, color, userId });
                    created++;
                }
            } catch (err: any) {
                errors.push(err.message);
            }
        }

        return { created, updated, errors };
    }

    async importServices(userId: string, csvBuffer: Buffer): Promise<{ created: number, updated: number, errors: string[] }> {
        const records: any[] = await this.parseCsvBuffer(csvBuffer);
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        // Pre-load categories
        const categories = await this.categoryRepository.findByUserId(userId);

        for (const record of records) {
            try {
                const name = record.nombre || record.name;
                const categoryRef = record.categoryId;
                const montoEstimado = parseFloat(record.montoEstimado || record.montoEstimadoInicial || '0');

                if (!name) {
                    errors.push('Nombre de servicio faltante');
                    continue;
                }

                // Resolve categoryId
                let categoryId: string | null = null;
                const categoryRefStr = String(categoryRef);

                if (mongoose.Types.ObjectId.isValid(categoryRefStr)) {
                    categoryId = categoryRefStr;
                } else {
                    const foundCat = categories.find(c => c.name.toLowerCase() === categoryRefStr.toLowerCase());
                    if (foundCat) categoryId = foundCat.id;
                }

                if (!categoryId) {
                    errors.push(`Categoría "${categoryRef}" no encontrada para el servicio "${name}"`);
                    continue;
                }

                const existing = await this.serviceRepository.findByUserId(userId);
                const found = existing.find(s => s.name.toLowerCase() === name.toLowerCase() && (s.categoryId as any)?.toString() === categoryId);

                if (found) {
                    await this.serviceRepository.update(found.id.toString(), { name, montoEstimado, categoryId: new mongoose.Types.ObjectId(categoryId) });
                    updated++;
                } else {
                    await this.serviceRepository.create({
                        name,
                        montoEstimado,
                        categoryId: new mongoose.Types.ObjectId(categoryId)
                    }, userId);
                    created++;
                }
            } catch (err: any) {
                errors.push(err.message);
            }
        }

        return { created, updated, errors };
    }

    async importPagos(userId: string, csvBuffer: Buffer): Promise<{ created: number, updated: number, errors: string[] }> {
        const records: any[] = await this.parseCsvBuffer(csvBuffer);
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        // Pre-load services
        const services = await this.serviceRepository.findByUserId(userId);

        for (const record of records) {
            try {
                const serviceRef = record.serviceId;
                const mes = parseInt(record.mes);
                const año = parseInt(record.año || record.ano);
                const valorPagado = parseFloat(record.valorPagado || record.monto);
                const fechaPagoStr = record.fechaPago || record.fecha;

                if (!serviceRef || isNaN(mes) || isNaN(año) || isNaN(valorPagado)) {
                    errors.push(`Datos incompletos en fila: ${JSON.stringify(record)}`);
                    continue;
                }

                // Resolve serviceId
                let serviceId: string | null = null;
                const serviceRefStr = String(serviceRef);

                if (mongoose.Types.ObjectId.isValid(serviceRefStr)) {
                    serviceId = serviceRefStr;
                } else {
                    const foundSvc = services.find(s => s.name.toLowerCase() === serviceRefStr.toLowerCase());
                    if (foundSvc) serviceId = foundSvc.id.toString();
                }

                if (!serviceId) {
                    errors.push(`Servicio "${serviceRef}" no encontrado`);
                    continue;
                }

                const fechaPago = new Date(fechaPagoStr);
                if (isNaN(fechaPago.getTime())) {
                    errors.push(`Fecha inválida: ${fechaPagoStr}`);
                    continue;
                }

                // Check for existing payment for same service/month/year
                const existingPagos = await this.pagoRepository.findByMonth(userId, mes, año);
                const found = existingPagos.find(p => (p.serviceId as any)?._id?.toString() === serviceId || p.serviceId?.toString() === serviceId);

                const pagoData = {
                    serviceId: serviceId,
                    mes,
                    año,
                    valorPagado,
                    fechaPago,
                    notas: record.notas || record.referencia,
                    metodoPago: record.metodoPago || 'OTRO'
                };

                if (found) {
                    await this.pagoRepository.update(found._id.toString(), pagoData);
                    updated++;
                } else {
                    await this.pagoRepository.create(pagoData);
                    created++;
                }
            } catch (err: any) {
                errors.push(err.message);
            }
        }

        return { created, updated, errors };
    }

    private parseCsvBuffer(buffer: Buffer): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(buffer.toString());
            stream
                .pipe(csvParser())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    }
}
