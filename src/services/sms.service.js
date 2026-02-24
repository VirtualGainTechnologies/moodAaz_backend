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

exports.sendSMS = async ({ mobileNumber, message }) => {
  if (!mobileNumber || !message)
    throw new AppError(
      400,
      `${!mobileNumber ? "Mobile" : "Message"} is required`,
    );
  const isInternational =
    mobileNumber.startsWith("+91") || mobileNumber.startsWith("91");

  const options = {
    hostname: "www.smsgateway.center",
    path: "/SMSApi/rest/send",
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
    },
  };

  const requestBody = queryString.stringify({
    userId: isInternational ? OTP_USER_ID_INTERNATIONAL : OTP_USER_ID,
    password: isInternational ? OTP_PASSWORD_INTERNATIONAL : OTP_PASSWORD,
    senderId: OTP_SENDER_ID,
    sendMethod: "simpleMsg",
    msgType: "text",
    mobile: mobileNumber,
    msg: message,
    duplicateCheck: "true",
    format: "JSON",
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(Buffer.concat(chunks).toString());
          console.log("response", response);
          if (!response || response.status !== "success") {
            return reject(
              new AppError(
                502,
                response?.reason || "Failed to send SMS OTP",
              ),
            );
          }
          resolve(response);
        } catch (err) {
          reject(new AppError(500, "Invalid response from SMS gateway"));
        }
      });
    });

    req.on("error", () => reject(new AppError(503, "SMS service unavailable")));
    req.write(requestBody);
    req.end();
  });
};
