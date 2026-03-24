const redis = require("../config/redis");
const logger = require("../utils/logger");
const { TTL } = require("./ttl");
const { CACHE_ENABLED } = require("../config/env");

const get = async (key) => {
  if (!CACHE_ENABLED) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error("Cache get error:", err);
    return null;
  }
};

const set = async (key, value, ttl) => {
  if (!CACHE_ENABLED) return null;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.error("Cache set error:", err);
  }
};

const del = async (...keys) => {
  if (!CACHE_ENABLED) return;
  try {
    await redis.del(keys);
  } catch (err) {
    logger.error("Cache del error:", err);
  }
};

// safe pattern delete using SCAN — never use KEYS in production
const delByPattern = async (pattern) => {
  if (!CACHE_ENABLED) return;
  try {
    let cursor = 0;
    do {
      const { cursor: next, keys } = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = next;
      if (keys.length > 0) await redis.del(keys);
    } while (cursor !== 0);
  } catch (err) {
    logger.error("Cache delByPattern error:", err);
  }
};

module.exports = { get, set, del, delByPattern, TTL };
