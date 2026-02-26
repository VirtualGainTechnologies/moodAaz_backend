const AppError = require("../utils/app-error");

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Access denied"));
    }
    next();
  };
};
