import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.use(requireAuth);
router.get('/me', controller.me);
router.post('/profile', controller.updateProfile);
router.post('/password', controller.updatePassword);
router.get('/preferences', controller.getPreferences);
router.post('/preferences', controller.updatePreferences);

export default router;
