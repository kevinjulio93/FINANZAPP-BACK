export enum TipoPago {
    MENSUAL = 'MENSUAL',
    QUINCENAL = 'QUINCENAL',
    SEMANAL = 'SEMANAL',
}

export enum EstadoCredito {
    ACTIVO = 'ACTIVO',
    PAGADO = 'PAGADO',
    EN_MORA = 'EN_MORA',
    CANCELADO = 'CANCELADO',
}

export interface ICredit {
    id: string;
    userId: string;
    nombre: string;
    valorInicial: number;
    saldoActual: number;
    tasaInteresAnual: number; // Porcentaje anual
    plazoMeses: number;
    cuotaMensual: number;
    subsidioPorcentaje: number; // Porcentaje de descuento en la cuota
    fechaInicio: Date;
    estado: EstadoCredito;
    tipoPago: TipoPago;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateCredit {
    nombre: string;
    valorInicial: number;
    tasaInteresAnual: number;
    plazoMeses: number;
    subsidioPorcentaje?: number;
    fechaInicio: Date;
    tipoPago?: TipoPago;
    userId: string;
}

export interface IAbonoCapital {
    id: string;
    creditId: string;
    monto: number;
    fecha: Date;
    saldoAnterior: number;
    saldoNuevo: number;
    cuotaAnterior: number;
    cuotaNueva: number;
    plazoAnterior: number;
    plazoNuevo: number;
    createdAt: Date;
}

export interface ICreateAbonoCapital {
    creditId: string;
    monto: number;
    fecha?: Date;
}

export interface ICuotaProyectada {
    numeroCuota: number;
    fechaPago: Date;
    cuotaTotal: number;
    cuotaSinSubsidio: number;
    subsidio: number;
    capital: number;
    interes: number;
    saldoRestante: number;
}

export interface IProyeccionCredito {
    creditoId: string;
    nombreCredito: string;
    resumen: {
        valorInicial: number;
        saldoActual: number;
        tasaInteresAnual: number;
        tasaInteresMensual: number;
        plazoMeses: number;
        cuotaMensual: number;
        subsidioPorcentaje: number;
        subsidioMensual: number;
        cuotaConSubsidio: number;
        totalAPagar: number;
        totalIntereses: number;
        totalSubsidios: number;
        ahorroTotalPorSubsidio: number;
        cuotasPagadas: number;
        cuotasPendientes: number;
        fechaInicio: Date;
        fechaEstimadaFin: Date;
    };
    cuotas: ICuotaProyectada[];
    abonos: IAbonoCapital[];
}

export interface ISimulacionAbono {
    creditoActual: {
        saldoActual: number;
        cuotaMensual: number;
        plazoRestante: number;
        totalAPagarSinAbono: number;
        totalInteresesSinAbono: number;
    };
    conAbono: {
        montoAbono: number;
        nuevoSaldo: number;
        nuevaCuotaMensual: number;
        nuevosPlazoMeses: number;
        totalAPagarConAbono: number;
        totalInteresesConAbono: number;
        fechaEstimadaFin: Date;
    };
    beneficios: {
        ahorroIntereses: number;
        ahorroTotal: number;
        mesesAhorrados: number;
        reduccionCuota: number;
        porcentajeAhorro: number;
    };
}
