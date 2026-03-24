const cache = require("../../cache");

const productCache = (type) => {
  switch (type) {
    case "LIST": {
      const key = (query = {}) => {
        const sorted = new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== null)
            .sort(([a], [b]) => a.localeCompare(b)),
        ).toString();
        return `products:list:${sorted}`;
      };
      const TTL = cache.TTL.PRODUCT_LIST;
      const pattern = `products:list:*`;

      return {
        get: (query) => cache.get(key(query)),
        set: (query, data) => cache.set(key(query), data, TTL),
        invalidate: () => cache.delByPattern(pattern),
      };
    }

    case "DETAILS": {
      const key = (id) => `products:detail:${id.toString()}`;
      const TTL = cache.TTL.PRODUCT_DETAIL;

      return {
        get: (id) => cache.get(key(id)),
        set: (id, data) => cache.set(key(id), data, TTL),
        invalidate: (id) => cache.del(key(id)),
      };
    }

    default:
      throw new Error(`Invalid cache type: "${type}"`);
  }
};

// INVALIDATION
productCache.invalidateAll = () => cache.delByPattern(`products:*`);

module.exports = productCache;
