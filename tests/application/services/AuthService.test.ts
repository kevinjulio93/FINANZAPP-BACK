import { AuthService } from '../../../src/application/services/AuthService';
import { IUserRepository } from '../../../src/domain/repositories/Interfaces/IUserRepository';
import { IUser, INewUser } from '../../../src/domain/entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: IUserRepository;

  const mockUser: IUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNewUser: INewUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    mockUserRepository = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
    };
    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(mockNewUser);

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(mockNewUser.email);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(mockNewUser);
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw error if user already exists', async () => {
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register(mockNewUser)).rejects.toThrow('User already exists');
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockToken = 'mock-jwt-token';
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(credentials);

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error if user does not exist', async () => {
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
