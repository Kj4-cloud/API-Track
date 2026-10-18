import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AuthController {
  private service = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      const result = await this.service.register({ email, password, name });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Registration failed' });
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      const result = await this.service.login({ email, password });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message || 'Login failed' });
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCurrentUser(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message || 'Failed to fetch user' });
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to update profile' });
    }
  };

  updatePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }
      const result = await this.service.updatePassword(req.user!.id, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to update password' });
    }
  };

  getPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPreferences(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updatePreferences(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  };
}
