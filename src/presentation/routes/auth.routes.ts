import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../../application/services/AuthService';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { AuthenticationToken } from '../middleware/auth.middleware';
import { WhatsAppService } from '../../infrastructure/services/WhatsAppService';

const router: Router = Router();
const userRepository = new UserRepository();
const whatsappService = new WhatsAppService();
const authService = new AuthService(userRepository, whatsappService);
const authController = new AuthController(authService);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get('/me', AuthenticationToken, (req, res) => authController.getCurrentUser(req, res));

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Actualizar usuario actual
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.put('/me', AuthenticationToken, (req, res) => authController.updateCurrentUser(req, res));

/**
 * @swagger
 * /api/auth/whatsapp/send-code:
 *   post:
 *     summary: Enviar código de verificación de WhatsApp
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Código enviado
 *       401:
 *         description: No autorizado
 */
router.post('/whatsapp/send-code', AuthenticationToken, (req, res) => authController.sendWhatsAppVerification(req, res));

/**
 * @swagger
 * /api/auth/whatsapp/verify:
 *   post:
 *     summary: Verificar código de WhatsApp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 length: 6
 *     responses:
 *       200:
 *         description: WhatsApp verificado
 *       400:
 *         description: Código inválido
 *       401:
 *         description: No autorizado
 */
router.post('/whatsapp/verify', AuthenticationToken, (req, res) => authController.verifyWhatsApp(req, res));

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Iniciar sesión con Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Token inválido
 */
router.post('/google', (req, res) => authController.googleLogin(req, res));

export default router;
