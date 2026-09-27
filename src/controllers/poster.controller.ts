import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Poster } from '../models/poster.model';
import { Template } from '../models/template.model';
import { generatePosterLayoutConfig } from '../services/gemini.service';
import { renderPoliticalPoster } from '../services/canvas.service';

/**
 * Background worker function to generate poster using Gemini AI and Canvas 2D engine.
 * Updates the database status when completed or failed.
 */
async function processPosterGeneration(
  posterId: string,
  occasionType: string,
  formData: any,
  photoUrls: string[]
) {
  try {
    console.log(`[Worker] Starting poster generation for ID: ${posterId}`);

    // Step 1: Call Gemini (Option B) for creative layout & colors
    const aiLayout = await generatePosterLayoutConfig({
      occasionType,
      headline: formData.headline,
      candidateName: formData.name,
      party: formData.party,
      photoCount: photoUrls.length,
    });

    console.log(`[Worker] AI layout generated. Rendering 1200x1600 canvas for ID: ${posterId}`);

    // Step 2: Render 1200x1600 canvas and stream to Cloudinary
    const finalImageUrl = await renderPoliticalPoster({
      formData,
      photoUrls,
      layout: aiLayout,
    });

    // Step 3: Update poster document in MongoDB
    await Poster.findByIdAndUpdate(posterId, {
      status: 'completed',
      generatedImageUrl: finalImageUrl,
    });

    console.log(`[Worker] Poster ${posterId} completed! Image URL: ${finalImageUrl}`);
  } catch (error: any) {
    console.error(`[Worker] Poster generation failed for ${posterId}:`, error);

    await Poster.findByIdAndUpdate(posterId, {
      status: 'failed',
      errorMessage: error?.message || 'Failed to render poster',
    });
  }
}

/**
 * POST /api/v1/posters
 * Creates a new poster request and triggers background rendering.
 */
export async function createPoster(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'You must be logged in to create a poster.' });
      return;
    }

    const { templateId, formData, uploadedPhotoUrls } = req.body;

    // Validate required form fields
    if (!templateId || !formData || !formData.name || !formData.headline) {
      res.status(400).json({
        success: false,
        message: 'Please provide templateId, candidate name, and headline.',
      });
      return;
    }

    // Verify template exists
    const template = await Template.findById(templateId);
    if (!template) {
      res.status(404).json({ success: false, message: 'Selected template was not found.' });
      return;
    }

    // 1. Create poster record in database with 'generating' status
    const poster = await Poster.create({
      userId,
      templateId,
      formData: {
        name: formData.name,
        designation: formData.designation || '',
        party: formData.party || '',
        locality: formData.locality || '',
        headline: formData.headline,
        creditLine: formData.creditLine || 'প্রচারে: এলাকাবাসী ও দলীয় নেতাকর্মীবৃন্দ',
      },
      uploadedPhotoUrls: Array.isArray(uploadedPhotoUrls) ? uploadedPhotoUrls : [],
      status: 'generating',
      regenerationCount: 0,
    });

    // 2. Respond immediately to the frontend so the user sees the loading/polling screen
    res.status(202).json({
      success: true,
      message: 'Poster generation started in background',
      posterId: poster._id,
      poster: {
        _id: poster._id,
        status: 'generating',
      },
      status: 'generating',
    });

    // 3. Trigger asynchronous generation in background without blocking response
    const photoList = Array.isArray(uploadedPhotoUrls) ? uploadedPhotoUrls : [];
    processPosterGeneration(
      poster._id.toString(),
      template.occasionType,
      poster.formData,
      photoList
    );
  } catch (error: any) {
    console.error('Error creating poster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create poster request',
      error: error?.message || 'Server error',
    });
  }
}

/**
 * GET /api/v1/posters/:id
 * Polling endpoint for frontend to check generation status and retrieve image URL.
 */
export async function getPosterById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const posterId = Array.isArray(rawId) ? rawId[0] : rawId;

    const poster = await Poster.findById(posterId).populate('templateId', 'title slug occasionType thumbnailUrl');

    if (!poster) {
      res.status(404).json({ success: false, message: 'Poster not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      poster,
    });
  } catch (error: any) {
    console.error('Error fetching poster by id:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poster details',
      error: error?.message || 'Server error',
    });
  }
}

/**
 * GET /api/v1/posters/user/:userId
 * Retrieves list of posters created by a user.
 */
export async function getUserPosters(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rawUserId = req.params.userId;
    const targetUserId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    // Optional check: ensure logged in user matches or is admin
    const currentUserId = req.user?.userId;
    if (currentUserId && currentUserId !== targetUserId) {
      console.warn(`User ${currentUserId} requested posters for user ${targetUserId}`);
    }

    const posters = await Poster.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .populate('templateId', 'title slug occasionType thumbnailUrl');

    res.status(200).json({
      success: true,
      count: posters.length,
      posters,
    });
  } catch (error: any) {
    console.error('Error fetching user posters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user poster history',
      error: error?.message || 'Server error',
    });
  }
}

/**
 * POST /api/v1/posters/:id/regenerate
 * Re-runs poster generation with a strict limit of 3 regenerations per poster.
 */
export async function regeneratePoster(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const posterId = Array.isArray(rawId) ? rawId[0] : rawId;

    const poster = await Poster.findById(posterId).populate('templateId');
    if (!poster) {
      res.status(404).json({ success: false, message: 'Poster not found.' });
      return;
    }

    // Check bounded regeneration limit (max 3 times)
    if (poster.regenerationCount >= 3) {
      res.status(400).json({
        success: false,
        message: 'Maximum regeneration limit reached (3 times). Please create a new poster.',
      });
      return;
    }

    // Optional update to form text if provided in body
    if (req.body.formData) {
      poster.formData = {
        ...poster.formData,
        ...req.body.formData,
      };
    }

    // Increment count and mark as generating
    poster.regenerationCount += 1;
    poster.status = 'generating';
    poster.errorMessage = undefined;
    await poster.save();

    // Respond immediately with 202 Accepted
    res.status(202).json({
      success: true,
      message: 'Poster regeneration started',
      posterId: poster._id,
      regenerationCount: poster.regenerationCount,
      status: 'generating',
    });

    const template: any = poster.templateId;
    const occasionType = template?.occasionType || 'VICTORY_DAY';

    // Trigger background process
    processPosterGeneration(
      poster._id.toString(),
      occasionType,
      poster.formData,
      poster.uploadedPhotoUrls || []
    );
  } catch (error: any) {
    console.error('Error regenerating poster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate poster',
      error: error?.message || 'Server error',
    });
  }
}
