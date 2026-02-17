const AppError = require("../../utils/AppError");
const { sendOtpToEmail } = require("../../utils/otp");

exports.resendOtp = async (req, res) => {
  const req_body = Object.assign({}, req.body);

  const emailData = await sendOtpToEmail({
    type: req_body.type,
    email: req_body.email,
  });
  if (emailData.error) {
    throw new AppError(400, emailData.message);
  }

  res.status(200).json({
    message: `OTP sent to email`,
    error: false,
    data: emailData?.data,
  });
};
