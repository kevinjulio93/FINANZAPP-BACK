import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/Interfaces/IUserRepository';
import { INewUser } from '../../domain/entities/User';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    if (!user.passwordHash) {
      throw new Error('This account uses Google Login. Please use Google to sign in.');
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
        montosOcultos: user.montosOcultos || false,
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
      montosOcultos: user.montosOcultos || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(userId: string, updates: { name?: string; email?: string; monthlyBudget?: number; montosOcultos?: boolean }) {
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
      montosOcultos: updatedUser.montosOcultos || false,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google token');
      }

      const { email, name, sub: googleId } = payload;

      let user = await this.userRepository.getUserByGoogleId(googleId);

      if (!user) {
        // Match by email if exists but no googleId linked
        user = await this.userRepository.getUserByEmail(email);

        if (user) {
          // Link googleId to existing user
          user = await this.userRepository.updateUser(user.id, { googleId });
        } else {
          // Create new user
          user = await this.userRepository.createGoogleUser({
            name: name || email.split('@')[0],
            email,
            googleId,
          });
        }
      }

      if (!user) throw new Error('Failed to process user');

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' } // 7 days as per US-20 requirements
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget || 0,
          montosOcultos: user.montosOcultos || false,
          createdAt: user.createdAt,
        }
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Google authentication failed');
    }
  }
}
