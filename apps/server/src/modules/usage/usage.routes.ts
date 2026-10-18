import { Router } from 'express';
import { UsageController } from './usage.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new UsageController();

// Public telemetry ingestion endpoint
router.post('/track', controller.trackTelemetry);

// Protected routes
router.use(requireAuth);

router.get('/', controller.getAll);
router.get('/aggregated', controller.getAggregated);
router.get('/api/:apiId', controller.getByApi);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

export default router;
