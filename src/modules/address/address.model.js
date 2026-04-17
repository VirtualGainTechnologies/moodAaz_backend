const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User id is required"],
    },
    label: {
      type: String,
      enum: {
        values: ["HOME", "WORK", "OTHER"],
        message: "Invalid label",
      },
      default: "HOME",
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    line1: {
      type: String,
      required: [true, "Line1 is required"],
    },
    line2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
    },
    country: {
      type: String,
      default: "India",
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Address", addressSchema);
