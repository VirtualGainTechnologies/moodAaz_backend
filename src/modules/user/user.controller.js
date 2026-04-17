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
  await authService.logout(req.user._id);

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

// PROFILE
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

// CONTACT 
exports.sendContactUpdateOtp = async (req, res) => {
  const { type, value } = req.body;

  const result = await profileService.sendContactUpdateOtp(
    req.user._id,
    type,
    value,
    req.country || "IN"
  );

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};

exports.verifyContactUpdateOtp = async (req, res) => {
  const { type, value, otpId, otp } = req.body;

  const user = await profileService.verifyContactUpdateOtp(
    req.user._id,
    type,
    value,
    otpId,
    otp,
    req.country || "IN"
  );

  res.status(200).json({
    message: "Contact verified successfully",
    error: false,
    data: {
      _id: user._id,
      id: user._id,
      role: user.role,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone,
      email: user.email || "",
      gender: user.gender || "",
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
    },
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