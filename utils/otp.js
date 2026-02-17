const otpGenerator = require("otp-generator");
const sgMail = require("@sendgrid/mail");
const mongoose = require("mongoose");

const AppError = require("./AppError");
const {
  makeHttpsRequestForOtp,
  createOtp,
  deleteManyOtp,
  deleteOtpById,
  getOtpById,
  deleteAllOtpByFilter,
} = require("../services/shared/otpServices");
const { getOtpEmailTemplate } = require("./emailTemplates");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOtpToEmail = async (emailData) => {
  let otpRecordId = null;

  try {
    //check email exists or not
    if (!emailData.email) {
      throw new Error("Email must be provided to send OTP");
    }

    //delete old otp record
    await deleteManyOtp({ email: emailData?.email });

    //create new otp
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const otpRecord = await createOtp({
      otp: otp,
      email: emailData?.email,
      date: new Date().getTime(),
    });

    if (!otpRecord) {
      throw new AppError(400, "Failed to create OTP record");
    }

    otpRecordId = otpRecord?._id;

    let subject;
    let body = await getOtpEmailTemplate({ ...emailData, otp });

    switch (emailData?.type) {
      case "login":
        subject = `OTP to login in Moodaaz is ${otp}`;
        break;
      case "register":
        subject = `OTP to register in Moodaaz is ${otp}`;
        break;
      default:
        throw new AppError(400, "Invalid email type");
    }

    // await sgMail.send({
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   to: emailData.email,
    //   subject: subject,
    //   html: body,
    // });

    return {
      message: `OTP sent to email`,
      error: false,
      data: {
        otpId: otpRecord._id,
        email: otpRecord.email,
      },
    };
  } catch (err) {
    console.log("error in catch block of sendOtpEmail", err);

    if (otpRecordId) await deleteOtpById(otpRecordId);

    return {
      message: err.message || "Failed to send OTP",
      error: true,
      data: null,
    };
  }
};

exports.sendOtpToMobile = async (phoneData) => {
  let otpRecordId = null;
  try {
    // check phone exists or not
    if (!phoneData.phoneCode || !phoneData.phone) {
      const message = !phoneData.phoneCode
        ? "Phone code number must be provided to send OTP"
        : "Phone number must be provided to send OTP";
      throw new Error(message);
    }

    // delete old otp record
    await deleteManyOtp({
      phone_code: phoneData.phoneCode,
      phone: phoneData.phone,
    });

    // create new OTP
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const otpRecord = await createOtp({
      otp: otp,
      phone_code: phoneData?.phoneCode,
      phone: phoneData?.phone,
      date: new Date().getTime(),
    });

    if (!otpRecord) {
      throw new AppError(400, "Failed to create OTP record");
    }

    otpRecordId = otpRecord?._id;

    const mobileNumber = `+${otpRecord.phone_code}${otpRecord.phone}`;
    const result = await makeHttpsRequestForOtp(mobileNumber, otp);

    if (result.status !== "success") {
      return {
        message: "Failed to send OTP",
        error: true,
        data: null,
      };
    }

    return {
      message: `OTP sent to mobile`,
      error: false,
      data: {
        otpId: otpRecord._id,
        phoneCode: otpRecord?.phone_code,
        phone: otpRecord?.phone,
      },
    };
  } catch (err) {
    console.log("error in catch block of sendOtpToMobile", err);
    if (otpRecordId) await deleteOtpById(otpRecordId);
    return {
      message: err.message || "Failed to send otp",
      error: true,
      data: null,
    };
  }
};

exports.verifyOtp = async (id, otp) => {
  try {
    const otpRecordId = mongoose.Types.ObjectId.createFromHexString(id);

    let date = new Date();
    date.setMinutes(date.getMinutes() - 5);
    const time = date.getTime();

    const otpRecord = await getOtpById(
      otpRecordId,
      "_id email otp phone phone_code date",
      {
        lean: true,
      },
    );

    if (!otpRecord || otpRecord.date < time || otpRecord.otp !== otp) {
      return {
        message: otpRecord?.date < time ? "OTP expired" : "Invalid OTP",
        error: true,
        data: null,
      };
    }

    const filter = {
      ...(otpRecord.email &&
        !otpRecord.phone && {
          email: otpRecord.email,
        }),
      ...(otpRecord.phone &&
        !otpRecord.email && {
          phone: otpRecord.phone,
        }),
      ...(otpRecord.phone &&
        otpRecord.email && {
          email: otpRecord.email,
          phone: otpRecord.phone,
        }),
    };

    //delete otp
    await deleteAllOtpByFilter(filter);

    return {
      message: "OTP verified successfully",
      error: false,
      data: otpRecord,
    };
  } catch (err) {
    return {
      message: err.message || "OTP Verification Failed",
      error: true,
      data: null,
    };
  }
};
