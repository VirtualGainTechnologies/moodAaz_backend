const AppError = require("../../utils/AppError");
const { getAdminByFilter } = require("../../services/admin/authServices");
const { verifyJwtToken } = require("../../utils/jwt");

exports.verifyAdminToken = async (req, res, next) => {
  const token = req.signedCookies["admin_token"];

  if (!token) {
    throw new AppError(401, "Token is missing", "UNAUTHORISED");
  }

  // verify token
  const tokenData = verifyJwtToken(token);

  if (tokenData.error) {
    throw new AppError(401, tokenData.message, "UNAUTHORISED");
  }

  const adminResult = await getAdminByFilter(
    { token },
    "_id email role status",
    {
      lean: true,
    }
  );

  if (!adminResult) {
    throw new AppError(401, "Data not found", "UNAUTHORISED");
  }

  if (adminResult.status === "BLOCKED") {
    throw new AppError(400, "temporarily blocked, reset password to login");
  }

  req.adminId = adminResult._id;
  req.email = adminResult.email;
  req.phoneCode = adminResult.phone_code;
  req.phone = adminResult.phone;
  req.role = adminResult.role;
  next();
};
