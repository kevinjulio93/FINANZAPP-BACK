import { IPagoRepository, ICreatePago } from "../../domain/repositories/Interfaces/IPagoRepository";

export class PagoService {
    constructor(private pagoRepository: IPagoRepository) { }

    async createPago(data: ICreatePago) {
        return this.pagoRepository.create(data);
    }

    async getPagoById(id: string) {
        return this.pagoRepository.findById(id);
    }

    async getAllPagos() {
        return this.pagoRepository.findAll();
    }

    async getPagosByServiceId(serviceId: string) {
        return this.pagoRepository.findByServiceId(serviceId);
    }

    async getPagosByUserId(userId: string, search?: string) {
        return this.pagoRepository.findByUserId(userId, search);
    }

    async updatePago(id: string, data: Partial<ICreatePago>) {
        return this.pagoRepository.update(id, data);
    }

    async deletePago(id: string) {
        return this.pagoRepository.delete(id);
    }

    // Métodos para reportes
    async getPagosSortedByDate(userId: string) {
        return this.pagoRepository.findByUserIdSortedByDate(userId);
    }

    async getPagosByMonth(userId: string, mes: number, año: number) {
        return this.pagoRepository.findByMonth(userId, mes, año);
    }

    async getPagosByYear(userId: string, año: number) {
        return this.pagoRepository.findByYear(userId, año);
    }

    async getPagosByCategoryGroupedByMonth(userId: string, categoryId: string, año: number) {
        return this.pagoRepository.findByCategoryGroupedByMonth(userId, categoryId, año);
    }

    async getPagosByCategorySortedByDate(userId: string, categoryId: string) {
        return this.pagoRepository.findByCategorySortedByDate(userId, categoryId);
    }

    async getMonthlyStats(userId: string, mes: number, año: number) {
        return this.pagoRepository.getMonthlyStats(userId, mes, año);
    }

    async getServiceAverages(userId: string, serviceId: string) {
        return this.pagoRepository.getServiceAverages(userId, serviceId);
    }

    async getPaymentReport(userId: string, mes: number | undefined, año: number) {
        return this.pagoRepository.getPaymentReport(userId, mes, año);
    }
}

