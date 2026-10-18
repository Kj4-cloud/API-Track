import { Response, NextFunction } from 'express';
import { ApiService } from './api.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class ApiController {
  private service = new ApiService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query : undefined;
      const data = await this.service.getUserApis(req.user!.id, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getApiDetail(req.params.id, req.user!.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'API service not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createApi(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateApi(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateUsage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tokensUsed = Number(req.body.tokens_used || 0);
      await this.service.updateUsage(req.params.id, req.user!.id, tokensUsed);
      res.json({ success: true, message: 'Usage updated' });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = req.body.status;
      await this.service.updateStatus(req.params.id, req.user!.id, status);
      res.json({ success: true, message: 'Status updated' });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteApi(req.params.id, req.user!.id);
      res.json({ success: true, message: 'API service deleted' });
    } catch (err) {
      next(err);
    }
  };
}
