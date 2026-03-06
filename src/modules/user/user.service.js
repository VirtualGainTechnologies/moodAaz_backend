const repo = require("./user.repository");
const AppError = require("../../utils/AppError");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

// Generate JWT
const generateJwtToken = (user) => {
  if (!process.env.JWT_ACCESS_SECRET) throw new AppError(500, "JWT_ACCESS_SECRET is not defined");
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  });
};

// OTP Generator
const generateOtp = () =>
  otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

// REGISTER SEND OTP
exports.registerSendOtp = async ({ email, phone }) => {
  const existing = await repo.findOne({ email });
  if (existing) throw new AppError(400, "Email already registered");

  // Service-level phone validation
  if (phone && !/^\d{10}$/.test(phone)) {
    throw new AppError(400, "Phone number must be exactly 10 digits");
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const newUserOtp = await repo.create({ email, phone, otp, otpExpiresAt: expiresAt });
  console.log(`Register OTP for ${email}: ${otp}`);
  return { message: "OTP sent successfully", otpId: newUserOtp._id.toString() };
};

// REGISTER VERIFY OTP
exports.registerVerifyOtp = async ({ otpId, otp, email, first_name, last_name, password, phone, address }) => {
  const user = await repo.findById(otpId);
  if (!user || !user.otp || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date())
    throw new AppError(400, "Invalid or expired OTP");

  // Email match check
  if (email && user.email !== email) {
    throw new AppError(400, "Email does not match OTP record");
  }
  // Phone match check
  if (user.phone && phone && user.phone !== phone) {
    throw new AppError(400, "Phone number is not matching");
  }
  // phone validation
  if (phone && !/^\d{10}$/.test(phone)) {
    throw new AppError(400, "Phone number must be exactly 10 digits");
  }

  // Update user info
  user.first_name = first_name;
  user.last_name = last_name;
  user.password = password;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = generateJwtToken(user);
  return { user, token };
};

// LOGIN SEND OTP
exports.loginSendOtp = async ({ email }) => {
  const user = await repo.findOne({ email });
  if (!user) throw new AppError(400, "User not found");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  user.otp = otp;
  user.otpExpiresAt = expiresAt;
  await user.save();

  console.log(`Login OTP for ${email}: ${otp}`);
  return { message: "OTP sent successfully", otpId: user._id.toString() };
};

// LOGIN VERIFY OTP
exports.loginVerifyOtp = async ({ otpId, otp }) => {
  const user = await repo.findById(otpId);
  if (!user || !user.otp || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date())
    throw new AppError(400, "Invalid or expired OTP");

  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = generateJwtToken(user);
  return { user, token };
};