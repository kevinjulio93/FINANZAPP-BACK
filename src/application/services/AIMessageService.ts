import { VertexService } from "../../infrastructure/services/VertexService";
import { IService } from "../../domain/entities/Service";
import { IUser } from "../../domain/entities/User";

export class AIMessageService {
    constructor(private vertexService: VertexService) { }

    async generateReminder(user: IUser, service: IService, diasAntes: number): Promise<string> {
        const prompt = `
        Genera un mensaje de WhatsApp AMIGABLE, CORTO y PERSUASIVO para recordar un pago.
        
        Datos:
        - Usuario: ${user.name}
        - Servicio: ${service.name} (Monto: $${service.montoEstimado})
        - Fecha límite: ${service.fechaLimitePago?.toLocaleDateString()}
        - Vence en: ${diasAntes} días.
        
        Requisitos:
        - Máximo 160 caracteres.
        - Incluye 1 emoji relevante.
        - Tono motivador pero urgente si es 1 día.
        - NO incluyas saludos genéricos como "Hola [Nombre]", usa el nombre directamente si suena natural.
        - NO pongas comillas al inicio o final.
        `;

        const response = await this.vertexService.generateResponse(user.id, prompt);
        return response.content?.trim() || `Recordatorio: ${service.name} vence en ${diasAntes} días.`;
    }
}
