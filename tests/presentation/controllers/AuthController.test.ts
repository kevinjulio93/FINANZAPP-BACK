import { AuthController } from '../../../src/presentation/controllers/AuthController';
import { AuthService } from '../../../src/application/services/AuthService';
import { Request, Response } from 'express';

jest.mock('../../../src/application/services/AuthService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    } as any;

    authController = new AuthController(mockAuthService);

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      body: {},
    };
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '123',
        name: userData.name,
        email: userData.email,
        createdAt: new Date(),
      };

      mockRequest.body = userData;
      (mockAuthService.register as jest.Mock).mockResolvedValue(mockUser);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 if validation fails', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
      };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: expect.any(String),
      });
    });

    it('should return 400 if user already exists', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      (mockAuthService.register as jest.Mock).mockRejectedValue(new Error('User already exists'));

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User already exists',
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockToken = 'mock-jwt-token';
      mockRequest.body = credentials;
      (mockAuthService.login as jest.Mock).mockResolvedValue(mockToken);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ token: mockToken });
    });

    it('should return 400 if validation fails', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: expect.any(String),
      });
    });

    it('should return 400 if credentials are invalid', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (mockAuthService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
    });
  });
});
