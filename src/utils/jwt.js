const jwt = require("jsonwebtoken");

exports.generateJwtToken = (
  payload = {},
  secretKey = process.env.USER_JWT_SECRET,
  options = { expiresIn: process.env.USER_JWT_EXPIRES_IN }
) => {
  try {
    const token = jwt.sign(payload, secretKey, options);
    return {
      message: "Token generated successfully",
      error: false,
      data: token,
    };
  } catch (err) {
    return {
      message: err.message || "Failed to generate token",
      error: true,
      data: null,
    };
  }
};

exports.verifyJwtToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.USER_JWT_SECRET, {
      ignoreExpiration: false,
    });

    if (decodedToken) {
      return {
        message: "Token verified successfully",
        error: false,
        data: null,
      };
    } else {
      return {
        message: "Error in token verification",
        error: true,
        data: decodedToken,
      };
    }
  } catch (err) {
    let message =
      err?.name === "TokenExpiredError"
        ? err?.message || "Token has expired"
        : err?.name === "JsonWebTokenError"
        ? err?.message || "Invalid token"
        : err?.name === "NotBeforeError"
        ? err?.message || "Invalid token"
        : "Session expired";
    return {
      message: message,
      error: true,
      data: null,
    };
  }
};