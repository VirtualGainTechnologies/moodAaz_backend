const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User id is required"],
    },
    address_type: {
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
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    mobile_number: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"],
    },
    alternate_contact: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Invalid alternate contact number"],
    },
    locallity: {
      type: String,
      trim: true,
      maxlength: [150, "Locality cannot exceed 150 characters"],
    },
    full_address: {
      type: String,
      required: [true, "Full address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [150, "Landmark cannot exceed 150 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      match: [/^\d{6}$/, "Invalid pincode"],
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Address", addressSchema);
