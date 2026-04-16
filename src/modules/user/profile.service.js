const AppError = require("../../utils/app-error");
const repo = require("../user/user.repository");
const {
  sendEmailOtp,
  sendMobileOtp,
  verifyOtp,
} = require("../otp/otp.service");
const { parsePhone } = require("../../utils/phone");

// =========================
// EMAIL
// =========================

exports.initiateEmailUpdate = async (userId, email) => {
  email = email.toLowerCase().trim();

  const existing = await repo.findOne({ email });

  if (existing && existing._id.toString() !== userId) {
    throw new AppError(409, "Email already in use");
  }

  const result = await sendEmailOtp(email, "EMAIL_UPDATE");

  if (!result) {
    throw new AppError(400, "Failed to send email OTP");
  }

  return result;
};

exports.verifyEmailUpdate = async (userId, otpId, otp, email) => {
  email = email.toLowerCase().trim();

  const verified = await verifyOtp(otpId, otp);

  if (!verified) {
    throw new AppError(400, "Invalid OTP");
  }

  const existing = await repo.findOne({ email });

  if (existing && existing._id.toString() !== userId) {
    throw new AppError(409, "Email already in use");
  }

  const user = await repo.updateById(
    userId,
    {
      email,
      email_verified: true,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(400, "Failed to update email");
  }

  return user;
};

// =========================
// PHONE (FIXED)
// =========================

exports.initiatePhoneUpdate = async (userId, phone, country) => {
  let parsed;

  try {
    parsed = parsePhone(phone, country);
  } catch {
    throw new AppError(400, "Invalid phone number");
  }

  const existing = await repo.findOne({ phone: parsed.input });

  if (existing && existing._id.toString() !== userId) {
    throw new AppError(409, "Phone already in use");
  }

  const result = await sendMobileOtp(
    parsed.countryCode,
    parsed.input,
    "PHONE_UPDATE"
  );

  if (!result) {
    throw new AppError(400, "Failed to send phone OTP");
  }

  return result;
};

exports.verifyPhoneUpdate = async (
  userId,
  otpId,
  otp,
  phone,
  country
) => {
  let parsed;

  try {
    parsed = parsePhone(phone, country);
  } catch {
    throw new AppError(400, "Invalid phone number");
  }

  const verified = await verifyOtp(otpId, otp);

  if (!verified) {
    throw new AppError(400, "Invalid OTP");
  }

  const existing = await repo.findOne({ phone: parsed.input });

  if (existing && existing._id.toString() !== userId) {
    throw new AppError(409, "Phone already in use");
  }

  const user = await repo.updateById(
    userId,
    {
      phone_code: parsed.countryCode,
      phone: parsed.input,
      phone_verified: true,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(400, "Failed to update phone");
  }

  return user;
};

// =========================
// ADDRESS
// =========================

// ADD ADDRESS
exports.addAddress = async (userId, addressData) => {
  const user = await repo.updateById(
    userId,
    {
      address: addressData,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(400, "Failed to add address");
  }

  return user;
};

// UPDATE ADDRESS
exports.updateAddress = async (userId, addressData) => {
  const user = await repo.updateById(
    userId,
    {
      address: {
        ...addressData,
      },
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(400, "Failed to update address");
  }

  return user;
};

// ADD DETAILS
exports.addBasicDetails = async (userId, data) => {
  const { first_name, last_name, gender } = data;

  const user = await repo.updateById(
    userId,
    {
      first_name,
      last_name,
      gender,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(400, "Failed to add details");
  }

  return user;
};

// UPDATE DETAILS
exports.updateBasicDetails = async (userId, data) => {
  const updateData = {};

  if (data.first_name) updateData.first_name = data.first_name;
  if (data.last_name) updateData.last_name = data.last_name;
  if (data.gender) updateData.gender = data.gender;

  const user = await repo.updateById(userId, updateData, { new: true });

  if (!user) {
    throw new AppError(400, "Failed to update details");
  }
  return user;
};