import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
        retryAfter
      });
      return;
    }

    next();
  };
}

export const loginRateLimit = createRateLimiter(5, 15 * 60 * 1000);
export const apiRateLimit = createRateLimiter(100, 60 * 1000);
export const uploadRateLimit = createRateLimiter(10, 60 * 60 * 1000);
export const strictRateLimit = createRateLimiter(10, 60 * 1000);
export const emailRateLimit = createRateLimiter(10, 24 * 60 * 60 * 1000);
export const smsRateLimit = createRateLimiter(5, 24 * 60 * 60 * 1000);
