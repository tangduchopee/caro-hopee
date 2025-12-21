import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

/**
 * Rate limiter middleware with LRU-like cache to prevent memory leaks
 * Fixes Critical Issue C3: Rate Limiter Memory Leak
 *
 * Key improvements:
 * - Max size limit prevents unbounded growth
 * - Automatic eviction of oldest entries when limit reached
 * - Cleanup interval properly managed
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Simple LRU-like cache with max size limit
 * Evicts oldest entries when size limit reached
 */
class BoundedRateLimitCache {
  private cache: Map<string, RateLimitRecord>;
  private readonly maxSize: number;

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): RateLimitRecord | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: RateLimitRecord): void {
    // If key exists, delete to update insertion order
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  entries(): IterableIterator<[string, RateLimitRecord]> {
    return this.cache.entries();
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Bounded caches with max 10,000 entries each (prevents OOM)
const requestCounts = new BoundedRateLimitCache(10000);
const socketConnections = new BoundedRateLimitCache(5000);

const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
};

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (options: Partial<RateLimitOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = getIdentifier(req as AuthRequest);
    const now = Date.now();

    let limit = requestCounts.get(identifier);

    // Reset if window expired
    if (!limit || now > limit.resetAt) {
      limit = {
        count: 1,
        resetAt: now + opts.windowMs,
      };
      requestCounts.set(identifier, limit);
      return next();
    }

    // Check if limit exceeded
    if (limit.count >= opts.max) {
      res.status(429).json({
        message: opts.message,
        retryAfter: Math.ceil((limit.resetAt - now) / 1000),
      });
      return;
    }

    // Increment count
    limit.count++;
    requestCounts.set(identifier, limit); // Update to maintain LRU order
    next();
  };
};

/**
 * Get identifier for rate limiting (userId, IP, or guestId)
 */
function getIdentifier(req: AuthRequest): string {
  const authReq = req as AuthRequest;

  // Prefer authenticated user
  if (authReq.user?.userId) {
    return `user:${authReq.user.userId}`;
  }

  // Fallback to IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limiter for score submissions (stricter)
 */
export const scoreSubmissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many score submissions. Please wait before trying again.',
});

/**
 * Rate limiter for API endpoints (general)
 */
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests. Please try again later.',
});

/**
 * Rate limiter for authentication endpoints (stricter)
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Rate limiter for game creation (prevent spam)
 */
export const gameCreationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many games created. Please wait before creating another.',
});

/**
 * Rate limiter for game joins (prevent spam)
 */
export const gameJoinLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many join attempts. Please wait before trying again.',
});

/**
 * Socket connection rate limiter - tracks connections per IP
 */
export const checkSocketRateLimit = (ip: string): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxConnections = 10;

  let record = socketConnections.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    socketConnections.set(ip, record);
    return { allowed: true };
  }

  if (record.count >= maxConnections) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  socketConnections.set(ip, record);
  return { allowed: true };
};

// Cleanup interval reference for proper shutdown
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start cleanup interval - clears expired entries every 2 minutes
 */
const startCleanupInterval = (): void => {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();

    // Clean expired entries from request counts
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetAt) {
        requestCounts.delete(key);
      }
    }

    // Clean expired entries from socket connections
    for (const [key, value] of socketConnections.entries()) {
      if (now > value.resetAt) {
        socketConnections.delete(key);
      }
    }
  }, 2 * 60 * 1000); // Every 2 minutes

  // Ensure interval doesn't prevent process exit
  cleanupInterval.unref();
};

/**
 * Stop cleanup interval (for graceful shutdown)
 */
export const stopRateLimiterCleanup = (): void => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

/**
 * Clear all rate limit data (for testing)
 */
export const clearRateLimitData = (): void => {
  requestCounts.clear();
  socketConnections.clear();
};

// Start cleanup interval on module load
startCleanupInterval();
