import { Response, NextFunction } from 'express';
import { UsageService } from './usage.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class UsageController {
  private service = new UsageService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const data = await this.service.getUserUsage(req.user!.id, startDate, endDate);
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

  getAggregated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAggregatedByApi(req.user!.id);
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

  trackTelemetry = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { provider = 'Groq', tokens, tokens_used, requests = 1, cost = 0 } = req.body;
      const count = Number(tokens_used ?? tokens ?? 0);
      const data = await this.service.trackTelemetry({
        provider,
        tokens_used: count,
        requests: Number(requests || 1),
        cost: Number(cost || 0),
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
