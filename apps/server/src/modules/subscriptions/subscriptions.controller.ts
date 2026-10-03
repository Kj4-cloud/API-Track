import { Response, NextFunction } from 'express';
import { SubscriptionsService } from './subscriptions.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class SubscriptionsController {
  private service = new SubscriptionsService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUserSubscriptions(req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getSubscriptionDetail(req.params.id, req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createSubscription(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateSubscription(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteSubscription(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Subscription removed' });
    } catch (err) {
      next(err);
    }
  };
}
