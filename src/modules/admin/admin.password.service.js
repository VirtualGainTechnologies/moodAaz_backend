const bcrypt = require("bcryptjs");

const AppError = require("../../utils/app-error");
const {
  sendMobileOtp,
  sendEmailOtp,
  verifyOtp,
} = require("../otp/otp.service");
const repo = require("./admin.repository");

exports.sendForgotPasswordOtp = async (payload) => {
  const { mode, email, phoneCode, phone } = payload;

  const admin = await repo.findOne(
    mode == "EMAIL" ? { email } : { phone_code: phoneCode, phone },
    "_id",
    { lean: true },
  );
  if (!admin) {
    throw new AppError(400, `This ${mode.toLowerCase()} is not registered`);
  }

  const otpResult =
    mode == "EMAIL"
      ? await sendEmailOtp(email, "forgotPassword")
      : await sendMobileOtp(phoneCode, phone);
  if (!otpResult) {
    throw new AppError(400, "Failed to send otp");
  }

  return otpResult;
};

exports.verifyForgotPasswordOtp = async (payload) => {
  const { otpId, otp } = payload;
  const isVerified = await verifyOtp(otpId, otp);
  if (!isVerified) {
    throw new AppError(400, "Invalid or expired OTP");
  }

  const { verified } = isVerified;
  return verified;
};

exports.resetForgotPassword = async (payload, meta) => {
  const { mode, email, phoneCode, phone, password } = payload;

  const admin = await repo.findOne(
    mode == "EMAIL" ? { email } : { phone_code: phoneCode, phone },
    "_id password",
    {},
  );
  if (!admin) {
    throw new AppError(400, `This ${mode.toLowerCase()} is not registered`);
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (isPasswordMatched) {
    throw new AppError(400, "This password is already in use");
  }

  const updatedAdmin = await repo.updateById(
    admin._id,
    {
      password: await bcrypt.hash(password, 12),
      is_blocked: false,
      login_count: 0,
      is_login_attempt_exceeded: false,
      last_login_ip: meta.ip,
      last_login_location: meta.location,
    },
    { new: true },
  );

  if (!updatedAdmin) {
    throw new AppError(400, "Failed to update admin details");
  }

  return true;
};
