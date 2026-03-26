const cache = require("../../cache");

const reviewCache = (type) => {
  switch (type) {
    case "RATINGS": {
      const key = (productId) => `reviews:ratings:${productId}`;
      const TTL = cache.TTL.REVIEW_RATINGS;
      return {
        get: (productId) => cache.get(key(productId)),
        set: (productId, data) => cache.set(key(productId), data, TTL),
        invalidate: (productId) => cache.del(key(productId)),
      };
    }
    default:
      throw new Error(`Invalid review cache type: "${type}"`);
  }
};

// INVALIDATION
reviewCache.invalidateAll = () => cache.delByPattern(`reviews:*`);

module.exports = reviewCache;
