import { Router } from 'express';
import {
  createPoster,
  getPosterById,
  getUserPosters,
  regeneratePoster,
} from '../controllers/poster.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { generationRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// POST /api/v1/posters - Create new poster (requires login & rate limit)
router.post('/', authMiddleware, generationRateLimiter, createPoster);

// GET /api/v1/posters/:id - Status polling and detail endpoint (public/sharable)
router.get('/:id', getPosterById);

// GET /api/v1/posters/user/:userId - List posters created by a user (requires login)
router.get('/user/:userId', authMiddleware, getUserPosters);

// POST /api/v1/posters/:id/regenerate - Regenerate poster layout/canvas (requires login & rate limit)
router.post('/:id/regenerate', authMiddleware, generationRateLimiter, regeneratePoster);

export default router;
