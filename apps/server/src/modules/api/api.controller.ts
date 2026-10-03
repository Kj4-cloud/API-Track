import { Response, NextFunction } from 'express';
import { ApiService } from './api.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class ApiController {
  private service = new ApiService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUserApis(req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getApiDetail(req.params.id, req.user!.id);
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

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteApi(req.params.id, req.user!.id);
      res.json({ success: true, message: 'API service deleted' });
    } catch (err) {
      next(err);
    }
  };
}
