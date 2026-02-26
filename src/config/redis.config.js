const Redis = require("ioredis");

const { REDIS_URL } = require("./env.config");
const logger = require("./logger.config");

const redis = new Redis(REDIS_URL);
redis.on("connect", () => {
  logger.info("Redis connected...");
});

redis.on("error", (err) => {
  logger.error(`Redis error:${err.message}`);
});

module.exports = redis;
