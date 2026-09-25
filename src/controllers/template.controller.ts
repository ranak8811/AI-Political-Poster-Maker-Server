import { Request, Response } from 'express';
import { Template } from '../models/template.model';

/**
 * GET /api/v1/templates
 * Query params: ?occasion=VICTORY_DAY | CAMPAIGN | MEMORIAL | GREETINGS
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  try {
    const { occasion } = req.query;
    const filter: Record<string, any> = { isActive: true };

    if (occasion && typeof occasion === 'string') {
      filter.occasionType = occasion.toUpperCase();
    }

    const templates = await Template.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/templates/:id
 * Retrieve a specific template by MongoDB ObjectId or Slug
 */
export async function getTemplateById(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ success: false, message: 'Template ID is required' });
      return;
    }

    // Search by ObjectId if valid 24 hex characters, otherwise search by slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const template = await Template.findOne(query);

    if (!template) {
      res.status(404).json({
        success: false,
        message: `Template with ID or slug "${id}" not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error(`Error fetching template ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
