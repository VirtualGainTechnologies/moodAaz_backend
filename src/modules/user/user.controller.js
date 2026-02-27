const { registerUser, loginUser } = require("./user.service");
const AppError = require("../../utils/AppError");
const { COOKIE_EXPIRATION_MILLISECONDS } = require("../../config/env");

// Register Controller

exports.register = async (req, res, next) => {
  try {
    // Call service to register user
    const { user, token } = await registerUser(req.body);

    // Set JWT token in httpOnly cookie
    res.cookie("user_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: COOKIE_EXPIRATION_MILLISECONDS,
    });

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      error: false,
      data: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    next(err); // Pass errors to error handler middleware
  }
};


// Login Controller

exports.login = async (req, res, next) => {
  try {
    // Call service to login user
    const { user, token } = await loginUser(req.body);

    // Set JWT token in httpOnly cookie
    res.cookie("user_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: COOKIE_EXPIRATION_MILLISECONDS,
    });

    // Send response
    res.status(200).json({
      message: "Login successful",
      error: false,
      data: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    next(err); // Pass errors to error handler middleware
  }
};
