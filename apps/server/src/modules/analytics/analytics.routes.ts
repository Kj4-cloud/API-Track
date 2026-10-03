import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new AnalyticsController();

router.use(requireAuth);

router.get('/summary', controller.getSummary);

export default router;
