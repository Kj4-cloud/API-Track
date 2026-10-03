import { Router } from 'express';
import { UsageController } from './usage.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new UsageController();

router.use(requireAuth);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:apiId', controller.getByApi);
router.delete('/:id', controller.delete);

export default router;
