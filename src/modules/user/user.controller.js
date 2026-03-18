const service = require("./user.service");
const AppError = require("../../utils/app-error");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");
const { sendEmailOtp, sendMobileOtp, verifyOtp } = require("../otp/otp.service");
const repo = require("./user.repository");

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
    signed: true,
    sameSite: "strict",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS * 1,
  });

  delete result.token;

  res.status(200).json({
    message: `${authType == "REGISTER" ? "Registration" : "Login"} successful`,
    error: false,
    data: result,
  });
};

exports.updateUser = async (req, res) => {
  const userId = req.user._id;
  const updatePayload = req.body;

  const result = await service.updateUser(userId, updatePayload);
  if (!result) {
    throw new AppError(400, "Failed to update user");
  }

  res.status(200).json({
    message: "User updated successfully",
    error: false,
    data: result,
  });
};

exports.initiateContactUpdate = async (req, res) => {
  const { email, phone, phone_code } = req.body;

  if ((email && phone) || (!email && !phone)) {
    throw new AppError(400, "Provide either email or phone, not both");
  }

  let result;

  const otpType = "login"; 

  if (email) {
    result = await sendEmailOtp(email, otpType);
    if (!result) throw new AppError(400, "Failed to send OTP to email");
  } else if (phone) {
    if (!phone_code) throw new AppError(400, "Phone code is required");
    result = await sendMobileOtp(phone_code, phone, otpType);
    if (!result) throw new AppError(400, "Failed to send OTP to phone");
  }

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};

exports.verifyContactUpdate = async (req, res) => {
  const { email, phone, phone_code, otpId, otp } = req.body;

  if ((email && phone) || (!email && !phone)) {
    throw new AppError(400, "Provide either email or phone, not both");
  }

  const otpType = "update_contact";

  const verified = await verifyOtp(otpId, otp, otpType);
  if (!verified) throw new AppError(400, "Failed to verify OTP");

  let updateData = {};
  if (email) {
    updateData.email = email;
    updateData.email_verified = true;
  } else if (phone) {
    if (!phone_code) throw new AppError(400, "Phone code is required");
    updateData.phone = phone;
    updateData.phone_code = phone_code;
    updateData.phone_verified = true;
  }

  const updatedUser = await repo.updateById(req.user._id, updateData, { new: true });
  if (!updatedUser) throw new AppError(400, "Failed to update user contact");

  res.status(200).json({
    message: email ? "Email updated successfully" : "Phone updated successfully",
    error: false,
    data: updatedUser,
  });
};