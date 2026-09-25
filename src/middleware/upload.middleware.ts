import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Store uploaded files temporarily in memory for streaming to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WEBP image files are allowed!'));
    }
  },
});

/**
 * Middleware wrapper to handle Multer upload and catch errors (file size limit, file format)
 */
export function handleMulterUpload(req: Request, res: Response, next: NextFunction): void {
  const singleUpload = upload.single('photo');

  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'File size exceeds the 5MB limit. Please upload a smaller image.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'Invalid file format. Only JPG, PNG, and WEBP are allowed.',
      });
      return;
    }
    next();
  });
}
