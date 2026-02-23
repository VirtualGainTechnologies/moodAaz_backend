const mongoose = require("mongoose");
const { MONGO_URI, NODE_ENV } = require("./env");

module.exports = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: NODE_ENV !== "production",
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
