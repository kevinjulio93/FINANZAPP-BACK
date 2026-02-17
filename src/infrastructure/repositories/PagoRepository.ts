import mongoose from "mongoose";
import { IPagoRepository, ICreatePago, IPagoFilters, IPaginatedResponse } from "../../domain/repositories/Interfaces/IPagoRepository";
import { PagoMensualModel, IPagoMensualDocument } from "../models/PagoMensual.model";
import { ServiceModel } from "../models/Service.model";

export class PagoRepository implements IPagoRepository {
    async create(data: ICreatePago): Promise<IPagoMensualDocument> {
        const pago = new PagoMensualModel({
            ...data,
            serviceId: new mongoose.Types.ObjectId(data.serviceId),
        });
        await pago.save();
        return pago;
    }

    async findById(id: string): Promise<IPagoMensualDocument | null> {
        return PagoMensualModel.findById(id);
    }

    async findAll(): Promise<IPagoMensualDocument[]> {
        return PagoMensualModel.find();
    }

    async findByServiceId(serviceId: string): Promise<IPagoMensualDocument[]> {
        return PagoMensualModel.find({ serviceId: new mongoose.Types.ObjectId(serviceId) });
    }

    async findByUserId(
        userId: string,
        filters: IPagoFilters,
        page: number = 1,
        limit: number = 10
    ): Promise<IPaginatedResponse<IPagoMensualDocument>> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const { search, serviceId, categoryId, mes, año } = filters;

        // Get all services for this user's categories to verify ownership
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const validUserServices = userServices.filter(service => service.categoryId);
        let allowedServiceIds = validUserServices.map(service => service._id);

        // If categoryId filter is provided, restrict allowedServiceIds
        if (categoryId) {
            allowedServiceIds = validUserServices
                .filter(s => s.categoryId._id.toString() === categoryId)
                .map(s => s._id);
        }

        // If serviceId filter is provided, check if it's in allowed list
        if (serviceId) {
            const requestedServiceId = new mongoose.Types.ObjectId(serviceId);
            if (allowedServiceIds.some(id => id.equals(requestedServiceId))) {
                allowedServiceIds = [requestedServiceId];
            } else {
                // Requested service doesn't belong to user
                allowedServiceIds = [];
            }
        }

        let query: any = {
            serviceId: { $in: allowedServiceIds }
        };

        if (mes) query.mes = mes;
        if (año) query.año = año;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const matchingServiceIds = validUserServices
                .filter(s => searchRegex.test(s.name))
                .map(s => s._id);

            query['$or'] = [
                { serviceId: { $in: matchingServiceIds } },
                { notas: { $regex: searchRegex } },
                { metodoPago: { $regex: searchRegex } }
            ];

            const numericSearch = parseFloat(search);
            if (!isNaN(numericSearch)) {
                query['$or'].push({ valorPagado: numericSearch });
            }
        }

        const skip = (page - 1) * limit;
        const total = await PagoMensualModel.countDocuments(query);
        const data = await PagoMensualModel.find(query)
            .populate({
                path: 'serviceId',
                populate: {
                    path: 'categoryId'
                }
            })
            .sort({ fechaPago: -1 })
            .skip(skip)
            .limit(limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async update(id: string, data: Partial<ICreatePago>): Promise<IPagoMensualDocument | null> {
        const updateData: any = { ...data };
        if (data.serviceId) {
            updateData.serviceId = new mongoose.Types.ObjectId(data.serviceId);
        }
        return PagoMensualModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        await PagoMensualModel.findByIdAndDelete(id);
        return true;
    }

    async deleteMany(ids: string[]): Promise<number> {
        const result = await PagoMensualModel.deleteMany({
            _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }
        });
        return result.deletedCount;
    }

    // Métodos para reportes
    async findByUserIdSortedByDate(userId: string): Promise<IPagoMensualDocument[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.find({
            serviceId: { $in: serviceIds }
        }).populate('serviceId', 'name').sort({ fechaPago: -1 });
    }

    async findByMonth(userId: string, mes: number, año: number): Promise<IPagoMensualDocument[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.find({
            serviceId: { $in: serviceIds },
            mes,
            año
        }).populate('serviceId', 'name').sort({ fechaPago: -1 });
    }

    async findByYear(userId: string, año: number): Promise<IPagoMensualDocument[]> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.find({
            serviceId: { $in: serviceIds },
            año
        }).populate('serviceId', 'name').sort({ mes: 1, fechaPago: -1 });
    }

    async findByCategoryGroupedByMonth(userId: string, categoryId: string, año: number): Promise<any> {
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get services for this category
        const categoryServices = await ServiceModel.find({
            categoryId: categoryObjectId
        }).populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = categoryServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.aggregate([
            {
                $match: {
                    serviceId: { $in: serviceIds },
                    año
                }
            },
            {
                $group: {
                    _id: '$mes',
                    total: { $sum: '$valorPagado' },
                    count: { $sum: 1 },
                    pagos: { $push: '$$ROOT' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
    }

    async findByCategorySortedByDate(userId: string, categoryId: string): Promise<IPagoMensualDocument[]> {
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const categoryServices = await ServiceModel.find({
            categoryId: categoryObjectId
        }).populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = categoryServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.find({
            serviceId: { $in: serviceIds }
        }).populate('serviceId', 'name').sort({ fechaPago: -1 });
    }

    async getMonthlyStats(userId: string, mes: number, año: number): Promise<any> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        return PagoMensualModel.aggregate([
            {
                $match: {
                    serviceId: { $in: serviceIds },
                    mes,
                    año
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            {
                $unwind: '$service'
            },
            {
                $group: {
                    _id: '$serviceId',
                    serviceName: { $first: '$service.name' },
                    total: { $sum: '$valorPagado' },
                    count: { $sum: 1 },
                    maxPago: { $max: '$valorPagado' },
                    minPago: { $min: '$valorPagado' },
                    avgPago: { $avg: '$valorPagado' }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);
    }

    async getServiceAverages(userId: string, serviceId: string): Promise<any> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const serviceObjectId = new mongoose.Types.ObjectId(serviceId);

        // Verify service ownership
        const service = await ServiceModel.findById(serviceObjectId).populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        if (!service || !service.categoryId) {
            return null;
        }

        return PagoMensualModel.aggregate([
            {
                $match: {
                    serviceId: serviceObjectId
                }
            },
            {
                $group: {
                    _id: null,
                    avgPago: { $avg: '$valorPagado' },
                    maxPago: { $max: '$valorPagado' },
                    minPago: { $min: '$valorPagado' },
                    totalPagos: { $sum: 1 },
                    totalGastado: { $sum: '$valorPagado' }
                }
            }
        ]);
    }

    async getPaymentReport(userId: string, mes: number | undefined, año: number): Promise<any> {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get all services for this user to filter payments correctly
        const userServices = await ServiceModel.find().populate({
            path: 'categoryId',
            match: { userId: userObjectId }
        });

        const serviceIds = userServices
            .filter(service => service.categoryId)
            .map(service => service._id);

        const matchQuery: any = {
            serviceId: { $in: serviceIds },
            año
        };

        if (mes) {
            matchQuery.mes = mes;
        }

        const report = await PagoMensualModel.aggregate([
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'serviceInfo'
                }
            },
            { $unwind: '$serviceInfo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'serviceInfo.categoryId',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            // Agrupar primero por servicio para sumar múltiples pagos del mismo servicio en el periodo
            {
                $group: {
                    _id: {
                        categoryId: '$serviceInfo.categoryId',
                        serviceId: '$serviceId'
                    },
                    categoryName: { $first: '$categoryInfo.name' },
                    categoryColor: { $first: '$categoryInfo.color' },
                    serviceName: { $first: '$serviceInfo.name' },
                    totalService: { $sum: '$valorPagado' },
                    pagosCount: { $sum: 1 }
                }
            },
            // Agrupar por categoría para el reporte final
            {
                $group: {
                    _id: '$_id.categoryId',
                    categoryName: { $first: '$categoryName' },
                    categoryColor: { $first: '$categoryColor' },
                    total: { $sum: '$totalService' },
                    servicios: {
                        $push: {
                            serviceId: { $toString: '$_id.serviceId' },
                            serviceName: '$serviceName',
                            total: '$totalService',
                            pagos: '$pagosCount'
                        }
                    }
                }
            },
            {
                $project: {
                    categoryId: { $toString: '$_id' },
                    _id: 0,
                    categoryName: 1,
                    categoryColor: 1,
                    total: 1,
                    servicios: 1
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const totalGastado = report.reduce((acc, cat) => acc + cat.total, 0);

        // Trend calculation (only if mes is provided)
        let trend = undefined;
        if (mes) {
            let prevMes = mes - 1;
            let prevAño = año;
            if (prevMes === 0) {
                prevMes = 12;
                prevAño = año - 1;
            }

            const prevMonthPagos = await PagoMensualModel.find({
                serviceId: { $in: serviceIds },
                mes: prevMes,
                año: prevAño
            });

            const totalPrevMonth = prevMonthPagos.reduce((acc, p) => acc + p.valorPagado, 0);

            let trendValue = 0;
            if (totalPrevMonth > 0) {
                trendValue = ((totalGastado - totalPrevMonth) / totalPrevMonth) * 100;
            } else if (totalGastado > 0) {
                trendValue = 100;
            }

            trend = {
                value: Math.abs(Math.round(trendValue)),
                isPositive: trendValue < 0,
                percentage: trendValue
            };
        }

        // 3. Top Expenses
        const topExpenses = await PagoMensualModel.find(matchQuery)
            .sort({ valorPagado: -1 })
            .limit(5)
            .populate({
                path: 'serviceId',
                select: 'name categoryId',
                populate: { path: 'categoryId', select: 'name color' }
            });

        // 4. Monthly Average & Breakdown
        let averageMonthly = 0;
        let activeMonths = 0;
        let monthlyBreakdown: Array<{ month: number; total: number }> = [];

        if (!mes) {
            const monthlyStats = await PagoMensualModel.aggregate([
                { $match: matchQuery },
                { $group: { _id: "$mes", total: { $sum: "$valorPagado" } } },
                { $sort: { _id: 1 } }
            ]);

            monthlyBreakdown = monthlyStats.map(s => ({ month: s._id, total: s.total }));
            activeMonths = monthlyStats.length;

            if (activeMonths > 0) {
                averageMonthly = totalGastado / activeMonths;
            }
        } else {
            averageMonthly = totalGastado;
            activeMonths = 1;
        }

        return {
            mes,
            año,
            totalGastado,
            porCategoria: report,
            trend,
            topExpenses: topExpenses.map(p => ({
                id: p._id,
                merchant: (p.serviceId as any)?.name || "Unknown",
                category: (p.serviceId as any)?.categoryId?.name || "Other",
                categoryColor: (p.serviceId as any)?.categoryId?.color || "#6B7280",
                amount: p.valorPagado,
                icon: "other"
            })),
            averageMonthly,
            activeMonths,
            monthlyBreakdown
        };
    }
}
