const jwt = require("jsonwebtoken");
const repo = require("./user.repository");
const AppError = require("../../utils/AppError");


// Helper: Generate JWT token

const generateJwtToken = (user) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new AppError(500, "JWT_ACCESS_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d" }
  );
};

  // Register User

exports.registerUser = async ({ first_name, last_name, email, password, phone, address }) => {
  // Check if email already exists
  const existing = await repo.findOne({ email });
  if (existing) throw new AppError(400, "Email already registered");

  // Create new user
  const user = await repo.create({
    first_name,
    last_name,
    email,
    password,
    phone,
    address,
  });

  // Generate JWT token
  const token = generateJwtToken(user);

  return { user, token };
};


// Login User

exports.loginUser = async ({ email, password }) => {
  // Find user by email and include password for verification
  const user = await repo.findOne({ email }).select("+password");
  if (!user) throw new AppError(400, "Invalid email or password");

  // Verify password
  const isValid = await user.comparePassword(password);
  if (!isValid) throw new AppError(400, "Invalid email or password");

  // Generate JWT token
  const token = generateJwtToken(user);

  return { user, token };
};
