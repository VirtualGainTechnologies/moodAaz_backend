const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");
const AppError = require("../../utils/AppError");
const service = require("./admin.service");

exports.registerSuperAdmin = async (req, res) => {
  const result = await service.registerSuperAdmin(req.body, {
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
  const result = await service.upsertSubAdmin(req.body, {
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
  const result = await service.sendLoginOtp(req.body);
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
  const result = await service.verifyLoginOtp(req.body);
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

exports.logout = async (req, res) => {
  const token = req.signedCookies["admin_token"];
  const result = await service.logout(token);
  if (!result) {
    throw new AppError(400, "Logout failed");
  }
  
  res.clearCookie("token");

  res.status(200).json({
    message: "Logged out successfully",
    error: false,
    data: null,
  });
};
