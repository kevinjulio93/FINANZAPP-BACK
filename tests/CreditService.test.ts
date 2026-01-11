import { CreditService } from '../src/application/services/CreditService';
import { CreditRepository } from '../src/infrastructure/repositories/CreditRepository';
import { TipoPago } from '../src/domain/entities/Credit';

describe('CreditService', () => {
    let creditService: CreditService;
    let mockCreditRepository: jest.Mocked<CreditRepository>;

    beforeEach(() => {
        mockCreditRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createAbono: jest.fn(),
            getAbonosByCredit: jest.fn(),
            deleteAbono: jest.fn(),
        } as any;

        creditService = new CreditService(mockCreditRepository);
    });

    describe('createCredit', () => {
        it('should create a credit with calculated monthly payment', async () => {
            const creditData = {
                nombre: 'Crédito de prueba',
                valorInicial: 10000000,
                tasaInteresAnual: 12,
                plazoMeses: 60,
                subsidioPorcentaje: 30,
                fechaInicio: new Date('2026-01-01'),
                userId: '507f1f77bcf86cd799439011',
            };

            const mockCredit = {
                id: 'credit123',
                ...creditData,
                saldoActual: 10000000,
                cuotaMensual: 222444.89,
                estado: 'ACTIVO',
                tipoPago: TipoPago.MENSUAL,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCreditRepository.create.mockResolvedValue(mockCredit as any);

            const result = await creditService.createCredit(creditData);

            expect(mockCreditRepository.create).toHaveBeenCalled();
            expect(result.cuotaMensual).toBeGreaterThan(0);
            expect(result.saldoActual).toBe(creditData.valorInicial);
        });

        it('should calculate correct monthly payment with 0% interest', async () => {
            const creditData = {
                nombre: 'Crédito sin interés',
                valorInicial: 12000000,
                tasaInteresAnual: 0,
                plazoMeses: 12,
                fechaInicio: new Date('2026-01-01'),
                userId: '507f1f77bcf86cd799439011',
            };

            const mockCredit = {
                id: 'credit124',
                ...creditData,
                saldoActual: 12000000,
                cuotaMensual: 1000000,
                subsidioPorcentaje: 0,
                estado: 'ACTIVO',
                tipoPago: TipoPago.MENSUAL,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCreditRepository.create.mockResolvedValue(mockCredit as any);

            const result = await creditService.createCredit(creditData);

            expect(result.cuotaMensual).toBe(1000000);
        });
    });

    describe('simularAbono', () => {
        it('should calculate benefits of paying extra capital', async () => {
            const mockCredit = {
                id: 'credit123',
                userId: '507f1f77bcf86cd799439011',
                nombre: 'Crédito Hipotecario',
                valorInicial: 100000000,
                saldoActual: 90000000,
                tasaInteresAnual: 12,
                plazoMeses: 240,
                cuotaMensual: 1000000,
                subsidioPorcentaje: 0,
                fechaInicio: new Date('2020-01-01'),
                estado: 'ACTIVO',
                tipoPago: TipoPago.MENSUAL,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCreditRepository.findById.mockResolvedValue(mockCredit as any);

            const simulacion = await creditService.simularAbono('credit123', 10000000);

            expect(simulacion).toBeDefined();
            expect(simulacion!.conAbono.nuevoSaldo).toBe(80000000);
            expect(simulacion!.conAbono.nuevaCuotaMensual).toBeLessThan(mockCredit.cuotaMensual);
            expect(simulacion!.beneficios.ahorroIntereses).toBeGreaterThan(0);
            expect(simulacion!.beneficios.reduccionCuota).toBeGreaterThan(0);
        });
    });

    describe('registrarAbono', () => {
        it('should register payment and update credit', async () => {
            const mockCredit = {
                id: 'credit123',
                userId: '507f1f77bcf86cd799439011',
                nombre: 'Crédito',
                valorInicial: 10000000,
                saldoActual: 8000000,
                tasaInteresAnual: 12,
                plazoMeses: 48,
                cuotaMensual: 250000,
                subsidioPorcentaje: 0,
                fechaInicio: new Date('2025-01-01'),
                estado: 'ACTIVO',
                tipoPago: TipoPago.MENSUAL,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockAbono = {
                id: 'abono123',
                creditId: 'credit123',
                monto: 1000000,
                fecha: new Date(),
                saldoAnterior: 8000000,
                saldoNuevo: 7000000,
                cuotaAnterior: 250000,
                cuotaNueva: 220000,
                plazoAnterior: 48,
                plazoNuevo: 48,
                createdAt: new Date(),
            };

            mockCreditRepository.findById.mockResolvedValue(mockCredit as any);
            mockCreditRepository.createAbono.mockResolvedValue(mockAbono as any);
            mockCreditRepository.update.mockResolvedValue({ ...mockCredit, saldoActual: 7000000 } as any);

            const result = await creditService.registrarAbono({
                creditId: 'credit123',
                monto: 1000000,
            });

            expect(result.saldoNuevo).toBe(7000000);
            expect(mockCreditRepository.update).toHaveBeenCalledWith(
                'credit123',
                expect.objectContaining({
                    saldoActual: 7000000,
                })
            );
        });

        it('should throw error if payment exceeds balance', async () => {
            const mockCredit = {
                id: 'credit123',
                saldoActual: 1000000,
            };

            mockCreditRepository.findById.mockResolvedValue(mockCredit as any);

            await expect(
                creditService.registrarAbono({
                    creditId: 'credit123',
                    monto: 2000000,
                })
            ).rejects.toThrow('El monto del abono no puede ser mayor al saldo actual');
        });
    });

    describe('getProyeccion', () => {
        it('should generate complete payment schedule', async () => {
            const mockCredit = {
                id: 'credit123',
                userId: '507f1f77bcf86cd799439011',
                nombre: 'Crédito Personal',
                valorInicial: 5000000,
                saldoActual: 5000000,
                tasaInteresAnual: 18,
                plazoMeses: 12,
                cuotaMensual: 459165.22,
                subsidioPorcentaje: 20,
                fechaInicio: new Date('2026-01-01'),
                estado: 'ACTIVO',
                tipoPago: TipoPago.MENSUAL,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCreditRepository.findById.mockResolvedValue(mockCredit as any);
            mockCreditRepository.getAbonosByCredit.mockResolvedValue([]);

            const proyeccion = await creditService.getProyeccion('credit123');

            expect(proyeccion).toBeDefined();
            expect(proyeccion!.cuotas.length).toBe(12);
            expect(proyeccion!.resumen.totalSubsidios).toBeGreaterThan(0);
            expect(proyeccion!.resumen.cuotaConSubsidio).toBeLessThan(proyeccion!.resumen.cuotaMensual);
            
            // Verificar que el saldo va disminuyendo
            expect(proyeccion!.cuotas[0].saldoRestante).toBeLessThan(mockCredit.saldoActual);
            expect(proyeccion!.cuotas[11].saldoRestante).toBeLessThan(proyeccion!.cuotas[0].saldoRestante);
        });
    });
});
