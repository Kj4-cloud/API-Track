import { Response, NextFunction } from 'express';
import { UsageService } from './usage.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class UsageController {
  private service = new UsageService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUserUsage(req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getByApi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUsageByApi(req.params.apiId, req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.recordUsage(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteUsage(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Usage entry deleted' });
    } catch (err) {
      next(err);
    }
  };
}
