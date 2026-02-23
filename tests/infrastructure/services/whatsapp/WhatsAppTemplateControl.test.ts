import { WhatsAppTemplateControl } from "../../../../src/infrastructure/services/whatsapp/WhatsAppTemplateControl";
import { WhatsAppApiClient } from "../../../../src/infrastructure/services/whatsapp/WhatsAppApiClient";
import { IOpenAIService } from "../../../../src/domain/services/Interfaces/IAnalysisService";
import { IWhatsAppTemplateRepository } from "../../../../src/domain/repositories/Interfaces/IWhatsAppTemplateRepository";

describe('WhatsAppTemplateControl', () => {
    let control: WhatsAppTemplateControl;
    let apiClient: jest.Mocked<WhatsAppApiClient>;
    let aiService: jest.Mocked<IOpenAIService>;
    let repository: jest.Mocked<IWhatsAppTemplateRepository>;

    beforeEach(() => {
        apiClient = {
            createTemplate: jest.fn(),
        } as any;
        aiService = {
            generateResponse: jest.fn(),
        } as any;
        repository = {
            save: jest.fn(),
            findByPurpose: jest.fn(),
        } as any;

        control = new WhatsAppTemplateControl(apiClient, aiService, repository);
    });

    it('registerTemplateWithAI should generate definition and call save', async () => {
        aiService.generateResponse.mockResolvedValue({
            content: 'Hola {{1}}, tu código es {{2}}',
            role: 'assistant'
        });

        repository.save.mockImplementation(async (template) => template);

        const template = await control.registerTemplateWithAI({
            purpose: 'PHONE_VERIFICATION',
            language: 'es_CO',
            category: 'UTILITY',
            aiPromptContext: { appName: 'FinanzApp' },
        });

        expect(aiService.generateResponse).toHaveBeenCalled();
        expect(repository.save).toHaveBeenCalled();
        expect(template.purpose).toBe('PHONE_VERIFICATION');
        expect(template.status).toBe('LOCAL_ONLY');
    });

    it('getTemplateByPurpose should call repository', async () => {
        repository.findByPurpose.mockResolvedValue(null);
        const result = await control.getTemplateByPurpose('REMINDER_APPOINTMENT', 'es_CO');
        expect(result).toBeNull();
        expect(repository.findByPurpose).toHaveBeenCalledWith('REMINDER_APPOINTMENT', 'es_CO');
    });
});
