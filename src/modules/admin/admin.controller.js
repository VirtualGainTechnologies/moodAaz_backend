const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env.config");
const AppError = require("../../utils/app-error");
const authService = require("./admin.auth.service");
const passwordService = require("./admin.password.service");

// AUTH
exports.registerSuperAdmin = async (req, res) => {
  const result = await authService.registerSuperAdmin(req.body, {
    ip: req.ipAddress,
    location: req.locationDetails,
  });

  if (!result) {
    throw new AppError(400, "Registration failed");
  }

  res.cookie("admin_token", result.token, {
    httpOnly: false,
    secure: "auto",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS * 1,
    signed: true,
    sameSite: "strict",
  });

  res.status(200).json({
    message: "Registration successful",
    error: false,
    data: null,
  });
};

exports.upsertSubAdmin = async (req, res) => {
  const { userId } = req.body;
  const result = await authService.upsertSubAdmin(req.body, {
    ip: req.ipAddress,
    location: req.locationDetails,
  });

  if (!result) {
    throw new AppError(
      400,
      `Failed to ${userId ? "update" : "register"} admin`,
    );
  }

  res.status(200).json({
    message: userId
      ? "Admin profile updated successfully"
      : "Registration successful",
    error: false,
    data: {
      user_name: result?.user_name,
      phone_code: result?.phone_code,
      phone: result?.phone,
      email: result?.email,
      role: result?.role,
    },
  });
};

exports.sendLoginOtp = async (req, res) => {
  const result = await authService.sendLoginOtp(req.body);
  if (!result) {
    throw new AppError(400, "Failed to send otp");
  }

  res.status(200).json({
    message: "OTP sent to email",
    error: false,
    data: result,
  });
};

exports.verifyLoginOtp = async (req, res) => {
  const result = await authService.verifyLoginOtp(req.body);
  if (!result) {
    throw new AppError(400, "Failed to verify otp");
  }

  res.cookie("admin_token", result.token, {
    httpOnly: false,
    secure: "auto",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS * 1,
    signed: true,
    sameSite: "strict",
  });

  delete result.token;

  res.status(200).json({
    message: "Login successful",
    error: false,
    data: result,
  });
};

exports.getAdminProfile = async (req, res) => {
  const adminId = req?.user?._id;
  const result = await authService.getAdminProfile(adminId);
  if (!result) {
    throw new AppError(400, "Failed to fetch admin profile");
  }
  res.status(200).json({
    message: "Admin profile retrieved successfully",
    error: false,
    data: result,
  });
};

exports.getAllSubAdmins = async (req, res) => {
  const result = await authService.getAllSubAdmins(req.query);
  if (!result) {
    throw new AppError(400, "Failed to fetch admins");
  }
  const { totalRecords, data } = result[0];

  res.status(200).json({
    message: "Sub-admins retrieved successfully",
    error: false,
    data: {
      totalRecords,
      result: data,
    },
  });
};

exports.logout = async (req, res) => {
  const adminId = req?.user?._id;
  const result = await authService.logout(adminId);
  if (!result) {
    throw new AppError(400, "Logout failed");
  }

  res.clearCookie("admin_token");

  res.status(200).json({
    message: "Logged out successfully",
    error: false,
    data: null,
  });
};

// PASSWORD
exports.sendForgotPasswordOtp = async (req, res) => {
  const result = await passwordService.sendForgotPasswordOtp(req.body);
  if (!result) {
    throw new AppError(400, "Failed to send OTP");
  }

  res.status(200).json({
    message: "OTP has been sent",
    error: false,
    data: result,
  });
};

exports.verifyForgotPasswordOtp = async (req, res) => {
  const result = await passwordService.verifyForgotPasswordOtp(req.body);
  if (!result) {
    throw new AppError(400, "Failed to verify OTP");
  }

  res.status(200).json({
    message: "OTP verified successfully",
    error: false,
    data: null,
  });
};

exports.resetForgotPassword = async (req, res) => {
  const result = await passwordService.resetForgotPassword(req.body, {
    ip: req.ipAddress,
    location: req.locationDetails,
  });
  if (!result) {
    throw new AppError(400, "Failed to reset password");
  }

  res.status(200).json({
    message: "Password changed successfully",
    error: false,
    data: null,
  });
};
