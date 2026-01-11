import { Router } from 'express';
import { CreditController } from '../controllers/CreditController';
import { CreditService } from '../../application/services/CreditService';
import { CreditRepository } from '../../infrastructure/repositories/CreditRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';

const router: Router = Router();
const creditRepository = new CreditRepository();
const creditService = new CreditService(creditRepository);
const creditController = new CreditController(creditService);

router.use(AuthenticationToken);

/**
 * @swagger
 * /api/credits:
 *   post:
 *     summary: Crear un nuevo crédito
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - valorInicial
 *               - tasaInteresAnual
 *               - plazoMeses
 *               - fechaInicio
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Crédito Hipotecario"
 *               valorInicial:
 *                 type: number
 *                 example: 100000000
 *               tasaInteresAnual:
 *                 type: number
 *                 example: 12.5
 *                 description: Tasa de interés anual en porcentaje
 *               plazoMeses:
 *                 type: integer
 *                 example: 240
 *                 description: Plazo en meses
 *               subsidioPorcentaje:
 *                 type: number
 *                 example: 30
 *                 description: Porcentaje de subsidio sobre la cuota
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-01"
 *               tipoPago:
 *                 type: string
 *                 enum: [MENSUAL, QUINCENAL, SEMANAL]
 *     responses:
 *       201:
 *         description: Crédito creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', (req, res) => creditController.createCredit(req, res));

/**
 * @swagger
 * /api/credits:
 *   get:
 *     summary: Obtener todos los créditos del usuario
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de créditos
 */
router.get('/', (req, res) => creditController.getCredits(req, res));

/**
 * @swagger
 * /api/credits/{id}:
 *   get:
 *     summary: Obtener un crédito por ID
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Crédito encontrado
 *       404:
 *         description: Crédito no encontrado
 */
router.get('/:id', (req, res) => creditController.getCreditById(req, res));

/**
 * @swagger
 * /api/credits/{id}/proyeccion:
 *   get:
 *     summary: Obtener proyección completa del crédito
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyección del crédito con todas las cuotas
 */
router.get('/:id/proyeccion', (req, res) => creditController.getProyeccion(req, res));

/**
 * @swagger
 * /api/credits/{id}/simular-abono:
 *   post:
 *     summary: Simular el efecto de un abono a capital
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montoAbono
 *             properties:
 *               montoAbono:
 *                 type: number
 *                 example: 5000000
 *     responses:
 *       200:
 *         description: Simulación del abono con beneficios calculados
 */
router.post('/:id/simular-abono', (req, res) => creditController.simularAbono(req, res));

/**
 * @swagger
 * /api/credits/{id}/abonos:
 *   post:
 *     summary: Registrar un abono a capital
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *             properties:
 *               monto:
 *                 type: number
 *                 example: 5000000
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-11"
 *     responses:
 *       201:
 *         description: Abono registrado y crédito actualizado
 */
router.post('/:id/abonos', (req, res) => creditController.registrarAbono(req, res));

/**
 * @swagger
 * /api/credits/{id}/abonos:
 *   get:
 *     summary: Obtener todos los abonos de un crédito
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de abonos realizados
 */
router.get('/:id/abonos', (req, res) => creditController.getAbonos(req, res));

/**
 * @swagger
 * /api/credits/{id}:
 *   delete:
 *     summary: Eliminar un crédito
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Crédito eliminado
 */
router.delete('/:id', (req, res) => creditController.deleteCredit(req, res));

export default router;
