const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");


// User Schema

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      validate: [validator.isMobilePhone, "Please provide a valid phone number"],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
  },
  { versionKey: false, timestamps: true }
);


// Middleware: Hash password before saving

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Methods: Compare password

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Methods: Generate JWT token

userSchema.methods.generateAuthToken = function () {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is missing in environment variables!");
  }

  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d" }
  );
};

// Export User model

module.exports = mongoose.model("User", userSchema);