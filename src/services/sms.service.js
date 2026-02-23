const https = require("https");
const queryString = require("querystring");

const {
  OTP_USER_ID,
  OTP_PASSWORD,
  OTP_USER_ID_INTERNATIONAL,
  OTP_PASSWORD_INTERNATIONAL,
  OTP_SENDER_ID,
} = require("../config/env");
const AppError = require("../utils/AppError");

exports.sendSMS = async ({ mobile, message }) => {
  if (!mobile || !message)
    throw new AppError(400, "Mobile and message required");
  const isInternational = mobile.startsWith("+91") || mobile.startsWith("91");

  const options = {
    hostname: "www.smsgateway.center",
    path: "/SMSApi/rest/send",
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  const requestBody = queryString.stringify({
    userId: isInternational ? OTP_USER_ID_INTERNATIONAL : OTP_USER_ID,
    password: isInternational ? OTP_PASSWORD_INTERNATIONAL : OTP_PASSWORD,
    senderId: OTP_SENDER_ID,
    sendMethod: "simpleMsg",
    msgType: "text",
    mobile,
    msg: message,
    duplicateCheck: "true",
    format: "JSON",
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve(JSON.parse(Buffer.concat(chunks).toString())),
      );
    });

    req.on("error", (err) => reject(err));
    req.write(requestBody);
    req.end();
  });
};
