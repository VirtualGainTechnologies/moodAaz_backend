const {
  registerSendOtp,
  registerVerifyOtp,
  loginSendOtp,
  loginVerifyOtp,
} = require("./user.service");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");

const setUserCookie = (res, token) => {
  res.cookie("user_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: COOKIE_EXPIRATION_MILLISECONDS,
  });
};

// OTP-BASED REGISTER
exports.registerSendOtp = async (req, res, next) => {
  try {
    const result = await registerSendOtp(req.body);
    res.status(200).json({
      message: result.message,
      error: false,
      otpId: result.otpId,
    });
  } catch (err) {
    next(err);
  }
};

exports.registerVerifyOtp = async (req, res, next) => {
  try {
    const { user, token } = await registerVerifyOtp(req.body);
    setUserCookie(res, token);
    res.status(201).json({
      message: "User registered successfully",
      error: false,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// OTP-BASED LOGIN
exports.loginSendOtp = async (req, res, next) => {
  try {
    const result = await loginSendOtp(req.body);
    res.status(200).json({
      message: result.message,
      error: false,
      otpId: result.otpId,
    });
  } catch (err) {
    next(err);
  }
};

exports.loginVerifyOtp = async (req, res, next) => {
  try {
    const { user, token } = await loginVerifyOtp(req.body);
    setUserCookie(res, token);
    res.status(200).json({
      message: "Login successful",
      error: false,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};