import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

/**
 * POST /api/v1/upload
 * Handles multipart/form-data image upload and streams buffer to Cloudinary
 */
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided. Please provide an image file under the "photo" field.',
      });
      return;
    }

    // Stream the in-memory buffer directly to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'political_posters/uploads',
            transformation: [{ width: 1200, crop: 'limit' }],
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Failed to upload image to Cloudinary'));
            } else {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          }
        );

        uploadStream.end(req.file!.buffer);
      }
    );

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('Cloudinary stream upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error while uploading image to cloud storage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
