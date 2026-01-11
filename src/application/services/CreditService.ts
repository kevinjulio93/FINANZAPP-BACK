import { ICreditRepository } from '../../domain/repositories/Interfaces/ICreditRepository';
import {
    ICredit,
    ICreateCredit,
    IProyeccionCredito,
    ICuotaProyectada,
    ISimulacionAbono,
    ICreateAbonoCapital,
    IAbonoCapital,
    TipoPago,
    EstadoCredito,
} from '../../domain/entities/Credit';

export class CreditService {
    constructor(private creditRepository: ICreditRepository) {}

    /**
     * Calcula la cuota mensual usando la fórmula de amortización francesa
     * Cuota = P * [i(1+i)^n] / [(1+i)^n - 1]
     * P = Principal (saldo)
     * i = tasa de interés mensual
     * n = número de meses
     */
    private calcularCuotaMensual(
        saldo: number,
        tasaInteresAnual: number,
        plazoMeses: number
    ): number {
        if (tasaInteresAnual === 0) {
            return saldo / plazoMeses;
        }

        const tasaMensual = tasaInteresAnual / 100 / 12;
        const cuota =
            (saldo * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses))) /
            (Math.pow(1 + tasaMensual, plazoMeses) - 1);
        
        return Math.round(cuota * 100) / 100;
    }

    async createCredit(data: ICreateCredit): Promise<ICredit> {
        const cuotaMensual = this.calcularCuotaMensual(
            data.valorInicial,
            data.tasaInteresAnual,
            data.plazoMeses
        );

        const creditData: ICreateCredit = {
            ...data,
            subsidioPorcentaje: data.subsidioPorcentaje || 0,
            tipoPago: data.tipoPago || TipoPago.MENSUAL,
        };

        const credit = await this.creditRepository.create({
            ...creditData,
            cuotaMensual,
        } as any);

        return credit;
    }

    async getCreditById(id: string): Promise<ICredit | null> {
        return this.creditRepository.findById(id);
    }

    async getCreditsByUserId(userId: string): Promise<ICredit[]> {
        return this.creditRepository.findByUserId(userId);
    }

    async updateCredit(id: string, data: Partial<ICredit>): Promise<ICredit | null> {
        return this.creditRepository.update(id, data);
    }

    async deleteCredit(id: string): Promise<boolean> {
        return this.creditRepository.delete(id);
    }

    /**
     * Genera la proyección completa del crédito
     */
    async getProyeccion(creditId: string): Promise<IProyeccionCredito | null> {
        const credit = await this.creditRepository.findById(creditId);
        if (!credit) return null;

        const abonos = await this.creditRepository.getAbonosByCredit(creditId);
        const tasaMensual = credit.tasaInteresAnual / 100 / 12;
        const cuotas: ICuotaProyectada[] = [];
        
        let saldoRestante = credit.saldoActual;
        let fechaActual = new Date(credit.fechaInicio);
        let totalIntereses = 0;
        let totalSubsidios = 0;

        // Calcular cuotas proyectadas
        for (let i = 1; i <= credit.plazoMeses && saldoRestante > 0.01; i++) {
            const interes = saldoRestante * tasaMensual;
            const capital = credit.cuotaMensual - interes;
            const subsidio = (credit.cuotaMensual * credit.subsidioPorcentaje) / 100;
            const cuotaConSubsidio = credit.cuotaMensual - subsidio;

            saldoRestante = Math.max(0, saldoRestante - capital);
            totalIntereses += interes;
            totalSubsidios += subsidio;

            cuotas.push({
                numeroCuota: i,
                fechaPago: new Date(fechaActual),
                cuotaTotal: credit.cuotaMensual,
                cuotaSinSubsidio: credit.cuotaMensual,
                subsidio,
                capital,
                interes,
                saldoRestante,
            });

            // Siguiente mes
            fechaActual = new Date(fechaActual.setMonth(fechaActual.getMonth() + 1));
        }

        const totalAPagar = cuotas.reduce((sum, c) => sum + c.cuotaTotal, 0);
        const fechaEstimadaFin = cuotas.length > 0 ? cuotas[cuotas.length - 1].fechaPago : new Date();

        return {
            creditoId: credit.id,
            nombreCredito: credit.nombre,
            resumen: {
                valorInicial: credit.valorInicial,
                saldoActual: credit.saldoActual,
                tasaInteresAnual: credit.tasaInteresAnual,
                tasaInteresMensual: tasaMensual * 100,
                plazoMeses: credit.plazoMeses,
                cuotaMensual: credit.cuotaMensual,
                subsidioPorcentaje: credit.subsidioPorcentaje,
                subsidioMensual: (credit.cuotaMensual * credit.subsidioPorcentaje) / 100,
                cuotaConSubsidio: credit.cuotaMensual - (credit.cuotaMensual * credit.subsidioPorcentaje) / 100,
                totalAPagar,
                totalIntereses,
                totalSubsidios,
                ahorroTotalPorSubsidio: totalSubsidios,
                cuotasPagadas: 0,
                cuotasPendientes: cuotas.length,
                fechaInicio: credit.fechaInicio,
                fechaEstimadaFin,
            },
            cuotas,
            abonos,
        };
    }

    /**
     * Simula el efecto de un abono a capital
     */
    async simularAbono(creditId: string, montoAbono: number): Promise<ISimulacionAbono | null> {
        const credit = await this.creditRepository.findById(creditId);
        if (!credit) return null;

        const tasaMensual = credit.tasaInteresAnual / 100 / 12;
        
        // Situación actual
        const totalAPagarSinAbono = credit.cuotaMensual * credit.plazoMeses;
        const totalInteresesSinAbono = totalAPagarSinAbono - credit.saldoActual;

        // Con el abono
        const nuevoSaldo = Math.max(0, credit.saldoActual - montoAbono);
        const nuevaCuotaMensual = this.calcularCuotaMensual(
            nuevoSaldo,
            credit.tasaInteresAnual,
            credit.plazoMeses
        );
        
        const totalAPagarConAbono = nuevaCuotaMensual * credit.plazoMeses;
        const totalInteresesConAbono = totalAPagarConAbono - nuevoSaldo;

        const fechaEstimadaFin = new Date(credit.fechaInicio);
        fechaEstimadaFin.setMonth(fechaEstimadaFin.getMonth() + credit.plazoMeses);

        return {
            creditoActual: {
                saldoActual: credit.saldoActual,
                cuotaMensual: credit.cuotaMensual,
                plazoRestante: credit.plazoMeses,
                totalAPagarSinAbono,
                totalInteresesSinAbono,
            },
            conAbono: {
                montoAbono,
                nuevoSaldo,
                nuevaCuotaMensual,
                nuevosPlazoMeses: credit.plazoMeses,
                totalAPagarConAbono,
                totalInteresesConAbono,
                fechaEstimadaFin,
            },
            beneficios: {
                ahorroIntereses: totalInteresesSinAbono - totalInteresesConAbono,
                ahorroTotal: totalAPagarSinAbono - totalAPagarConAbono - montoAbono,
                mesesAhorrados: 0, // Se mantiene el plazo en esta simulación
                reduccionCuota: credit.cuotaMensual - nuevaCuotaMensual,
                porcentajeAhorro: ((totalInteresesSinAbono - totalInteresesConAbono) / totalInteresesSinAbono) * 100,
            },
        };
    }

    /**
     * Registra un abono a capital y actualiza el crédito
     */
    async registrarAbono(data: ICreateAbonoCapital): Promise<IAbonoCapital> {
        const credit = await this.creditRepository.findById(data.creditId);
        if (!credit) {
            throw new Error('Crédito no encontrado');
        }

        if (data.monto <= 0) {
            throw new Error('El monto del abono debe ser mayor a 0');
        }

        if (data.monto > credit.saldoActual) {
            throw new Error('El monto del abono no puede ser mayor al saldo actual');
        }

        const saldoAnterior = credit.saldoActual;
        const cuotaAnterior = credit.cuotaMensual;
        const plazoAnterior = credit.plazoMeses;

        const nuevoSaldo = credit.saldoActual - data.monto;
        const nuevaCuota = this.calcularCuotaMensual(
            nuevoSaldo,
            credit.tasaInteresAnual,
            credit.plazoMeses
        );

        // Crear el registro del abono
        const abono = await this.creditRepository.createAbono({
            creditId: data.creditId,
            monto: data.monto,
            fecha: data.fecha || new Date(),
            saldoAnterior,
            saldoNuevo: nuevoSaldo,
            cuotaAnterior,
            cuotaNueva: nuevaCuota,
            plazoAnterior,
            plazoNuevo: credit.plazoMeses,
        } as any);

        // Actualizar el crédito
        await this.creditRepository.update(data.creditId, {
            saldoActual: nuevoSaldo,
            cuotaMensual: nuevaCuota,
            estado: nuevoSaldo <= 0 ? EstadoCredito.PAGADO : credit.estado,
        });

        return abono;
    }

    async getAbonosByCredit(creditId: string): Promise<IAbonoCapital[]> {
        return this.creditRepository.getAbonosByCredit(creditId);
    }

    async deleteAbono(abonoId: string, creditId: string): Promise<boolean> {
        // Aquí podrías implementar lógica para revertir el abono
        // y recalcular el saldo del crédito
        return this.creditRepository.deleteAbono(abonoId);
    }
}
