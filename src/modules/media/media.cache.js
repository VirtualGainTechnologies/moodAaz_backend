const cache = require("../../cache");

const mediaCache = (type) => {
  switch (type) {
    case "LIST": {
      const key = (mediaType) =>
        `media:list:${mediaType ? mediaType.toUpperCase() : "all"}`;
      const TTL = cache.TTL.MEDIA_LIST;

      return {
        get: (mediaType) => cache.get(key(mediaType)),
        set: (mediaType, data) => cache.set(key(mediaType), data, TTL),
        invalidate: (mediaType) => {
          cache.delete(`media:list:${mediaType.toUpperCase()}`);
          cache.delete(`media:list:all`);
        },
      };
    }
    default:
      throw new Error(`Invalid media cache type: "${type}"`);
  }
};

// INVALIDATION
mediaCache.invalidateAll = () => cache.delByPattern(`media:*`);

module.exports = mediaCache;
