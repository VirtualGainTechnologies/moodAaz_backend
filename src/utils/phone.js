const {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
} = require("libphonenumber-js");
const AppError = require("./app-error");

exports.parsePhone = (phone, defaultCountry = "IN") => {
  const isValid = isValidPhoneNumber(phone, defaultCountry);
  if (!isValid) {
    throw new AppError(400, "Invalid phone number");
  }
  const parsed = parsePhoneNumberFromString(phone, defaultCountry);
  if (!parsed) {
    throw new Error("Invalid phone number format");
  }

  return {
    input: phone,
    e164: parsed.number,
    national: parsed.nationalNumber,
    international: parsed.formatInternational(),
    country: parsed.country,
    countryCode: parsed.countryCallingCode,
    uri: parsed.getURI(),
    isValid: parsed.isValid(),
    isPossible: parsed.isPossible(),
    type: parsed.getType(), // MOBILE / FIXED_LINE
  };
};
