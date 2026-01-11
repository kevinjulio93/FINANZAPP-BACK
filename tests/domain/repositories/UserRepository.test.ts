import { UserRepository } from '../../../src/domain/repositories/UserRepository';
import { UserModel } from '../../../src/infrastructure/models/User.model';
import { INewUser } from '../../../src/domain/entities/User';
import bcrypt from 'bcryptjs';

jest.mock('../../../src/infrastructure/models/User.model');
jest.mock('bcryptjs');

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const newUserData: INewUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const mockSavedUser = {
        id: '123',
        name: newUserData.name,
        email: newUserData.email,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          id: '123',
          name: newUserData.name,
          email: newUserData.email,
          passwordHash: hashedPassword,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (UserModel as unknown as jest.Mock).mockImplementation(() => mockSavedUser);

      const result = await userRepository.createUser(newUserData);

      expect(bcrypt.hash).toHaveBeenCalledWith(newUserData.password, 10);
      expect(mockSavedUser.save).toHaveBeenCalled();
      expect(result.email).toBe(newUserData.email);
      expect(result.name).toBe(newUserData.name);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUserByEmail('test@example.com');

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUserById('123');

      expect(UserModel.findOne).toHaveBeenCalledWith({ id: '123' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getUserById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
