const authService = require("./auth.service");
const profileService = require("./profile.service");
const AppError = require("../../utils/app-error");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");

// SAFE USER ID HELPER
const getUserId = (req) => {
  if (!req.user || !req.user._id) {
    throw new AppError(401, "Unauthorized");
  }
  return req.user._id;
};

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
  const userId = getUserId(req);

  await authService.logout(userId);

  res.clearCookie("user_token");

  res.status(200).json({
    message: "Logout successful",
    error: false,
    data: { isAuthenticated: false },
  });
};

// PROFILE (EMAIL / PHONE / ADDRESS)

// 1. EMAIL INITIATE
exports.updateEmail = async (req, res) => {
  const result = await profileService.initiateEmailUpdate(
    getUserId(req),
    req.body.email
  );

  res.status(200).json({
    message: "OTP sent to email",
    error: false,
    data: result,
  });
};

// 2. EMAIL VERIFY
exports.verifyEmail = async (req, res) => {
  const result = await profileService.verifyEmailUpdate(
    getUserId(req),
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

// 3. PHONE INITIATE
exports.updatePhone = async (req, res) => {
  const result = await profileService.initiatePhoneUpdate(
    getUserId(req),
    req.body.phone,
    req.country || "IN"
  );

  res.status(200).json({
    message: "OTP sent to phone",
    error: false,
    data: result,
  });
};

// 4. PHONE VERIFY
exports.verifyPhone = async (req, res) => {
  const result = await profileService.verifyPhoneUpdate(
    getUserId(req),
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

// 5. ADD ADDRESS
exports.addAddress = async (req, res) => {
  const result = await profileService.addAddress(
    getUserId(req),
    req.body
  );

  res.status(200).json({
    message: "Address added successfully",
    error: false,
    data: result,
  });
};

// 6. UPDATE ADDRESS
exports.updateAddress = async (req, res) => {
  const result = await profileService.updateAddress(
    getUserId(req),
    req.body
  );

  res.status(200).json({
    message: "Address updated successfully",
    error: false,
    data: result,
  });
};

// 7. ADD BASIC DETAILS
exports.addBasicDetails = async (req, res) => {
  const result = await profileService.addBasicDetails(
    getUserId(req),
    req.body
  );

  res.status(200).json({
    message: "Details added successfully",
    error: false,
    data: result,
  });
};

// 8. UPDATE BASIC DETAILS
exports.updateBasicDetails = async (req, res) => {
  const result = await profileService.updateBasicDetails(
    getUserId(req),
    req.body
  );

  res.status(200).json({
    message: "Details updated successfully",
    error: false,
    data: result,
  });
};