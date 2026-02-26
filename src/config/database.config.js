const mongoose = require("mongoose");
const { MONGO_URI, NODE_ENV } = require("./env.config");
const logger = require("./logger.config");

module.exports = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: NODE_ENV !== "production",
    });
    logger.info("MongoDB connected...");
  } catch (error) {
    logger.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
