// const { createClient } = require("redis");
// const AppError = require("./AppError");

// const redisClient = createClient({
//   url: process.env.REDIS_URL,
// });

// (async () => {
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }
// })();

// console.log("Connecting to the Redis...");

// redisClient.on("ready", () => {
//   console.log("Redis server connected!");
// });

// redisClient.on("error", (err) => {
//   console.log("Error in the redis server connection", err);
// });

// // function to set different Redis commands
// const setRedis = async (command, ...args) => {
//   try {
//     let result;
//     switch (command) {
//       case "SET":
//         result = await redisClient.set(...args);
//         break;

//       case "SETEX":
//         result = await redisClient.setEx(...args);
//         break;

//       case "HSET":
//         result = await redisClient.hSet(...args);
//         break;

//       case "HMSET":
//         result = await redisClient.hmSet(...args);
//         break;

//       default:
//         throw new Error(`Unsupported command: ${command}`);
//     }
//     return result;
//   } catch (err) {
//     throw new AppError(400, `Error executing ${command} command:`, err);
//   }
// };

// // function to get different Redis commands
// const getRedis = async (command, ...args) => {
//   try {
//     let result;
//     switch (command) {
//       case "GET":
//         result = await redisClient.get(...args);
//         break;

//       case "HGET":
//         result = await redisClient.hGet(...args);
//         break;

//       case "HGETALL":
//         result = await redisClient.hGetAll(...args);
//         break;

//       case "LRANGE":
//         result = await redisClient.lRange(...args);
//         break;

//       default:
//         throw new Error(`Unsupported command: ${command}`);
//     }
//     return result;
//   } catch (err) {
//     throw new AppError(400, `Error executing ${command} command:`, err);
//   }
// };

// module.exports = { getRedis, setRedis };

const { Redis } = require("ioredis");
const Redlock = require("redlock").default;

const { logger } = require("./winstonLogger");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis Connection
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    if (err.message.includes("READONLY")) {
      logger.warn("Redis is READONLY, reconnecting...");
      return true;
    }
    return false;
  },
  tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("ready", () => logger.info("Redis ready"));
redis.on("reconnecting", () => logger.warn("Redis reconnecting..."));
redis.on("close", () => logger.warn("Redis connection closed"));
redis.on("error", (err) => logger.error("Redis Error: " + err.message));

// Redlock Instance
const redlock = new Redlock(
  [redis], // HA: pass multiple redis nodes if using cluster
  {
    driftFactor: 0.01,
    retryCount: 8,
    retryDelay: 400,
    retryJitter: 200,
  }
);

// Redis Commands
const setRedis = async (command, ...args) => {
  switch (command.toUpperCase()) {
    case "SET":
      return redis.set(...args);
    case "SETEX":
      return redis.setex(...args);
    case "HSET":
      return redis.hset(...args);
    case "HMSET":
      return redis.hmset(...args);
    default:
      throw new Error(`Unsupported Redis command: ${command}`);
  }
};

const getRedis = async (command, ...args) => {
  switch (command.toUpperCase()) {
    case "GET":
      return redis.get(...args);
    case "HGET":
      return redis.hget(...args);
    case "HGETALL":
      return redis.hgetall(...args);
    case "LRANGE":
      return redis.lrange(...args);
    default:
      throw new Error(`Unsupported Redis command: ${command}`);
  }
};

module.exports = { redis, setRedis, getRedis, redlock };
