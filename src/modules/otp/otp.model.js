const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      trim: true,
      required: [true, "otp is required field"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    expires_at: {
      type: Number,
      required: [true, "expires at is required field"],
      index: { expires: 0 }, // TTL index
    },
    attempts: {
      type: Number,
      default: 0,
    },
    date: {
      type: Number,
      dafault: new Date().getTime(),
    },
  },
  { versionKey: false },
);

const OtpModel = mongoose.model("otp", otpSchema);
module.exports = { OtpModel };
