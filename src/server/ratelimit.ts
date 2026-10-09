import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getEnv } from '@/lib/env';

const env = getEnv();

let redis: Redis | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback
const memoryCache = new Map<string, number>();

export function createLimiter(limit: number, windowSeconds: number) {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
    });
  }

  // Very basic in-memory sliding window fallback for local dev
  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const windowStart = now - windowSeconds * 1000;
      
      // Cleanup old entries randomly to prevent memory leak
      if (Math.random() < 0.05) {
        for (const [key, timestamp] of memoryCache.entries()) {
          if (timestamp < windowStart) memoryCache.delete(key);
        }
      }

      // Count entries for this identifier in the current window
      let count = 0;
      for (const [key, timestamp] of memoryCache.entries()) {
        if (key.startsWith(`${identifier}:`) && timestamp >= windowStart) {
          count++;
        }
      }

      if (count >= limit) {
        return { success: false, reset: now + windowSeconds * 1000 };
      }

      memoryCache.set(`${identifier}:${now}:${Math.random()}`, now);
      return { success: true, reset: now + windowSeconds * 1000 };
    },
  };
}

export const loginLimiter = createLimiter(10, 600); // 10 per 10 minutes
export const signupLimiter = createLimiter(5, 3600); // 5 per hour
export const registrationLimiter = createLimiter(20, 60); // Per account, across events


export const aiSearchLimiter = createLimiter(10, 60);

export const aiAskLimiter = createLimiter(5, 60);
