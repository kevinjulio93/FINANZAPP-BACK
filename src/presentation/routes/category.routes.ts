import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { CategoryService } from '../../application/services/CategoryService';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';

const router: Router = Router({ mergeParams: true });
const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const controller = new CategoryController(categoryService);

router.use(AuthenticationToken);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (req, res) => controller.createCategory(req, res));

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todas las categorías del usuario
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => controller.getCategories(req, res));

export default router;