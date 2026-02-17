const mongoose = require("mongoose");
const retry = require("async-retry");

const { logger } = require("../../utils/winstonLogger");

exports.commitWithRetry = async (session) => {
  await retry(
    async (bail) => {
      try {
        if (session.inTransaction()) {
          await session.commitTransaction();
          logger.info("Transaction committed");
        }
      } catch (err) {
        if (err.hasErrorLabel("UnknownTransactionCommitResult")) {
          logger.info("UnknownTransactionCommitResult → retrying commit...");
          throw err;
        }
        bail(err);
      }
    },
    {
      retries: 5,
      factor: 2, // exponential backoff (1000, 2000, 4000... ms)
      minTimeout: 1000, // first retry delay = 1s
      maxTimeout: 8000, // cap retries at 8s
      randomize: true,
    }
  );
};

exports.isTransientError = (error) => {
  if (!error) return false;

  // --- Check MongoDB server error labels ---
  if (
    error.name === "MongoServerError" &&
    typeof error.hasErrorLabel === "function"
  ) {
    if (
      error.hasErrorLabel("TransientTransactionError") ||
      error.hasErrorLabel("UnknownTransactionCommitResult") ||
      error.hasErrorLabel("RetryableWriteError")
    ) {
      return true;
    }
  }

  // --- Check for MongoDB network/server selection errors ---
  if (
    error instanceof mongoose.Error.MongooseServerSelectionError ||
    error.name === "MongoNetworkError"
  ) {
    return true;
  }

  // --- Check for specific MongoDB error codes ---
  if (error.name === "MongoServerError" && error.code) {
    const transientCodes = new Set([
      6, // HostUnreachable
      7, // HostNotFound
      89, // NetworkTimeout
      91, // ShutdownInProgress
      189, // PrimarySteppedDown
      10107, // NotWritablePrimary
      13388, // NotMasterOrSecondary (legacy)
      13435, // NotPrimaryNoSecondaryOk
      13436, // NotPrimaryOrSecondary
      112, // WriteConflict
    ]);
    if (transientCodes.has(error.code)) {
      return true;
    }
  }

  // --- Check WriteConflict errors ---
  if (
    error?.name === "MongoServerError" &&
    (error.code === 112 ||
      error.hasErrorLabel?.("TransientTransactionError") ||
      error.message?.toLowerCase().includes("write conflict"))
  ) {
    return true;
  }

  // --- Check for common Node.js network error codes ---
  const nodeNetworkErrors = new Set([
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
  ]);
  if (nodeNetworkErrors.has(error.code)) {
    return true;
  }
  return false;
};

exports.runTxnWithRetry = async (fn) => {
  await retry(
    async (bail, attempt) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await fn(session);
      } catch (err) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        if (this.isTransientError(err)) {
          console.log(`Attempt ${attempt} failed → retrying...`);
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
    }
  );
};
