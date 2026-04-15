const service = require("./user.service");
const AppError = require("../../utils/app-error");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");

exports.initiateAuthentication = async (req, res) => {
  const result = await service.initiateAuthentication({
    ...req.body,
    country: req.country || "IN",
  });
  if (!result) {
    throw new AppError(400, "Failed to send otp");
  }
  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};

exports.verifyAuthentication = async (req, res) => {
  const result = await service.verifyAuthentication({
    ...req.body,
    country: req.country || "IN",
  });
  if (!result) {
    throw new AppError(400, "Failed to verify otp");
  }
  const { token, authType } = result;

  res.cookie("user_token", token, {
    httpOnly: false,
    secure: "auto",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS * 1,
    signed: true,
    sameSite: "strict",
  });

  delete result.token;

  res.status(200).json({
    message: `${authType == "REGISTER" ? "Registration" : "Login"} successful`,
    error: false,
    data: {
      ...result,
      isAuthenticated: true,
    },
  });
};

exports.checkAuth = async (req, res) => {
  const isAuthenticated = await service.checkAuth(req);
  res.status(200).json({
    message: "User is authenticated",
    error: false,
    data: {
      isAuthenticated,
    },
  });
};

exports.logout = async (req, res) => {
  const userId = req?.user?._id;
  const result = await service.logout(userId);
  if (!result) {
    throw new AppError(400, "Logout failed");
  }

  res.clearCookie("user_token");
  res.status(200).json({
    message: "Logout successful",
    error: false,
    data: {
      isAuthenticated: false,
    },
  });
};
