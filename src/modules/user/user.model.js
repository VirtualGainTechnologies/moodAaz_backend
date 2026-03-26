const mongoose = require("mongoose");
const validator = require("validator");
const { parsePhone } = require("../../utils/phone");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Please provide a valid email address",
      },
    },
    phone_code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          try {
            parsePhone(`${this.phone_code}${value}`);
            return true;
          } catch (err) {
            return false;
          }
        },
        message: "Please provide a valid phone number",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    first_name: {
      type: String,
      trim: true,
      maxlength: [80, "First name cannot exceed 80 characters"],
    },
    last_name: {
      type: String,
      trim: true,
      maxlength: [80, "Last name cannot exceed 80 characters"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be male, female, or other",
      },
    },
    date_of_birth: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v < new Date();
        },
        message: "Date of birth must be a valid past date",
      },
    },
    avatar: {
      type: String,
      trim: true,
    },
    profile_completed: {
      type: Boolean,
      default: false,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
      required: [true, "Token is required field"],
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "BLOCKED", "DELETED"],
        message: "Invalid account status",
      },
      default: "ACTIVE",
    },
    credits: {
      type: Number,
      min: [0, "Credits cannot be negative"],
      default: 0,
    },
    role: {
      type: String,
      default: "USER",
    },
    last_login_ip: {
      type: String,
      default: "",
    },
    last_login_location: {
      country: String,
      region: String,
      eu: String,
      timezone: String,
      city: String,
      ll: [Number],
    },
    last_login_date: {
      type: Number,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// virtual
userSchema.virtual("full_name").get(function () {
  return `${this.first_name || ""} ${this.last_name || ""}`.trim();
});

module.exports = mongoose.model("user", userSchema);
