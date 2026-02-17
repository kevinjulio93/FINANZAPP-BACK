import { Request, Response } from "express";
import { ChatService } from "../../application/services/ChatService";

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

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
                return res.status(400).json({ message: "El mensaje es requerido" });
            }

            const response = await this.chatService.processMessage(userId, message, history);
            return res.status(200).json(response);
        } catch (error) {
            console.error('Chat Error:', error);
            return res.status(500).json({ message: (error as Error).message });
        }
    }
}
