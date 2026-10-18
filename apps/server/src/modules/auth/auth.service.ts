import { AuthRepository } from './auth.repository.js';
import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';

export class AuthService {
  private repo = new AuthRepository();

  async register(data: { email: string; password: string; name: string }) {
    const existing = this.repo.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const passwordHash = hashPassword(data.password);
    const { user, profile } = this.repo.createUser({
      email: data.email,
      passwordHash,
      name: data.name || data.email.split('@')[0],
    });

    const token = generateToken({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = this.repo.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const profile = this.repo.getProfile(user.id);
    const token = generateToken({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
    };
  }

  async getCurrentUser(userId: string) {
    const user = this.repo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = this.repo.getProfile(userId);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
    };
  }

  async updateProfile(userId: string, data: any) {
    return this.repo.updateProfile(userId, data);
  }

  async updatePassword(userId: string, newPassword: string) {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const hash = hashPassword(newPassword);
    this.repo.updatePassword(userId, hash);
    return { success: true, message: 'Password updated successfully' };
  }

  async getPreferences(userId: string) {
    return this.repo.getPreferences(userId);
  }

  async updatePreferences(userId: string, data: any) {
    return this.repo.updatePreferences(userId, data);
  }
}
