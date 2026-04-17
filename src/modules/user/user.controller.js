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

  const { token, ...safeResult } = result;

  res.cookie("user_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS,
    signed: true,
    sameSite: "strict",
  });

  res.status(200).json({
    message: `${result.authType === "REGISTER" ? "Registration" : "Login"} successful`,
    error: false,
    data: {
      ...safeResult,
      isAuthenticated: true,
    },
  });
};

exports.checkAuth = async (req, res) => {
  const isAuthenticated = await authService.checkAuth(req);

  res.status(200).json({
    success: true,
    message: isAuthenticated ? "Logged in" : "Not logged in",
    data: { isAuthenticated },
  });
};

exports.logout = async (req, res) => {
  const userId = req.user._id;

  await authService.logout(userId);

  res.clearCookie("user_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "strict",
  });

  res.status(200).json({
    message: "Logout successful",
    error: false,
    data: { isAuthenticated: false },
  });
};

// PROFILE (UNIFIED)
exports.updateProfile = async (req, res) => {
  const result = await profileService.updateBasicDetails(
    req.user._id,
    req.body
  );

  res.status(200).json({
    message: "Profile updated successfully",
    error: false,
    data: result,
  });
};

// EMAIL
exports.updateEmail = async (req, res) => {
  const result = await profileService.initiateEmailUpdate(
    req.user._id,
    req.body.email
  );

  res.status(200).json({
    message: "OTP sent to email",
    error: false,
    data: result,
  });
};

exports.verifyEmail = async (req, res) => {
  const result = await profileService.verifyEmailUpdate(
    req.user._id,
    req.body.otpId,
    req.body.otp,
    req.body.email
  );

  res.status(200).json({
    message: "Email verified successfully",
    error: false,
    data: result,
  });
};

// PHONE
exports.updatePhone = async (req, res) => {
  const result = await profileService.initiatePhoneUpdate(
    req.user._id,
    req.body.phone,
    req.country || "IN"
  );

  res.status(200).json({
    message: "OTP sent to phone",
    error: false,
    data: result,
  });
};

exports.verifyPhone = async (req, res) => {
  const result = await profileService.verifyPhoneUpdate(
    req.user._id,
    req.body.otpId,
    req.body.otp,
    req.body.phone,
    req.country || "IN"
  );

  res.status(200).json({
    message: "Phone verified successfully",
    error: false,
    data: result,
  });
};

// ADDRESS
exports.addAddress = async (req, res) => {
  const result = await profileService.addAddress(
    req.user._id,
    req.body
  );

  res.status(200).json({
    message: "Address added successfully",
    error: false,
    data: result,
  });
};

exports.updateAddress = async (req, res) => {
  const result = await profileService.updateAddress(
    req.user._id,
    req.body
  );

  res.status(200).json({
    message: "Address updated successfully",
    error: false,
    data: result,
  });
};