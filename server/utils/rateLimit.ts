import type { H3Event } from "h3";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.windowStart + 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export function checkRateLimit(
  event: H3Event,
  options: RateLimitOptions
): { allowed: boolean; retryAfter: number } {
  const clientIp =
    getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const key = `${options.keyPrefix || "rl"}:${clientIp}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.windowStart + options.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= options.maxRequests) {
    const retryAfter = Math.ceil(
      (entry.windowStart + options.windowMs - now) / 1000
    );
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function applyRateLimit(
  event: H3Event,
  options: RateLimitOptions
): void {
  const result = checkRateLimit(event, options);

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      data: {
        retryAfter: result.retryAfter,
      },
    });
  }
}
