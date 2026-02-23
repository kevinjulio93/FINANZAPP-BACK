import express from 'express';
import { WhatsAppService } from '../../infrastructure/services/WhatsAppService';

const router: express.Router = express.Router();
const whatsappService = new WhatsAppService();

/**
 * @swagger
 * /api/whatsapp/verification:
 *   post:
 *     summary: Enviar código de verificación por WhatsApp
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje enviado
 */
router.post('/verification', async (req, res) => {
    try {
        const { phone, code, language } = req.body;
        await whatsappService.sendVerification(phone, code, language);
        res.status(200).json({ status: 'OK', message: 'Verification message sent' });
    } catch (error: any) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

/**
 * @swagger
 * /api/whatsapp/template/register:
 *   post:
 *     summary: Registrar un nuevo template usando IA
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purpose:
 *                 type: string
 *               language:
 *                 type: string
 *               category:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Template registrado localmente
 */
router.post('/template/register', async (req, res) => {
    try {
        const { purpose, language, category, context } = req.body;
        const template = await whatsappService.registerTemplate({
            purpose: purpose as any,
            language,
            category: category as any,
            aiPromptContext: context
        });
        res.status(200).json({ status: 'OK', template });
    } catch (error: any) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

export default router;
