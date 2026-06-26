import { Request, Response } from "express";
import { ChatService } from "../../application/services/ChatService";

import { t } from "../../infrastructure/i18n/translate";
import { AuthRequest } from "../middleware/auth.middleware";

export class ChatController {
    private chatService: ChatService;

    constructor(chatService: ChatService) {
        this.chatService = chatService;
    }

    async chat(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.user!.id;
            const { message, history } = req.body;

            if (!message) {
                const lang = req.user?.language || 'en';
                return res.status(400).json({ message: t(lang, "errors.chatMessageRequired") });
            }

            const response = await this.chatService.processMessage(userId, message, history);
            return res.status(200).json(response);
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Chat Error:', error);
            return res.status(500).json({ message: t(lang, error.message || "errors.chatError") });
        }
    }

    async chatStream(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const { message, history } = req.body;

            if (!message) {
                const lang = req.user?.language || 'en';
                res.status(400).json({ message: t(lang, "errors.chatMessageRequired") });
                return;
            }

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();

            const stream = this.chatService.processMessageStream(userId, message, history);

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }

            res.write(`data: [DONE]\n\n`);
            res.end();
        } catch (error: any) {
            const lang = req.user?.language || 'en';
            console.error('Chat Stream Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: t(lang, error.message || "errors.chatError") });
            } else {
                res.write(`data: ${JSON.stringify({ error: t(lang, error.message || "errors.chatError") })}\n\n`);
                res.write(`data: [DONE]\n\n`);
                res.end();
            }
        }
    }
}
