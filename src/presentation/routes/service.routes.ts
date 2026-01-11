import { Router } from 'express';
import { ServiceController } from '../controllers/ServiceController';
import { ServiceService } from '../../application/services/ServiceService';
import { ServiceRepository } from '../../infrastructure/repositories/ServiceRepository';
import { CategoryService } from '../../application/services/CategoryService';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';

const router: Router = Router();
const serviceRepository = new ServiceRepository();
const categoryRepository = new CategoryRepository();
const serviceService = new ServiceService(serviceRepository);
const categoryService = new CategoryService(categoryRepository);
const serviceController = new ServiceController(serviceService, categoryService);

router.use(AuthenticationToken);
router.post('/', (req, res) => serviceController.createService(req, res));
router.get('/', (req, res) => serviceController.getServicesByUser(req, res));
router.get('/category/:categoryId', (req, res) => serviceController.getServicesByCategory(req, res));

export default router;