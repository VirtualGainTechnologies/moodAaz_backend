const jwt = require("jsonwebtoken");

const {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,
} = require("../config/env.config");

exports.generateJwtToken = (
  payload = {},
  secretKey = JWT_ACCESS_SECRET,
  options = { expiresIn: JWT_ACCESS_EXPIRES_IN },
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
    const decodedToken = jwt.verify(token, JWT_ACCESS_SECRET, {
      ignoreExpiration: false,
    });

    if (decodedToken) {
      return {
        message: "Token verified successfully",
        error: false,
        data: decodedToken,
      };
    } else {
      return {
        message: "Error in token verification",
        error: true,
        data: null,
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
