const AppError = require("../../utils/app-error");
const repo = require("./user.repository");
const {
  sendMobileOtp,
  sendEmailOtp,
  verifyOtp,
} = require("../otp/otp.service");
const { parsePhone } = require("../../utils/phone");

exports.getUserProfile = async (userId) => {
  const user = await repo.findById(
    userId,
    "email first_name last_name phone phone_code gender date_of_birth",
    {
      lean: true,
    },
  );
  if (!user) {
    throw new AppError(400, "Failed to get user details");
  }

  return user;
};

exports.updateUserProfile = async (payload) => {
  const { userId, firstName, lastName, gender } = payload;
  const user = await repo.updateById(
    userId,
    { first_name: firstName, last_name: lastName, gender },
    {
      returnDocument: "after",
      select:
        "_id first_name last_name gender email phone_code phone email_verified phone_verified role",
    },
  );
  if (!user) {
    throw new AppError(400, "Failed to update user profile");
  }
  return user;
};

exports.sendContactUpdateOtp = async (payload) => {
  const { userId, type, value, country } = payload;
  if (type === "EMAIL") {
    const existing = await repo.findOne({ email: value, _id: userId }, "_id", {
      lean: true,
    });
    if (existing) {
      new AppError(409, "Email already in use");
    }
    const result = await sendEmailOtp(value, "EMAIL_UPDATE");
    if (!result) {
      throw new AppError(400, "Failed to send email OTP");
    }
    return result;
  }

  if (type === "PHONE") {
    const parsed = parsePhone(value, country);
    const existing = await repo.findOne({ phone: parsed.input }, "_id", {
      lean: true,
    });
    if (existing) {
      new AppError(409, "Phone already in use");
    }
    const result = await sendMobileOtp(parsed.countryCode, parsed.input);
    if (!result) {
      throw new AppError(400, "Failed to send phone OTP");
    }
    return result;
  }

  throw new AppError(400, "Invalid contact type");
};

exports.verifyContactUpdateOtp = async (payload) => {
  const { userId, type, value, otpId, otp, country } = payload;
  const verified = await verifyOtp(otpId, otp);
  if (!verified) {
    throw new AppError(400, "Invalid OTP");
  }

  if (type === "EMAIL") {
    const existing = await repo.findOne({ email: value, _id: userId }, "_id", {
      lean: true,
    });
    if (existing) {
      new AppError(409, "Email already in use");
    }
    const user = await repo.updateById(
      userId,
      { email: value, email_verified: true },
      {
        returnDocument: "after",
        select:
          "role first_name last_name phone email gender email_verified phone_verified",
      },
    );
    if (!user) {
      throw new AppError(400, "Failed to update email");
    }
    return user;
  }

  if (type === "PHONE") {
    const parsed = parsePhone(value, country);
    const existing = await repo.findOne({ phone: parsed.input }, "_id", {
      lean: true,
    });
    if (existing) {
      new AppError(409, "Phone already in use");
    }
    const user = await repo.updateById(
      userId,
      {
        phone_code: parsed.countryCode,
        phone: parsed.input,
        phone_verified: true,
      },
      {
        returnDocument: "after",
        select:
          "role first_name last_name phone email gender email_verified phone_verified",
      },
    );
    if (!user) {
      throw new AppError(400, "Failed to update phone");
    }
    return user;
  }

  throw new AppError(400, "Invalid contact type");
};
