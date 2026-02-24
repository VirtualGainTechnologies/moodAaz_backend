const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Admin = require("./admin.model");
const AppError = require("../../utils/AppError");
const {sendEmailOtp, verifyOtp } = require("../../modules/otp/otp.service");


exports.forgotPasswordSendOtp = async ({ email }) => {
  const otpData = await sendEmailOtp(email, "login");

  return {
    otpId: otpData.otpId,
    expiresIn: otpData.expiresIn,
  };
};

exports.verifyForgotPasswordOtp = async ({ otpId, email, otp }) => {
  const { verified, otpRecord } = await verifyOtp(otpId, otp);

  if (!verified) {
    throw new AppError(400, "Invalid or expired OTP");
  }

  // Ensure OTP belongs to the same email
  if (!otpRecord || otpRecord.email !== email) {
    throw new AppError(400, "OTP does not match this email");
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
