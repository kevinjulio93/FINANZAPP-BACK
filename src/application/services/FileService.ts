import { IFileRepository, FileTree, CategoryNode, YearNode, ServiceNode, MonthNode, FileEntry } from "../../domain/repositories/Interfaces/IFileRepository";
import { StorageService } from "../../infrastructure/services/StorageService";
import { PagoMensualModel } from "../../infrastructure/models/PagoMensual.model";

export class FileService {
    private fileRepository: IFileRepository;
    private storageService: StorageService;

    constructor(fileRepository: IFileRepository, storageService: StorageService) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
    }

    async getFileTree(userId: string): Promise<FileTree> {
        const files = await this.fileRepository.getFilesByUserId(userId);
        return this.buildTree(files);
    }

    async deleteFile(userId: string, pagoId: string): Promise<void> {
        // Find the pago to get the supportUrl
        const pago = await PagoMensualModel.findById(pagoId);
        if (!pago || !pago.supportUrl) {
            throw new Error("File not found");
        }

        // Delete from R2
        await this.storageService.deleteFileByUrl(pago.supportUrl);

        // Clear supportUrl from pago
        await PagoMensualModel.findByIdAndUpdate(pagoId, {
            $unset: { supportUrl: "" },
        });
    }

    private buildTree(files: FileEntry[]): FileTree {
        const categoryMap = new Map<string, Map<number, Map<string, Map<number, FileEntry[]>>>>();

        for (const file of files) {
            // Category level
            if (!categoryMap.has(file.categoryName)) {
                categoryMap.set(file.categoryName, new Map());
            }
            const yearMap = categoryMap.get(file.categoryName)!;

            // Year level
            if (!yearMap.has(file.year)) {
                yearMap.set(file.year, new Map());
            }
            const serviceMap = yearMap.get(file.year)!;

            // Service level
            if (!serviceMap.has(file.serviceName)) {
                serviceMap.set(file.serviceName, new Map());
            }
            const monthMap = serviceMap.get(file.serviceName)!;

            // Month level
            if (!monthMap.has(file.month)) {
                monthMap.set(file.month, []);
            }
            monthMap.get(file.month)!.push(file);
        }

        // Convert maps to tree structure
        const categories: CategoryNode[] = [];

        for (const [categoryName, yearMap] of categoryMap) {
            const years: YearNode[] = [];

            for (const [year, serviceMap] of yearMap) {
                const services: ServiceNode[] = [];

                for (const [serviceName, monthMap] of serviceMap) {
                    const months: MonthNode[] = [];

                    for (const [month, files] of monthMap) {
                        months.push({ month, files });
                    }

                    // Sort months ascending
                    months.sort((a, b) => a.month - b.month);
                    services.push({ name: serviceName, months });
                }

                // Sort services alphabetically
                services.sort((a, b) => a.name.localeCompare(b.name));
                years.push({ year, services });
            }

            // Sort years descending
            years.sort((a, b) => b.year - a.year);
            categories.push({ name: categoryName, years });
        }

        // Sort categories alphabetically
        categories.sort((a, b) => a.name.localeCompare(b.name));

        return { categories };
    }
}
