const authenticate = require("./auth.middleware");
const authorize = require("./role.middleware");
const errorHandler = require("./error.middleware");
const getIpAndLocation = require("./geolocation.middleware");
const multer = require("./upload.middleware");

module.exports = {
  authenticate,
  authorize,
  errorHandler,
  getIpAndLocation,
  multer,
};
