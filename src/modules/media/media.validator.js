const { body, param } = require("express-validator");

exports.createMediaValidator = [
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["SOCIAL_ICON", "LOGO", "BANNER", "IMAGE"])
    .withMessage("Invalid media type"),
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name must be less than 100 characters"),
  body("file").custom((_, { req }) => {
    if (!req.file) {
      throw new Error("Media file is required");
    }
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type");
    }
    //  size validation (50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (req.file.size > MAX_SIZE) {
      throw new Error("File size must be less than 5MB");
    }
    return true;
  }),
];

exports.deleteMediaValidator = [
  param("id")
    .notEmpty()
    .withMessage("Media id is required")
    .isMongoId()
    .withMessage("Invalid media id"),
];
