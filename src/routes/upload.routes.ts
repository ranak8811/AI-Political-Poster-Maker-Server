import { Router } from 'express';
import { handleMulterUpload } from '../middleware/upload.middleware';
import { uploadPhoto } from '../controllers/upload.controller';

const router = Router();

// POST /api/v1/upload
router.post('/', handleMulterUpload, uploadPhoto);

export default router;
