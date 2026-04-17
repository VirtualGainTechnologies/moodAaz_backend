const AppError = require("../../utils/app-error");
const repo = require("../user/user.repository");
const {
  sendEmailOtp,
  sendMobileOtp,
  verifyOtp,
} = require("../otp/otp.service");
const { parsePhone } = require("../../utils/phone");

// CONTACT - SEND OTP
exports.sendContactUpdateOtp = async (userId, type, value, country = "IN") => {
  if (type === "email") {
    const email = value.toLowerCase().trim();
    const existing = await repo.findOne({ email });
    if (existing && existing._id.toString() !== userId) throw new AppError(409, "Email already in use");
    const result = await sendEmailOtp(email, "EMAIL_UPDATE");
    if (!result) throw new AppError(400, "Failed to send email OTP");
    return result;
  }
  if (type === "phone") {
    let parsed;
    try { parsed = parsePhone(value, country); }
    catch { throw new AppError(400, "Invalid phone number"); }

    const existing = await repo.findOne({ phone: parsed.input });
    if (existing && existing._id.toString() !== userId) throw new AppError(409, "Phone already in use");

    const result = await sendMobileOtp(parsed.countryCode, parsed.input, "PHONE_UPDATE");
    if (!result) throw new AppError(400, "Failed to send phone OTP");

    return result;
  }

  throw new AppError(400, "Invalid contact type");
};
// CONTACT - VERIFY OTP
exports.verifyContactUpdateOtp = async (userId, type, value, otpId, otp, country = "IN") => {
  const verified = await verifyOtp(otpId, otp);
  if (!verified) throw new AppError(400, "Invalid OTP");

  let user;

  if (type === "email") {
    const email = value.toLowerCase().trim();
    const existing = await repo.findOne({ email });
    if (existing && existing._id.toString() !== userId) throw new AppError(409, "Email already in use");

    user = await repo.updateById(userId, { email, email_verified: true }, { new: true });
    if (!user) throw new AppError(400, "Failed to update email");
  }

  if (type === "phone") {
    let parsed;
    try { parsed = parsePhone(value, country); }
    catch { throw new AppError(400, "Invalid phone number"); }

    const existing = await repo.findOne({ phone: parsed.input });
    if (existing && existing._id.toString() !== userId) throw new AppError(409, "Phone already in use");

    user = await repo.updateById(
      userId,
      { phone_code: parsed.countryCode, phone: parsed.input, phone_verified: true },
      { new: true }
    );
    if (!user) throw new AppError(400, "Failed to update phone");
  }
  return user;
};

// PROFILE DETAILS
exports.updateBasicDetails = async (userId, data) => {
  const updateData = {};

  if (data.first_name) updateData.first_name = data.first_name;
  if (data.last_name) updateData.last_name = data.last_name;
  if (data.gender) updateData.gender = data.gender;

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, "No data provided to update");
  }

  const user = await repo.updateById(userId, updateData, { new: true });

  if (!user) {
    throw new AppError(400, "Failed to update details");
  }

  return user;
};