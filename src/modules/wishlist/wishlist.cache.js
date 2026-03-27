const cache = require("../../cache");

const wishlistCache = (type) => {
  switch (type) {
    case "WISHLIST": {
      const key = (userId) => `wishlist:${userId}`;
      const TTL = cache.TTL.WISHLIST;
      return {
        get: (userId) => cache.get(key(userId)),
        set: (userId, data) => cache.set(key(userId), data, TTL),
        invalidate: (userId) => cache.del(key(userId)),
      };
    }
    default:
      throw new Error(`Invalid wishlist cache type: "${type}"`);
  }
};

// INVALIDATION
wishlistCache.invalidateAll = () => cache.delByPattern(`wishlist:*`);

module.exports = wishlistCache;
