module.exports = {
  env: require("./env.config"),
  connectDB: require("./database.config"),
  redis: require("./redis.config"),
  logger: require("./logger.config"),
  s3: require("./s3.config"),
};