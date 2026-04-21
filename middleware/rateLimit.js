const buckets = new Map();

function rateLimit({ windowMs, maxRequests }) {
  return function rateLimitMiddleware(req, res, next) {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const currentBucket = buckets.get(key);

    if (!currentBucket || now - currentBucket.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (currentBucket.count >= maxRequests) {
      res.status(429).render('error', {
        title: 'Too many requests',
        pageDescription: 'Please wait a moment before submitting again.',
        message: 'Please wait a moment before submitting again.',
      });
      return;
    }

    currentBucket.count += 1;
    next();
  };
}

module.exports = {
  rateLimit,
};
