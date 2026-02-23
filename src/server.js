require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config");
const { logger } = require("./utils/winstonLogger");
const { PORT } = require("./config/env");

// bootstrap
(async () => {
  try {
    // connect to MongoDB
    await connectDB();

    // start server
    const server = app.listen(PORT, () => {
      console.log(`App is running on port ${PORT}...`);
    });

    // process handlers
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION 💥 Shutting down...");
      logger.error(err.name, err.message);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on("warning", (e) => console.warn(e.stack));

    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION 💥 Shutting down...");
      logger.error(err.name, err.message);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM RECEIVED. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated!");
      });
    });
  } catch (err) {
    logger.error("Server bootstrap failed:", err);
    process.exit(1);
  }
})();
