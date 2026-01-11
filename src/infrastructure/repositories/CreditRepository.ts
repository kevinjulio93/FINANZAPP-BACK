import { ICreditRepository } from '../../domain/repositories/Interfaces/ICreditRepository';
import { ICredit, ICreateCredit, IAbonoCapital, ICreateAbonoCapital } from '../../domain/entities/Credit';
import { CreditModel } from '../models/Credit.model';
import { AbonoCapitalModel } from '../models/AbonoCapital.model';
import mongoose from 'mongoose';

export class CreditRepository implements ICreditRepository {
    async create(data: ICreateCredit): Promise<ICredit> {
        const credit = new CreditModel({
            ...data,
            userId: new mongoose.Types.ObjectId(data.userId),
            saldoActual: data.valorInicial,
        });
        await credit.save();
        return credit.toObject() as ICredit;
    }

    async findById(id: string): Promise<ICredit | null> {
        const credit = await CreditModel.findById(id).lean();
        if (!credit) return null;
        
        return {
            id: (credit._id as any).toString(),
            userId: credit.userId.toString(),
            nombre: credit.nombre,
            valorInicial: credit.valorInicial,
            saldoActual: credit.saldoActual,
            tasaInteresAnual: credit.tasaInteresAnual,
            plazoMeses: credit.plazoMeses,
            cuotaMensual: credit.cuotaMensual,
            subsidioPorcentaje: credit.subsidioPorcentaje,
            fechaInicio: credit.fechaInicio,
            estado: credit.estado,
            tipoPago: credit.tipoPago,
            createdAt: credit.createdAt,
            updatedAt: credit.updatedAt,
        } as ICredit;
    }

    async findByUserId(userId: string): Promise<ICredit[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const credits = await CreditModel.find({ userId: userObjectId }).lean();
        
        return credits.map(credit => ({
            id: (credit._id as any).toString(),
            userId: credit.userId.toString(),
            nombre: credit.nombre,
            valorInicial: credit.valorInicial,
            saldoActual: credit.saldoActual,
            tasaInteresAnual: credit.tasaInteresAnual,
            plazoMeses: credit.plazoMeses,
            cuotaMensual: credit.cuotaMensual,
            subsidioPorcentaje: credit.subsidioPorcentaje,
            fechaInicio: credit.fechaInicio,
            estado: credit.estado,
            tipoPago: credit.tipoPago,
            createdAt: credit.createdAt,
            updatedAt: credit.updatedAt,
        })) as ICredit[];
    }

    async update(id: string, data: Partial<ICredit>): Promise<ICredit | null> {
        const credit = await CreditModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!credit) return null;
        
        return {
            id: (credit._id as any).toString(),
            userId: credit.userId.toString(),
            nombre: credit.nombre,
            valorInicial: credit.valorInicial,
            saldoActual: credit.saldoActual,
            tasaInteresAnual: credit.tasaInteresAnual,
            plazoMeses: credit.plazoMeses,
            cuotaMensual: credit.cuotaMensual,
            subsidioPorcentaje: credit.subsidioPorcentaje,
            fechaInicio: credit.fechaInicio,
            estado: credit.estado,
            tipoPago: credit.tipoPago,
            createdAt: credit.createdAt,
            updatedAt: credit.updatedAt,
        } as ICredit;
    }

    async delete(id: string): Promise<boolean> {
        const result = await CreditModel.findByIdAndDelete(id);
        return !!result;
    }

    // Abonos a capital
    async createAbono(data: ICreateAbonoCapital): Promise<IAbonoCapital> {
        const abono = new AbonoCapitalModel({
            ...data,
            creditId: new mongoose.Types.ObjectId(data.creditId),
        });
        await abono.save();
        
        return {
            id: abono._id.toString(),
            creditId: abono.creditId.toString(),
            monto: abono.monto,
            fecha: abono.fecha,
            saldoAnterior: abono.saldoAnterior,
            saldoNuevo: abono.saldoNuevo,
            cuotaAnterior: abono.cuotaAnterior,
            cuotaNueva: abono.cuotaNueva,
            plazoAnterior: abono.plazoAnterior,
            plazoNuevo: abono.plazoNuevo,
            createdAt: abono.createdAt,
        } as IAbonoCapital;
    }

    async getAbonosByCredit(creditId: string): Promise<IAbonoCapital[]> {
        const creditObjectId = new mongoose.Types.ObjectId(creditId);
        const abonos = await AbonoCapitalModel
            .find({ creditId: creditObjectId })
            .sort({ fecha: -1 })
            .lean();
        
        return abonos.map(abono => ({
            id: (abono._id as any).toString(),
            creditId: abono.creditId.toString(),
            monto: abono.monto,
            fecha: abono.fecha,
            saldoAnterior: abono.saldoAnterior,
            saldoNuevo: abono.saldoNuevo,
            cuotaAnterior: abono.cuotaAnterior,
            cuotaNueva: abono.cuotaNueva,
            plazoAnterior: abono.plazoAnterior,
            plazoNuevo: abono.plazoNuevo,
            createdAt: abono.createdAt,
        })) as IAbonoCapital[];
    }

    async deleteAbono(id: string): Promise<boolean> {
        const result = await AbonoCapitalModel.findByIdAndDelete(id);
        return !!result;
    }
}
