const crypto = require("crypto");
const otpGenerator = require("otp-generator");

const repo = require("./otp.repository");
const { emailOtpTemplates } = require("../../services/email.templates");
const { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } = require("../../config/env");
const { sendEmail, sendSMS } = require("../../services");
const AppError = require("../../utils/AppError");

const otpHash = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const generateOtp = () => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

exports.sendEmailOtp = async (email, type) => {
  let otpRecordId;
  try {
    if (!email || !type) {
      throw new AppError(400, `${!email ? "Email" : "Otp type"} is required`);
    }

    await repo.deleteMany({ email });
    const otp = generateOtp();

    const otpRecord = await repo.create({
      email,
      otp: otpHash(otp),
      expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    if (!otpRecord) {
      throw new AppError(500, "Failed to create OTP record");
    }
    otpRecordId = otpRecord._id;

    // send email
    const template = emailOtpTemplates[type];
    if (!template) {
      throw new Error("Invalid email OTP type");
    }

    const { subject, body } = template({ otp });
    await sendEmail({ email, subject, body });

    return {
      otpId: otpRecord._id,
      email,
      expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
    };
  } catch (err) {
    if (otpRecordId) {
      await repo.deleteById(otpRecordId);
    }
    throw new AppError(400, err.message);
  }
};

exports.sendMobileOtp = async (phone, phoneCode) => {
  let otpRecordId;
  try {
    if (!phone || !phoneCode)
      throw new AppError(400, `${!phone ? "Phone" : "Phone code"} is required`);

    await repo.deleteMany({ phone });
    const otp = generateOtp();

    const otpRecord = await repo.create({
      phone,
      phone_code: phoneCode,
      otp: otpHash(otp),
      expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });
    if (!otpRecord) {
      throw new AppError(500, "Failed to create OTP record");
    }
    otpRecordId = otpRecord._id;

    // sms message
    const message = `Your OTP for moodaaz is: ${otp} VBIPVT`;
    const mobileNumber = `+${phoneCode}${phone}`;
    await sendSMS({
      mobileNumber,
      message,
    });

    return {
      otpId: otpRecord._id,
      phone,
      expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
    };
  } catch (err) {
    if (otpRecordId) {
      await repo.deleteById(otpRecordId);
    }
    throw new AppError(400, err.message);
  }
};

exports.verifyOtp = async (id, otp) => {
  try {
    if (!id || !otp)
      throw new AppError(400, `${!otp ? "otp" : "id"} is required`);

    const otpRecord = await repo.findById(id, "_id attempts otp", {
      lean: true,
    });
    if (!otpRecord) {
      throw new AppError(410, "OTP expired");
    }

    // max attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await repo.deleteById(otpRecord._id);
      throw new AppError(429, "OTP attempt limit exceeded");
    }

    if (otpRecord.otp !== otpHash(otp)) {
      await repo.incrementAttempts(otpRecord._id);
      throw new AppError(400, "Invalid OTP");
    }

    // otp verified → delete it
    await repo.deleteById(otpRecord._id);
    return {
      verified: true,
    };
  } catch (err) {
    throw new AppError(400, err.message);
  }
};
