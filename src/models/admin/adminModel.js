const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      trim: true,
      required: [true, "User name is required field"],
      unique: [true, "User name already exists"],
    },
    phone_code: {
      type: String,
      trim: true,
      required: [true, "Phone code is required field"],
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Phone number is required field"],
      unique: [true, "Phone number must be unique"],
      validate: [
        validator.isMobilePhone,
        "Please provide a valid phone number",
      ],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required field"],
      unique: [true, "Email must be unique"],
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Password is required field"],
    },
    role: {
      type: String,
      enum: [
        "SUPER-ADMIN",
        "SUB-ADMIN-LEVEL-1",
        "SUB-ADMIN-LEVEL-2",
        "SUB-ADMIN-LEVEL-3",
      ],
      default: "SUB-ADMIN-LEVEL-1",
      required: true,
    },
    token: {
      type: String,
      required: [true, "Token is required field"],
    },
    login_count: {
      type: Number,
      default: 0,
    },
    is_login_attempt_exceeded: {
      type: Boolean,
      default: false,
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
      default: new Date().getTime(),
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
  },
  { versionKey: false, timestamps: true }
);

// Hash the password before saving to db
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password with hashed password in database
adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Increment login count when user logs in
adminSchema.methods.incrementLoginCount = function () {
  this.loginCount += 1;
  return this.save();
};

// Generate a JWT token
adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.USER_JWT_SECRET, {
    expiresIn: process.env.USER_JWT_EXPIRES_IN,
  });
  return token;
};

const AdminModel = mongoose.model("admin", adminSchema);

module.exports = { AdminModel };
