import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new SubscriptionsController();

router.use(requireAuth);

router.get('/', controller.getAll);
router.get('/upcoming', controller.getUpcoming);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
