const APP_NAME = "Modaaz";

const loginOtpTemplate = ({ otp }) => ({
  subject: `${APP_NAME} Login OTP`,
  body: `
    <h2>${APP_NAME} Login Verification</h2>
    <p>Your OTP is <b>${otp}</b></p>
    <p>This OTP is valid for 5 minutes.</p>
  `,
});

const registerOtpTemplate = ({ otp }) => ({
  subject: `${APP_NAME} Registration OTP`,
  body: `
    <h2>Welcome to ${APP_NAME}</h2>
    <p>Your registration OTP is <b>${otp}</b></p>
    <p>Do not share this OTP with anyone.</p>
  `,
});

exports.emailOtpTemplates = {
  login: loginOtpTemplate,
  register: registerOtpTemplate,
};
