import "server-only";

// Rate limiter for avatar uploads: max 5 uploads per 10 minutes per user
const AVATAR_RATE_LIMIT = 5;
const AVATAR_RATE_WINDOW_MS = 10 * 60 * 1000;

const avatarRateLimitMap = new Map<string, number[]>();

export function checkAvatarRateLimit(userId: string, now: number = Date.now()): boolean {
  const timestamps = avatarRateLimitMap.get(userId) || [];
  const valid = timestamps.filter((t) => now - t < AVATAR_RATE_WINDOW_MS);

  if (valid.length >= AVATAR_RATE_LIMIT) {
    avatarRateLimitMap.set(userId, valid);
    return false;
  }

  valid.push(now);
  avatarRateLimitMap.set(userId, valid);
  return true;
}

export function _resetAvatarRateLimits(): void {
  avatarRateLimitMap.clear();
}
