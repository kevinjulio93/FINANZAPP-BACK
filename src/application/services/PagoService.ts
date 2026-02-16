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

    async getPagosByUserId(userId: string) {
        return this.pagoRepository.findByUserId(userId);
    }

    async updatePago(id: string, data: Partial<ICreatePago>) {
        return this.pagoRepository.update(id, data);
    }

    async deletePago(id: string) {
        return this.pagoRepository.delete(id);
    }
}
