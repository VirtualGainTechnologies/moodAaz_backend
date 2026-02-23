const authenticate = require("./auth.middleware");
const authorize = require("./role.middleware");
const errorHandler = require("./error.middleware");
const getIpAndLocation = require("./ipLocation.middleware");

module.exports = {
  authenticate,
  authorize,
  errorHandler,
  getIpAndLocation,
};
