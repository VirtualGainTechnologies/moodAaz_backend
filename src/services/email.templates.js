const APP_NAME = "Modaaz";

const registerOtpTemplate = ({ otp }) => ({
  subject: `${APP_NAME} Registration OTP`,
  body: `
    <h2>Welcome to ${APP_NAME}</h2>
    <p>Your registration OTP is <b>${otp}</b></p>
    <p>Do not share this OTP with anyone.</p>
  `,
});

const loginOtpTemplate = ({ otp }) => ({
  subject: `${APP_NAME} Login OTP`,
  body: `
    <h2>${APP_NAME} Login Verification</h2>
    <p>Your OTP is <b>${otp}</b></p>
    <p>This OTP is valid for 5 minutes.</p>
  `,
});

const forgotPasswordOtpTemplate = ({ otp }) => ({
  subject: `${APP_NAME} Password Reset OTP`,
  body: `
    <h2>${APP_NAME} Password Reset Request</h2>
    <p>We received a request to reset your password.</p>
    <p>Your OTP is <b>${otp}</b></p>
    <p>This OTP is valid for 5 minutes.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
  `,
});

exports.emailOtpTemplates = {
  login: loginOtpTemplate,
  register: registerOtpTemplate,
  forgotPassword: forgotPasswordOtpTemplate,
};
