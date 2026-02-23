const { sendEmailOtp, sendMobileOtp } = require("./otp.service");

exports.resendOtp = async (req, res) => {
  const { type, emailOtpType, phone, phoneCode, email } = req.body;
  const result =
    type === "email"
      ? await sendEmailOtp(email, emailOtpType)
      : await sendMobileOtp(phone, phoneCode);

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};
