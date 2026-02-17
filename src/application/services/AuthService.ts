import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/Interfaces/IUserRepository';
import { INewUser } from '../../domain/entities/User';

export class AuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async register(userData: INewUser) {
    const existingUser = await this.userRepository.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.userRepository.createUser(userData);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(credentials: { email: string; password: string }) {
    const user = await this.userRepository.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget || 0,
        createdAt: user.createdAt,
      }
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(userId: string, updates: { name?: string; email?: string; monthlyBudget?: number }) {
    // Validar que el usuario existe
    const existingUser = await this.userRepository.getUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updates.email && updates.email !== existingUser.email) {
      const emailInUse = await this.userRepository.getUserByEmail(updates.email);
      if (emailInUse) {
        throw new Error('Email already in use');
      }
    }

    // Actualizar el usuario
    const updatedUser = await this.userRepository.updateUser(userId, updates);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      monthlyBudget: updatedUser.monthlyBudget || 0,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
