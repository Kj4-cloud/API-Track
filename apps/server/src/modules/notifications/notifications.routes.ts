import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new NotificationsController();

router.use(requireAuth);

router.get('/', controller.getAll);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/mark-all-read', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

export default router;
