const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const useragent = require("express-useragent");

const AppError = require("./utils/app-error");
const apiRoutes = require("./routes");
const {
  logger,
  env: { NODE_ENV, CLIENT_BASE_URL1, CLIENT_BASE_URL2, COOKIE_SIGNING_SECRET },
} = require("./config");
const { errorHandler } = require("./middlewares");

// app
const app = express();
app.set("trust proxy", true);
app.disable("etag");
logger.info(`Running environment: ${NODE_ENV}`);

// global middlewares
app.use(helmet());
app.use(
  compression({
    level: 6,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(
  cors({
    origin: [CLIENT_BASE_URL1, CLIENT_BASE_URL2].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ limit: "3mb", extended: true }));
app.use(cookieParser(COOKIE_SIGNING_SECRET));
app.use(useragent.express());

// routes
app.use("/api/v1", apiRoutes);

// path not found
app.use((req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server`));
});

// error handler
app.use(errorHandler);

module.exports = app;
