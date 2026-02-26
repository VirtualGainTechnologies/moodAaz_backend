const AppError = require("../../utils/app-error");
const service = require("./otp.service");

exports.resendOtp = async (req, res) => {
  const result = await service.resendOtp(req.body);
  if (!result) {
    throw new AppError("Failed to send otp");
  }

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};
