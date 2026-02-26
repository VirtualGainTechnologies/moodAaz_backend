const AppError = require("../utils/app-error");

const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err?.statusCode || 500;
  err.message = err?.message || "Internal Server Error!";
  err.errorCode = err?.errorCode || "";
  err.data = err?.data || null;

  if (process.env.NODE_ENV === "DEVELOPMENT") {
    sendErrDev(err, res);
  }

  if (process.env.NODE_ENV === "PRODUCTION") {
    let error = { ...err };

    // handling invalid database id
    if (error.name === "CastError") error = handleCastErrDB(error);

    // handling duplicate database fields i.e mongoose duplicate fields error
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // handling mongoose validation errors
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendErrProd(error, res);
  }
};

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    message: err.message,
    error: true,
    errorCode: err.errorCode,
    data: err.data || null,
    completeErr: err.completeErr || null,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  // operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode * 1).json({
      statusCode: err.statusCode,
      message: err.message,
      error: true,
      errorCode: err.errorCode,
      data: err.data || null,
    });
  } else {
    // programming or other unknown error: don't leak error details
    res.status(500).json({
      statusCode: err.statusCode || 500,
      message: err.message || "Something went wrong!",
      error: true,
      errorCode: err.errorCode || "",
      data: err.data || null,
    });
  }
};

const handleCastErrDB = (err) => {
  return new AppError(400, `Invalid ${err.path}:${err.value}!`);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/[^{\}]+(?=})/g)[0];
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(400, message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input : ${errors.join(". ")}`;
  return new AppError(400, message);
};

module.exports = globalErrorHandler;
