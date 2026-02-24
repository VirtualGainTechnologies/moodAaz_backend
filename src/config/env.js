const env = (key, defaultValue = undefined) => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

module.exports = {
  // app
  NODE_ENV: env("NODE_ENV", "development"),
  PORT: Number(env("PORT", 5000), "PORT"),

  // client
  CLIENT_BASE_URL1: env("CLIENT_BASE_URL1"),
  CLIENT_BASE_URL2: env("CLIENT_BASE_URL2"),

  // security
  COOKIE_SIGNING_SECRET: env("COOKIE_SIGNING_SECRET"),
  COOKIE_EXPIRATION_MILLISECONDS: env("COOKIE_EXPIRATION_MILLISECONDS"),

  // database
  MONGO_URI: env("MONGO_URI"),

  // jwt
  JWT_ACCESS_SECRET: env("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRES_IN: env("JWT_ACCESS_EXPIRES_IN", "15m"),

  // sendgrid
  SENDGRID_FROM_EMAIL: env("SENDGRID_FROM_EMAIL"),
  SENDGRID_API_KEY: env("SENDGRID_API_KEY"),

  // otp
  OTP_EXPIRY_MINUTES: env("OTP_EXPIRY_MINUTES"),
  OTP_MAX_ATTEMPTS: env("OTP_MAX_ATTEMPTS"),
  OTP_USER_ID: env("OTP_USER_ID"),
  OTP_PASSWORD: env("OTP_PASSWORD"),
  OTP_USER_ID_INTERNATIONAL: env("OTP_USER_ID_INTERNATIONAL"),
  OTP_PASSWORD_INTERNATIONAL: env("OTP_PASSWORD_INTERNATIONAL"),
  OTP_SENDER_ID: env("OTP_SENDER_ID"),

  // redis
  REDIS_URL: env("REDIS_URL"),
};
