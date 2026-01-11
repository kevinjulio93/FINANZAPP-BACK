import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { DashboardService } from '../../application/services/DashboardService';
import { DashboardRepository } from '../../infrastructure/repositories/DashboardRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';

const router: Router = Router();
const dashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);
const dashboardController = new DashboardController(dashboardService);

router.use(AuthenticationToken);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener datos del dashboard financiero
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mes (1-12). Por defecto mes actual
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Año. Por defecto año actual
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalServices:
 *                       type: integer
 *                     totalEstimatedCost:
 *                       type: number
 *                     totalPaidThisMonth:
 *                       type: number
 *                     pendingPayments:
 *                       type: integer
 *                     overduePayments:
 *                       type: integer
 *                 mostExpensiveServices:
 *                   type: array
 *                   items:
 *                     type: object
 *                 expensesByCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                 paymentTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No autenticado
 */
router.get('/', (req, res) => dashboardController.getDashboard(req, res));

/**
 * @swagger
 * /api/dashboard/comparison:
 *   get:
 *     summary: Comparar gastos del mes actual con el anterior
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Mes a comparar
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Año a comparar
 *     responses:
 *       200:
 *         description: Comparación mensual
 *       401:
 *         description: No autenticado
 */
router.get('/comparison', (req, res) => dashboardController.getMonthlyComparison(req, res));

export default router;
