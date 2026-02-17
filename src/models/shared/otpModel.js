const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      trim: true,
      required: [true, "Otp is required field"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone_code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Number,
      required: [true, "Date is required field"],
    },
  },
  { versionKey: false }
);

const OtpModel = mongoose.model("otp", otpSchema);
module.exports = { OtpModel };
