const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const retry = require("async-retry");

const AppError = require("./app-error");
const {
  commitWithRetry,
  isTransientError,
} = require("./transaction-retry.util");
const { logger } = require("../config");

exports.catchAsync = (fnName, fn) => {
  return async (req, res, next) => {
    try {
      const { errors } = validationResult(req);
      if (errors.length > 0) {
        throw new AppError(400, errors[0].msg || "Bad request");
      }

      await fn(req, res, next);
    } catch (err) {
      logger.error(`Error in catch block of ${fnName} ===> ${err.message}`);
      next(errorHandler(err));
    }
  };
};

exports.catchAsyncWithSession = (fnName, fn) => {
  return async (req, res, next) => {
    await retry(
      async (bail, attempt) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const { errors } = validationResult(req);
          if (errors.length > 0) {
            throw new AppError(400, errors[0].msg || "Bad request");
          }

          let result = await fn(req, session);

          const isProduction = process.env.NODE_ENV === "PRODUCTION";

          if (result?.data?.jwtToken) {
            res.cookie(
              result.data.jwtToken.tokenName,
              result.data.jwtToken.token,
              {
                // httpOnly: false,
                // secure: "auto",
                // maxAge: process.env.COOKIE_EXPIRATION_MILLISECONDS * 1,
                // signed: true,
                // sameSite: "strict",

                httpOnly: false, // or true if you don’t need JS access
                secure: isProduction, // must be true for HTTPS in production
                signed: true,
                sameSite: isProduction ? "none" : "lax", // 'none' for cross-site in prod, 'lax' for localhost
                maxAge: Number(process.env.COOKIE_EXPIRATION_MILLISECONDS),
              },
            );
            delete result.data.jwtToken;
          }

          await commitWithRetry(session);
          res.status(200).json(result);
        } catch (err) {
          logger.error(
            `Error in catch block of ${fnName} ===> ${JSON.stringify(err)}`,
          );
          if (session.inTransaction()) await session.abortTransaction();

          if (isTransientError(err)) {
            logger.info(`Attempt ${attempt} failed → retrying...`);
            throw err;
          } else {
            bail(err);
          }
        } finally {
          session.endSession();
        }
      },
      {
        retries: 5,
        factor: 2,
        minTimeout: 100,
        maxTimeout: 2000,
        randomize: true,
      },
    ).catch(next);
  };
};

const errorHandler = (err) => {
  let errObject = {
    statusCode: err.statusCode,
    message: err.message || "Internal server error",
    error: true,
    errorCode: err.errorCode || "",
    data: null,
    isOperational: true,
    completeErr: err?.isOperational ? null : err,
    stack: err?.stack || "",
  };

  if (isTransientError(err)) {
    errObject = { ...errObject, statusCode: 504, message: "Execution failed" };
  } else if (err.name === "AxiosError") {
    if (err?.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errObject = {
        ...errObject,
        statusCode: err?.response?.status || 400,
        message:
          err?.response?.data?.title ||
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.response?.data?.errors[0]?.reason ||
          "Axios error occured in response",
        data:
          err?.response?.data?.error ||
          err?.response?.data?.errors ||
          err?.response?.data ||
          null,
      };
    } else if (err?.request) {
      // The request was made but no response was received
      // error.request is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      errObject = {
        ...errObject,
        statusCode: 400,
        message: "Axios error occured request",
        data: err?.request,
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      errObject = {
        ...errObject,
        statusCode: 400,
        message: err?.message || "Axios error occured request",
        data: null,
      };
    }
  }

  return errObject;
};
