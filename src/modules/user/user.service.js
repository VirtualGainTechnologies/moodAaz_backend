const validator = require("validator");

const AppError = require("../../utils/app-error");
const {
  sendMobileOtp,
  sendEmailOtp,
  verifyOtp,
} = require("../otp/otp.service");
const { parsePhone } = require("../../utils/phone");
const repo = require("./user.repository");
const { generateJwtToken, verifyJwtToken } = require("../../utils/jwt");

const parseIdentifier = (identifier) => {
  const value = identifier.trim().toLowerCase();
  const isEmail = validator.isEmail(value);
  const isMobilePhone = validator.isMobilePhone(value, "any");
  if (!isEmail && !isMobilePhone) {
    throw new Error("Identifier must be a valid email or phone number");
  }
  return {
    type: isEmail ? "EMAIL" : "PHONE",
    value,
  };
};

exports.initiateAuthentication = async (payload) => {
  const { identifier, country } = payload;
  const parsed = parseIdentifier(identifier);
  const { type, value } = parsed;

  const isExist = await repo.findOne({ [type.toLowerCase()]: value }, "_id", {
    lean: true,
  });
  const authType = !isExist ? "REGISTER" : "LOGIN";

  let result;
  if (type == "EMAIL") {
    result = await sendEmailOtp(value, authType.toLowerCase());
  } else {
    const { countryCode, input } = parsePhone(identifier, country);
    result = await sendMobileOtp(countryCode, input);
  }

  if (!result) {
    throw new AppError(400, "Failed to send otp");
  }

  return {
    ...result,
    identifier,
    authType,
  };
};

exports.verifyAuthentication = async (payload) => {
  const { identifier, otp, otpId, country, authType } = payload;
  const parsed = parseIdentifier(identifier);
  const { type, value } = parsed;

  const verified = await verifyOtp(otpId, otp);
  if (!verified) {
    throw new AppError(400, "Failed to verify otp");
  }

  const token = generateJwtToken({
    [type.toLowerCase()]: value,
    type: "USER",
  });
  if (token.error) {
    throw new AppError(400, token.message);
  }

  let userInfo = {};
  if (type == "PHONE") {
    const { countryCode, input } = parsePhone(identifier, country);
    userInfo["phone_code"] = countryCode;
    userInfo["phone"] = input;
    userInfo["phone_verified"] = true;
  } else {
    userInfo["email"] = value;
    userInfo["email_verified"] = true;
  }

  const result =
    authType == "LOGIN"
      ? await repo.updateOne(
          userInfo,
          {
            token: token.data,
            last_login_date: Date.now(),
          },
          { returnDocument: "after" },
        )
      : await repo.create({
          ...userInfo,
          token: token.data,
          last_login_date: Date.now(),
        });

  if (!result) {
    const message =
      authType === "LOGIN"
        ? "Login failed. Please check your credentials."
        : "Registration failed. Please try again.";
    throw new AppError(400, message);
  }

  return {
    token: token.data,
    role: result.role,
    [type.toLowerCase()]: value,
    authType,
  };
};

exports.checkAuth = async (req) => {
  const token = req.signedCookies?.user_token;
  console.log("the token is ....", token);
  if (!token) return false;

  const decoded = verifyJwtToken(token);
  if (decoded.error) return false;

  if (decoded.data.type !== "USER") return false;

  const isAuthenticated = await repo.findOne({ token }, "_id role", {
    lean: true,
  });
  if (!isAuthenticated) return false;

  return true;
};
