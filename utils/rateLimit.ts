/**
 * Rate Limiting Utility
 * Prevents brute force attacks on authentication endpoints
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const STORAGE_KEY = 'gpa_hub_rate_limits';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minute window

function loadLimits(): Record<string, RateLimitEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLimits(limits: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
  } catch {
    // Storage full - clear old entries
    const cleaned: Record<string, RateLimitEntry> = {};
    const now = Date.now();
    for (const [key, value] of Object.entries(limits)) {
      if (value.lockedUntil && value.lockedUntil > now) {
        cleaned[key] = value;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }
}

/**
 * Check if an action is rate limited
 * @returns { allowed: boolean; remainingAttempts: number; retryAfter?: number }
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfter?: number;
} {
  const limits = loadLimits();
  const now = Date.now();
  const entry = limits[identifier];

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > ATTEMPT_WINDOW) {
    delete limits[identifier];
    saveLimits(limits);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Lock out the user
    entry.lockedUntil = now + LOCKOUT_DURATION;
    saveLimits(limits);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfter: Math.ceil(LOCKOUT_DURATION / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.attempts,
  };
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(identifier: string): void {
  const limits = loadLimits();
  const now = Date.now();

  if (!limits[identifier]) {
    limits[identifier] = { attempts: 1, lastAttempt: now };
  } else {
    limits[identifier].attempts++;
    limits[identifier].lastAttempt = now;
  }

  saveLimits(limits);
}

/**
 * Clear rate limit on successful authentication
 */
export function clearRateLimit(identifier: string): void {
  const limits = loadLimits();
  delete limits[identifier];
  saveLimits(limits);
}

/**
 * Format retry time for display
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes} minutes`;
}
