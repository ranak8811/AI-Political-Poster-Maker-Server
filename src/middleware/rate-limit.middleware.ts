import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

// Store user rate limit records in memory: key -> { count, resetTime }
interface RateLimitRecord {
  count: number;
  resetTime: number; // Timestamp in milliseconds
}

const userGenerations = new Map<string, RateLimitRecord>();

/**
 * In-memory rate limiting middleware for poster generation and regeneration.
 * Prevents abuse and conserves Google Gemini & Cloudinary quota.
 * Limit: 5 poster generations per hour per user/IP.
 */
export function generationRateLimiter(req: AuthRequest, res: Response, next: NextFunction): void {
  // Use logged-in userId if available, otherwise fallback to client IP
  const identifier = req.user?.userId || req.ip || 'anonymous_user';
  const now = Date.now();
  const oneHourInMs = 60 * 60 * 1000;
  const maxAllowed = parseInt(process.env.RATE_LIMIT_POSTERS_PER_HOUR || '5', 10);

  const existingRecord = userGenerations.get(identifier);

  // If no record exists yet, or the 1-hour window has expired, reset counter
  if (!existingRecord || now > existingRecord.resetTime) {
    userGenerations.set(identifier, {
      count: 1,
      resetTime: now + oneHourInMs,
    });
    return next();
  }

  // If user has already reached the hourly limit, block request
  if (existingRecord.count >= maxAllowed) {
    const minutesRemaining = Math.ceil((existingRecord.resetTime - now) / 60000);

    res.status(429).json({
      success: false,
      message: `Hourly poster generation limit reached (${maxAllowed} posters per hour). Please try again in ${minutesRemaining} minutes.`,
      retryAfterMinutes: minutesRemaining,
    });
    return;
  }

  // Otherwise, increment counter and proceed to generation
  existingRecord.count += 1;
  next();
}

/**
 * Helper function to reset rate limits (useful for testing)
 */
export function resetRateLimits(): void {
  userGenerations.clear();
}
