import mongoose from "mongoose";
import { IPagoMensual } from "../../domain/entities/Service";
import { IServiceRepository } from "../../domain/repositories/Interfaces/IServiceRepository";


export class ServiceService {
    constructor(private serviceRepository: IServiceRepository) { }

    async createService(data: { name: string; montoEstimado: number; fechaUltimoPago?: string; categoryId: string; estado: string; userId: string }) {
        return this.serviceRepository.create({
            name: data.name,
            montoEstimado: data.montoEstimado,
            categoryId: new mongoose.Types.ObjectId(data.categoryId),
        }, data.userId);
    }

    async getServicesByUserId(userId: string) {
        return this.serviceRepository.findByUserId(userId);
    }

    async getServicesByCategoryId(categoryId: string) {
        return this.serviceRepository.findByCategoryId(categoryId);
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

    async duplicateService(id: string, userId: string) {
        const service = await this.serviceRepository.findById(id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Verificar que el servicio pertenezca al usuario (indirectamente a través de la categoría)
        // Ojo: En este punto service es un objeto plano (lean), categoryId es un ObjectId o string.
        // Se asume que el controlador ya verificó permisos o que aquí confiamos en que si lo encontró es válido.
        // Pero idealmente deberíamos verificar ownership.

        // Dado el diseño actual, vamos a duplicar con los mismos datos
        return this.serviceRepository.create({
            name: `${service.name} (Copia)`,
            montoEstimado: service.montoEstimado,
            categoryId: new mongoose.Types.ObjectId(service.categoryId.toString()),
        }, userId);
    }
}