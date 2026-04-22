const authService = require("./auth.service");
const profileService = require("./profile.service");
const AppError = require("../../utils/app-error");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");

// AUTH
exports.initiateAuthentication = async (req, res) => {
  const result = await authService.initiateAuthentication({
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
  const result = await authService.verifyAuthentication({
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
  const isAuthenticated = await authService.checkAuth(req);
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
  const result = await authService.logout(userId);
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

// PROFILE
exports.getUserProfile = async (req, res) => {
  const user = await profileService.getUserProfile(req.user._id);
  if (!user) {
    throw new AppError(400, "Failed to get user profile");
  }

  const isProfileIncomplete =
    !user?.first_name || !user?.last_name || !user?.email || !user?.phone;

  res.status(200).json({
    message: isProfileIncomplete
      ? "Please complete your profile details first"
      : "User profile fetched successfully",
    error: false,
    data: user,
  });
};

exports.updateUserProfile = async (req, res) => {
  const user = await profileService.updateUserProfile({
    userId: req.user._id,
    ...req.body,
  });

  res.status(200).json({
    message: !user.email_verified
      ? "Please verify your email"
      : !user.phone_verified
        ? "Please verify your phone"
        : "Profile updated successfully",
    error: false,
    data: user,
  });
};

exports.sendContactUpdateOtp = async (req, res) => {
  const { type, value } = req.body;
  const result = await profileService.sendContactUpdateOtp({
    userId: req.user._id,
    type,
    value,
    country: req.country || "IN",
  });

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: {
      otpId: result.otpId,
      type,
      value,
    },
  });
};

exports.verifyContactUpdateOtp = async (req, res) => {
  const { type, value, otpId, otp } = req.body;

  const user = await profileService.verifyContactUpdateOtp({
    userId: req.user._id,
    type,
    value,
    otpId,
    otp,
    country: req.country || "IN",
  });

  res.status(200).json({
    message: "Contact verified successfully",
    error: false,
    data: user,
  });
};
