module.exports = {
  env: require("./env"),
  connectDB: require("./database"),
  redis: require("./redis"),
  s3: require("./aws"),
};
