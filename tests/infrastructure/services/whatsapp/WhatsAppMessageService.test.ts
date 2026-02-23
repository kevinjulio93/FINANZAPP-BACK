import { WhatsAppMessageService } from "../../../../src/infrastructure/services/whatsapp/WhatsAppMessageService";
import { IWhatsAppTemplateControl } from "../../../../src/domain/services/Interfaces/IWhatsAppTemplateControl";
import { WhatsAppApiClient } from "../../../../src/infrastructure/services/whatsapp/WhatsAppApiClient";

describe('WhatsAppMessageService', () => {
    let service: WhatsAppMessageService;
    let templateControl: jest.Mocked<IWhatsAppTemplateControl>;
    let apiClient: jest.Mocked<WhatsAppApiClient>;

    beforeEach(() => {
        templateControl = {
            getTemplateByPurpose: jest.fn(),
        } as any;

        apiClient = {
            sendTemplateMessage: jest.fn(),
        } as any;

        service = new WhatsAppMessageService(templateControl, apiClient);
    });

    it('sendVerificationMessage should use the template if found', async () => {
        templateControl.getTemplateByPurpose.mockResolvedValue({
            id: 'id-1',
            name: 'phone_verification_code_v1',
            language: 'es_CO',
            category: 'AUTHENTICATION',
            components: [],
            status: 'APPROVED',
            purpose: 'PHONE_VERIFICATION',
        });

        await service.sendVerificationMessage({
            phone: '573001112233',
            verificationCode: '789012',
            language: 'es_CO',
        });

        expect(templateControl.getTemplateByPurpose).toHaveBeenCalledWith(
            'PHONE_VERIFICATION',
            'es_CO'
        );
        expect(apiClient.sendTemplateMessage).toHaveBeenCalledWith({
            to: '573001112233',
            templateName: 'phone_verification_code_v1',
            language: 'es_CO',
            bodyParams: ['789012'],
        });
    });

    it('sendReminderMessage should throw error if no template exists', async () => {
        templateControl.getTemplateByPurpose.mockResolvedValue(null);

        await expect(
            service.sendReminderMessage({
                phone: '573001112233',
                reminderType: 'APPOINTMENT',
                variables: ['Kevin', 'mañana 9am'],
                language: 'es_CO',
            })
        ).rejects.toThrow('No WhatsApp template configured');
    });
});
