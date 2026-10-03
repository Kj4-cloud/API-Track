import { Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AnalyticsController {
  private service = new AnalyticsService();

  getSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDashboardSummary(req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
