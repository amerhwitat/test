export function createRateLimiter({ maxKeys = 10000, cleanupEvery = 256, clock = Date.now } = {}) {
  if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) throw new TypeError("maxKeys must be a positive integer");
  if (!Number.isSafeInteger(cleanupEvery) || cleanupEvery < 1) throw new TypeError("cleanupEvery must be a positive integer");
  const buckets = new Map();
  let operations = 0;

  function cleanup(now) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.start >= bucket.windowMs) buckets.delete(key);
    }
  }

  function allow(key, limit = 30, windowMs = 60000) {
    if (typeof key !== "string" || !key || !Number.isSafeInteger(limit) || limit < 1 ||
        !Number.isSafeInteger(windowMs) || windowMs < 1) return false;
    const now = clock();
    if (++operations % cleanupEvery === 0) cleanup(now);
    let bucket = buckets.get(key);
    if (bucket && now - bucket.start >= windowMs) {
      bucket = { start: now, count: 1, windowMs };
      buckets.set(key, bucket);
      return true;
    }
    if (!bucket) {
      if (buckets.size >= maxKeys) {
        cleanup(now);
        if (buckets.size >= maxKeys) return false;
      }
      buckets.set(key, { start: now, count: 1, windowMs });
      return true;
    }
    bucket.count += 1;
    return bucket.count <= limit;
  }

  allow.delete = key => buckets.delete(key);
  allow.clear = () => buckets.clear();
  allow.size = () => buckets.size;
  return allow;
}
