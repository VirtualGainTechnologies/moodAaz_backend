const cache = require("../../cache");

const orderCache = (type) => {
  switch (type) {
    case "USER_LIST": {
      const key = (user_id, query = {}) => {
        const sorted = new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== null)
            .sort(([a], [b]) => a.localeCompare(b)),
        ).toString();
        return `orders:user:${user_id}:${sorted || "all"}`;
      };
      const TTL = cache.TTL.ORDER_USER_LIST;
      const pattern = (user_id) => `orders:user:${user_id}:*`;

      return {
        get: (user_id, query) => cache.get(key(user_id, query)),
        set: (user_id, query, data) =>
          cache.set(key(user_id, query), data, TTL),
        invalidate: (user_id) => cache.delByPattern(pattern(user_id)),
      };
    }

    case "DETAIL": {
      const key = (order_id) => `orders:detail:${order_id.toString()}`;
      const TTL = cache.TTL.ORDER_DETAIL;
      return {
        get: (order_id) => cache.get(key(order_id)),
        set: (order_id, data) => cache.set(key(order_id), data, TTL),
        invalidate: (order_id) => cache.del(key(order_id)),
      };
    }

    case "ADMIN_LIST": {
      const key = (query = {}) => {
        const sorted = new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== null)
            .sort(([a], [b]) => a.localeCompare(b)),
        ).toString();
        return `orders:admin:list:${sorted || "all"}`;
      };
      const TTL = cache.TTL.ORDER_ADMIN_LIST;
      const pattern = `orders:admin:list:*`;

      return {
        get: (query) => cache.get(key(query)),
        set: (query, data) => cache.set(key(query), data, TTL),
        invalidate: () => cache.delByPattern(pattern),
      };
    }

    default:
      throw new Error(`Invalid order cache type: "${type}"`);
  }
};

orderCache.invalidateOnOrderPlace = (user_id) => {
  orderCache("USER_LIST").invalidate(user_id);
  orderCache("ADMIN_LIST").invalidate();
};

orderCache.invalidateOnOrderUpdate = (user_id, order_id) => {
  orderCache("USER_LIST").invalidate(user_id);
  orderCache("DETAIL").invalidate(order_id);
  orderCache("ADMIN_LIST").invalidate();
};

orderCache.invalidateAll = () => cache.delByPattern(`orders:*`);

module.exports = orderCache;
