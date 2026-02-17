import { Router } from 'express';
import { PagoController } from '../controllers/PagoController';
import { PagoService } from '../../application/services/PagoService';
import { PagoRepository } from '../../infrastructure/repositories/PagoRepository';
import { ServiceService } from '../../application/services/ServiceService';
import { ServiceRepository } from '../../infrastructure/repositories/ServiceRepository';
import { CategoryService } from '../../application/services/CategoryService';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';

const router: Router = Router();

// Initialize repositories
const pagoRepository = new PagoRepository();
const serviceRepository = new ServiceRepository();
const categoryRepository = new CategoryRepository();

// Initialize services
const pagoService = new PagoService(pagoRepository);
const serviceService = new ServiceService(serviceRepository);
const categoryService = new CategoryService(categoryRepository);

// Initialize controller
const pagoController = new PagoController(pagoService, serviceService, categoryService);

// Apply authentication middleware
router.use(AuthenticationToken);

// Reportes Routes (Deben ir primero para no ser capturadas por /:id)
router.get('/reporte', (req, res) => pagoController.getPaymentReport(req, res));
router.get('/reportes/sorted-by-date', (req, res) => pagoController.getReportePagosSortedByDate(req, res));
router.get('/reportes/by-month', (req, res) => pagoController.getReportePagosByMonth(req, res));
router.get('/reportes/by-year', (req, res) => pagoController.getReportePagosByYear(req, res));
router.get('/reportes/category/:categoryId/by-month', (req, res) => pagoController.getReportePagosByCategoryMonth(req, res));
router.get('/reportes/category/:categoryId', (req, res) => pagoController.getReportePagosByCategory(req, res));
router.get('/reportes/monthly-stats', (req, res) => pagoController.getMonthlyStats(req, res));
router.get('/reportes/service/:serviceId/averages', (req, res) => pagoController.getServiceAverages(req, res));

// CRUD Routes
router.post('/', (req, res) => pagoController.createPago(req, res));
router.get('/', (req, res) => pagoController.getPagos(req, res));
router.get('/:id', (req, res) => pagoController.getPagoById(req, res));
router.put('/:id', (req, res) => pagoController.updatePago(req, res));
router.delete('/:id', (req, res) => pagoController.deletePago(req, res));
router.post('/bulk-delete', (req, res) => pagoController.deletePagosBulk(req, res));

export default router;
