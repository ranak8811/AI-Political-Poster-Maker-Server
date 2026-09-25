import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getProfile);

export default router;
