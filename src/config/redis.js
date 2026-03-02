const Redis = require("ioredis");

const { REDIS_URL } = require("./env");
const logger = require("../utils/logger");

const redis = new Redis(REDIS_URL);
redis.on("connect", () => {
  logger.info("Redis connected...");
});

redis.on("error", (err) => {
  logger.error(`Redis error:${err.message}`);
});

module.exports = redis;
