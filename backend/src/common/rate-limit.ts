function readLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const RATE_LIMIT_WINDOW_MS = 60_000;

// Requests per client per minute. Generous enough for a passport page
// scanned by many phones behind one carrier NAT.
export const DEFAULT_RATE_LIMIT = readLimit(
  process.env.RATE_LIMIT_PER_MINUTE,
  300,
);

// Login and registration are the brute-force targets.
export const AUTH_RATE_LIMIT = readLimit(
  process.env.AUTH_RATE_LIMIT_PER_MINUTE,
  10,
);
