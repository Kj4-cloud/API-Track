import { Router } from 'express';
import { ApiController } from './api.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ApiController();

router.use(requireAuth);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id/usage', controller.updateUsage);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
