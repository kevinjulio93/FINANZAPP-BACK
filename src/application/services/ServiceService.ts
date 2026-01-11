import { IPagoMensual } from "../../domain/entities/Service";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";


export class ServiceService {
    constructor(private serviceRepository: IServiceRepository) {}

    async createService(data: { name: string; montoEstimado: number; fechaUltimoPago?: string; categoryId: string; estado: string; userId: string }) {
        return this.serviceRepository.create({
            name: data.name,
            montoEstimado: data.montoEstimado,
            categoryId: data.categoryId,
        }, data.userId);
    }

    async getServicesByUserId(userId: string) {
        return this.serviceRepository.findByUserId(userId);
    }

    async getServiceById(id: string) {
        return this.serviceRepository.findById(id);
    }

    async updateService(id: string, data: Partial<{ name: string; montoEstimado: number; fechaUltimoPago?: string; categoryId: string; estado: string }>) {
        return this.serviceRepository.update(id, data);
    }

    async deleteService(id: string) {
        const result = await this.serviceRepository.delete(id);
        return result;
    }

    async addPagoMensual(serviceId: string, pago: IPagoMensual) {
        return this.serviceRepository.addPagoMensual(serviceId, pago);
    }
}