const cache = require("../../cache");

const cartCache = (type) => {
  switch (type) {
    case "CART": {
      const key = (userId) => `cart:${userId}`;
      const TTL = cache.TTL.CART;
      return {
        get: (userId) => cache.get(key(userId)),
        set: (userId, data) => cache.set(key(userId), data, TTL),
        invalidate: (userId) => cache.del(key(userId)),
      };
    }
    default:
      throw new Error(`Invalid cart cache type: "${type}"`);
  }
};

// INVALIDATION
cartCache.invalidateAll = () => cache.delByPattern(`cart:*`);

module.exports = cartCache;
