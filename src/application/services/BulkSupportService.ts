import { ZipService, ExtractedFile } from "../../infrastructure/services/ZipService";
import { StorageService } from "../../infrastructure/services/StorageService";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";
import { IPagoRepository } from "../../domain/repositories/Interfaces/IPagoRepository";
import { IOpenAIService } from "../../domain/services/Interfaces/IAnalysisService";
import { ServiceModel } from "../../infrastructure/models/Service.model";
import { CategoryModel } from "../../infrastructure/models/Catergory.model";

export interface AnalyzedSupport {
    id: string;
    originalName: string;
    receiptUrl: string;
    suggestedServiceId?: string;
    suggestedServiceName?: string;
    suggestedMonth?: number;
    suggestedYear?: number;
    suggestedAmount?: number;
    confidence: 'auto' | 'ia_review' | 'unrecognized';
    status: 'pending' | 'confirmed' | 'rejected';
}

export interface BulkUploadResult {
    supports: AnalyzedSupport[];
    total: number;
    auto: number;
    review: number;
    unrecognized: number;
}

export class BulkSupportService {
    private zipService: ZipService;
    private storageService: StorageService;
    private serviceRepository: IServiceRepository;
    private pagoRepository: IPagoRepository;
    private aiService: IOpenAIService;

    constructor(
        storageService: StorageService,
        serviceRepository: IServiceRepository,
        pagoRepository: IPagoRepository,
        aiService: IOpenAIService
    ) {
        this.zipService = new ZipService();
        this.storageService = storageService;
        this.serviceRepository = serviceRepository;
        this.pagoRepository = pagoRepository;
        this.aiService = aiService;
    }

    async analyzeZip(userId: string, zipBuffer: Buffer): Promise<BulkUploadResult> {
        const files = this.zipService.extract(zipBuffer);
        const userServices = await this.serviceRepository.findByUserId(userId);
        const supports: AnalyzedSupport[] = [];

        for (const file of files) {
            // Upload to GCS
            const mimeType = this.getMimeType(file.extension);
            const receiptUrl = await this.storageService.uploadBuffer(file.buffer, file.originalName, mimeType, `soportes/${userId}`);

            // Analyze with AI
            const analysis = await this.analyzeFileName(file.originalName, userServices);

            supports.push({
                id: `support_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                originalName: file.originalName,
                receiptUrl,
                ...analysis,
                status: 'pending',
            });
        }

        return {
            supports,
            total: supports.length,
            auto: supports.filter(s => s.confidence === 'auto').length,
            review: supports.filter(s => s.confidence === 'ia_review').length,
            unrecognized: supports.filter(s => s.confidence === 'unrecognized').length,
        };
    }

    async confirmSupports(userId: string, supports: AnalyzedSupport[]): Promise<void> {
        const confirmed = supports.filter(s => s.status === 'confirmed');
        const rejected = supports.filter(s => s.status === 'rejected');

        // Delete rejected support files from R2
        for (const support of rejected) {
            if (support.receiptUrl) {
                await this.storageService.deleteFileByUrl(support.receiptUrl);
            }
        }

        for (const support of confirmed) {
            if (!support.suggestedServiceId || !support.suggestedMonth || !support.suggestedYear) continue;

            // Move file to structured path: {categoryName}/{year}/{serviceName}/{originalName}
            let supportUrl: string | undefined;
            if (support.receiptUrl) {
                try {
                    const service = await ServiceModel.findById(support.suggestedServiceId).lean();
                    if (service) {
                        const category = await CategoryModel.findById(service.categoryId).lean();
                        const categoryName = category ? category.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'unknown';
                        const serviceName = service.name.replace(/[^a-zA-Z0-9_-]/g, '_');
                        const destKey = `${categoryName}/${support.suggestedYear}/${serviceName}/${support.suggestedMonth}/${support.originalName}`;
                        supportUrl = await this.storageService.moveFile(support.receiptUrl, destKey);
                    }
                } catch (error) {
                    console.error('Failed to move support file to structured path:', error);
                    supportUrl = support.receiptUrl;
                }
            }

            await this.pagoRepository.create({
                serviceId: support.suggestedServiceId,
                mes: support.suggestedMonth,
                año: support.suggestedYear,
                valorPagado: support.suggestedAmount || 0,
                fechaPago: new Date(support.suggestedYear, (support.suggestedMonth || 1) - 1, 1),
                notas: `Soporte: ${support.originalName}`,
                supportUrl,
            });
        }
    }

    private async analyzeFileName(fileName: string, userServices: any[]): Promise<{
        suggestedServiceId?: string;
        suggestedServiceName?: string;
        suggestedMonth?: number;
        suggestedYear?: number;
        suggestedAmount?: number;
        confidence: 'auto' | 'ia_review' | 'unrecognized';
    }> {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
        const now = new Date();

        // Try to extract month from filename
        const monthMatch = nameWithoutExt.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i);
        const monthMap: Record<string, number> = {
            enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
            julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
            ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
            jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
        };
        const suggestedMonth = monthMatch ? monthMap[monthMatch[1].toLowerCase()] : undefined;

        // Try to extract year from filename
        const yearMatch = nameWithoutExt.match(/(20\d{2})/);
        const suggestedYear = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear();

        // Try to extract amount from filename
        const amountMatch = nameWithoutExt.match(/(\d+[.,]?\d*)/g);
        const suggestedAmount = amountMatch
            ? Math.max(...amountMatch.map((a: string) => parseFloat(a.replace(',', '.'))))
            : undefined;

        // Try to match by service name in filename (simple match)
        const matchedService = userServices.find((s: any) =>
            nameWithoutExt.includes(s.name.toLowerCase())
        );

        if (matchedService && suggestedMonth) {
            return {
                suggestedServiceId: matchedService.id || matchedService._id?.toString(),
                suggestedServiceName: matchedService.name,
                suggestedMonth,
                suggestedYear,
                suggestedAmount: suggestedAmount || matchedService.montoEstimado,
                confidence: 'auto',
            };
        }

        if (matchedService) {
            return {
                suggestedServiceId: matchedService.id || matchedService._id?.toString(),
                suggestedServiceName: matchedService.name,
                suggestedMonth: suggestedMonth || now.getMonth() + 1,
                suggestedYear,
                suggestedAmount: suggestedAmount || matchedService.montoEstimado,
                confidence: 'ia_review',
            };
        }

        // If no match found, use AI to analyze the filename against user's services
        if (userServices.length > 0) {
            try {
                const serviceNames = userServices.map((s: any) => s.name).join(', ');
                const aiPrompt = `Dado el nombre de un archivo de soporte de pago: "${fileName}"
Y los siguientes servicios del usuario: ${serviceNames}
Mes actual: ${now.getMonth() + 1}, Año actual: ${now.getFullYear()}

Responde SOLO con un JSON sin formato adicional:
{
  "serviceName": "nombre del servicio que más se asemeja o null si no hay coincidencia",
  "month": numero del mes (1-12) o null,
  "year": año o null,
  "amount": monto sugerido o null
}`;

                const aiResponse = await this.aiService.generateResponse('system', aiPrompt);
                if (aiResponse?.content) {
                    const parsed = JSON.parse(aiResponse.content);
                    const aiService = userServices.find((s: any) =>
                        s.name.toLowerCase() === parsed.serviceName?.toLowerCase()
                    );

                    if (aiService) {
                        return {
                            suggestedServiceId: aiService.id || aiService._id?.toString(),
                            suggestedServiceName: aiService.name,
                            suggestedMonth: parsed.month || suggestedMonth || now.getMonth() + 1,
                            suggestedYear: parsed.year || suggestedYear,
                            suggestedAmount: parsed.amount || suggestedAmount || aiService.montoEstimado,
                            confidence: 'ia_review',
                        };
                    }
                }
            } catch {
                // AI analysis failed, fall through to unrecognized
            }
        }

        return {
            suggestedMonth: suggestedMonth || now.getMonth() + 1,
            suggestedYear,
            suggestedAmount,
            confidence: 'unrecognized',
        };
    }

    private getMimeType(ext: string): string {
        const mimeMap: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.pdf': 'application/pdf',
            '.webp': 'image/webp',
        };
        return mimeMap[ext] || 'application/octet-stream';
    }
}
