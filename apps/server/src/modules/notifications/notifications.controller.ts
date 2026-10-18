import { Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class NotificationsController {
  private service = new NotificationsService();

  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const data = await this.service.getUserNotifications(req.user!.id, unreadOnly);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const count = await this.service.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.markAsRead(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.markAllAsRead(req.user!.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createNotification(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteNotification(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      next(err);
    }
  };
}
