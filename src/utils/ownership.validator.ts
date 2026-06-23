
import { ServiceService } from "../application/services/ServiceService";
import { CategoryService } from "../application/services/CategoryService";
import { PagoService } from "../application/services/PagoService";
import { CreditService } from "../application/services/CreditService";

export class OwnershipValidator {
    static async validateServiceAndCategory(
        serviceService: ServiceService,
        categoryService: CategoryService,
        serviceId: string,
        userId: string
    ) {
        const service = await serviceService.getServiceById(serviceId);
        if (!service) {
            throw new Error("errors.serviceNotFound");
        }

        const category = await categoryService.getCategoryById(service.categoryId.toString());
        if (!category || category.userId.toString() !== userId) {
            throw new Error("errors.serviceNotFound");
        }

        return { service, category };
    }

    static async validatePagoOwnership(
        pagoService: PagoService,
        serviceService: ServiceService,
        categoryService: CategoryService,
        pagoId: string,
        userId: string
    ) {
        const pago = await pagoService.getPagoById(pagoId);
        if (!pago) {
            throw new Error("errors.paymentNotFound");
        }

        const { service, category } = await this.validateServiceAndCategory(
            serviceService,
            categoryService,
            pago.serviceId.toString(),
            userId
        ).catch(() => {
            // If service/category check fails, we still say "Pago no encontrado" for security/consistency
            throw new Error("errors.paymentNotFound");
        });

        return { pago, service, category };
    }

    static async validateCategoryOwnership(
        categoryService: CategoryService,
        categoryId: string,
        userId: string
    ) {
        const category = await categoryService.getCategoryById(categoryId);
        if (!category || category.userId.toString() !== userId) {
            throw new Error("errors.categoryNotFound");
        }
        return category;
    }

    static async validateCreditOwnership(
        creditService: CreditService,
        creditId: string,
        userId: string
    ) {
        const credit = await creditService.getCreditById(creditId);

        if (!credit) {
            throw new Error("errors.creditNotFound");
        }

        if (credit.userId.toString() !== userId) {
            throw new Error("errors.unauthorized");
        }

        return credit;
    }
}
