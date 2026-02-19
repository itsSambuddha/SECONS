// ============================================================
// In-Memory Sliding Window Rate Limiter
// No Redis needed — suitable for single-instance deployments
// ============================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetTime) {
            store.delete(key);
        }
    }
}, 60_000); // Clean every 60s

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
}

export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
        // Fresh window
        store.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetInMs: entry.resetTime - now,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetInMs: entry.resetTime - now,
    };
}

// Preset rate limits
export function authRateLimit(ip: string): RateLimitResult {
    return checkRateLimit(`auth:${ip}`, 5, 60_000); // 5 req/min
}

export function apiRateLimit(ip: string): RateLimitResult {
    return checkRateLimit(`api:${ip}`, 60, 60_000); // 60 req/min
}

export function inviteRateLimit(userId: string): RateLimitResult {
    return checkRateLimit(`invite:${userId}`, 10, 3_600_000); // 10/hour
}

export function uploadRateLimit(userId: string): RateLimitResult {
    return checkRateLimit(`upload:${userId}`, 20, 3_600_000); // 20/hour
}
