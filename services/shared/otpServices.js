const https = require("https");
const queryString = require("querystring");

const { OtpModel } = require("../../models/shared/otpModel");

exports.createOtp = (object) => {
  return OtpModel.create(object);
};

exports.getOtpById = (id, projections = null, options = {}) => {
  return OtpModel.findById(id, projections, options);
};

exports.getOtpByFilter = (filters = {}, projections = null, options = {}) => {
  return OtpModel.findOne(filters, projections, options);
};

exports.getAllOtpByFilter = (
  filters = {},
  projections = null,
  options = {}
) => {
  return OtpModel.find(filters, projections, options);
};

exports.updateOtpById = (id, updateObject = {}, options = {}) => {
  return OtpModel.findByIdAndUpdate(id, updateObject, options);
};

exports.updateOtpByFilter = (filters = {}, updateObject = {}, options = {}) => {
  return OtpModel.findOneAndUpdate(filters, updateObject, options);
};

exports.deleteOtpById = (id) => {
  return OtpModel.findByIdAndDelete(id);
};

exports.deleteAllOtpByFilter = (filters = {}) => {
  return OtpModel.deleteMany(filters);
};

exports.deleteManyOtp = (filter = {}) => {
  return OtpModel.deleteMany(filter);
};

exports.makeHttpsRequestForOtp = (mobile, otp) => {
  return new Promise((resolve, reject) => {
    if (mobile.startsWith("+91") || mobile.startsWith("91")) {
      userId = process.env.OTP_USER_ID;
      password = process.env.OTP_PASSWORD;
    } else {
      userId = process.env.OTP_USER_ID_INTERNATIONAL;
      password = process.env.OTP_PASSWORD_INTERNATIONAL;
    }

    var options = {
      hostname: "www.smsgateway.center",
      path: "/SMSApi/rest/send",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache",
      },
    };

    var requestBody = {
      userId: userId,
      password: password,
      senderId: process.env.OTP_SENDER_ID,
      sendMethod: "simpleMsg",
      msgType: "text",
      mobile: `${mobile}`,
      msg: `Your OTP for fynzon is: ${otp} VBIPVT`,
      //msg: "Your Instant Demo account is live. This is a Demo Test message. - Demo Message SMSGatewayCenter",
      duplicateCheck: "true",
      format: "JSON",
    };

    var sendOTP = https.request(options, (response) => {
      var chunks = [];
      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        // console.log("End", chunks);
        var data = JSON.parse(Buffer.concat(chunks).toString());
        // console.log(data);
        resolve(data);
      });
    });

    sendOTP.on("error", (err) => {
      console.log(`problem with request: ${err.message}`);
      reject(err);
    });
    sendOTP.write(queryString.stringify(requestBody));
    sendOTP.end();
  });
};
