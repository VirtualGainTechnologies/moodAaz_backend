const multer = require("multer");
const AppError = require("../utils/app-error");

module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image")) {
      return cb(new AppError(400, "Only image files are allowed"), false);
    }
    cb(null, true);
  },
});
