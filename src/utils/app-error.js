class AppError {
  constructor(statusCode, message, errorCode = "", error = true, data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.error = error;
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
