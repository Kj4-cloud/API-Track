import { Router } from 'express';
import apiRoutes from '../modules/api/api.routes.js';
import subscriptionRoutes from '../modules/subscriptions/subscriptions.routes.js';
import usageRoutes from '../modules/usage/usage.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'API-Token-Tracker Backend',
    timestamp: new Date().toISOString(),
  });
});

// Feature modules
router.use('/services', apiRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/usage', usageRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
