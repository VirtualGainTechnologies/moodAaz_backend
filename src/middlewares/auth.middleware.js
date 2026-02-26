const { verifyJwtToken } = require("../utils/jwt.util");
const AppError = require("../utils/app-error");
const adminRepo = require("../modules/admin/admin.repository");
const userRepo = require("../modules/user/user.repository");

module.exports = async (req, res, next) => {
  try {
    const token =
      req.signedCookies?.admin_token || req.signedCookies?.user_token;
    if (!token) {
      return next(new AppError(401, "Authentication required"));
    }

    const decoded = verifyJwtToken(token);
    if (decoded.error) {
      return next(new AppError(401, "Invalid or expired token"));
    }

    const authenticatedUser =
      decoded.data.type === "ADMIN"
        ? await adminRepo.findOne({ token }, "_id role", { lean: true })
        : await userRepo.findOne({ token }, "_id role", { lean: true });

    if (!authenticatedUser) {
      throw new AppError(401, "Session is expired, please login again");
    }

    req.user = authenticatedUser;
    req.auth = decoded.data;
    next();
  } catch (err) {
    next(err);
  }
};
