import mongoose from "mongoose";
import { IFileRepository, FileEntry } from "../../domain/repositories/Interfaces/IFileRepository";
import { PagoMensualModel } from "../models/PagoMensual.model";
import { ServiceModel } from "../models/Service.model";
import { CategoryModel } from "../models/Catergory.model";

export class FileRepository implements IFileRepository {
    async getFilesByUserId(userId: string): Promise<FileEntry[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get all user categories
        const userCategories = await CategoryModel.find({ userId: userObjectId }).lean();
        const categoryMap = new Map<string, string>();
        for (const cat of userCategories) {
            categoryMap.set(cat._id.toString(), cat.name);
        }

        // Get all services for user categories
        const categoryIds = userCategories.map(c => c._id);
        const userServices = await ServiceModel.find({
            categoryId: { $in: categoryIds }
        }).lean();
        const serviceMap = new Map<string, { name: string; categoryId: string }>();
        for (const svc of userServices) {
            serviceMap.set(svc._id.toString(), {
                name: svc.name,
                categoryId: svc.categoryId.toString(),
            });
        }

        // Get all pagos with supportUrl for user services
        const serviceIds = userServices.map(s => s._id);
        const pagos = await PagoMensualModel.find({
            serviceId: { $in: serviceIds },
            supportUrl: { $exists: true, $nin: [null, ""] },
        })
            .sort({ año: -1, mes: -1 })
            .lean();

        const entries: FileEntry[] = [];

        for (const pago of pagos) {
            const svc = serviceMap.get(pago.serviceId.toString());
            if (!svc) continue;

            const categoryName = categoryMap.get(svc.categoryId) || "unknown";

            // Extract original filename from URL or use a default
            const name = this.extractFileName(pago.supportUrl!, pago._id.toString());

            entries.push({
                pagoId: pago._id.toString(),
                name,
                url: pago.supportUrl!,
                amount: pago.valorPagado,
                date: pago.fechaPago?.toISOString() || new Date().toISOString(),
                categoryName: categoryName.replace(/[^a-zA-Z0-9_-]/g, '_'),
                year: pago.año,
                serviceName: svc.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
                month: pago.mes,
            });
        }

        return entries;
    }

    private extractFileName(url: string, fallbackId: string): string {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            // Last part is the filename
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart) return decodeURIComponent(lastPart);
        } catch {
            // Not a valid URL, try to extract from path
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart) return lastPart;
        }
        return `file-${fallbackId}`;
    }
}
