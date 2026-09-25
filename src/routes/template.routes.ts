import { Router } from 'express';
import { getTemplates, getTemplateById } from '../controllers/template.controller';

const router = Router();

// GET /api/v1/templates
router.get('/', getTemplates);

// GET /api/v1/templates/:id
router.get('/:id', getTemplateById);

export default router;
