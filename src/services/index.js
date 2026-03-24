module.exports = {
  ...require("./email.service"),
  ...require("./sms.service"),
  ...require("./file.service"),
};
