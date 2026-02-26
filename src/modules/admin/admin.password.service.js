const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Admin = require("./admin.model");
const AppError = require("../../utils/AppError");
const {sendEmailOtp, sendMobileOtp, verifyOtp } = require("../../modules/otp/otp.service");

  
exports.forgotPasswordSendOtp = async ({ mode, email, phone, phoneCode }) => {
  let otpData;

  if (mode === "EMAIL") {
    if (!email) throw new AppError(400, "Email is required for EMAIL mode");
    otpData = await sendEmailOtp(email, "login");
  } else if (mode === "PHONE") {
    if (!phone || !phoneCode) throw new AppError(400, "Phone and phoneCode are required for PHONE mode");
    otpData = await sendPhoneOtp(phone, phoneCode, "forgot-password");
  } else {
    throw new AppError(400, "Invalid mode");
  }

  return {
    otpId: otpData.otpId,
    expiresIn: otpData.expiresIn,
  };
};

exports.verifyForgotPasswordOtp = async ({ otpId, otp }) => {
  const { verified } = await verifyOtp(otpId, otp);

  if (!verified) {
    throw new AppError(400, "Invalid or expired OTP");
  }
  return true;
};

exports.resetPassword = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new AppError(400, "Admin with this email does not exist");
  }
  admin.password = password;

  await admin.save();

  return true;
};
