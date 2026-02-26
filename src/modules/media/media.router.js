const router = require("express").Router();

const { multer, authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async.util");
const { createMedia, deleteMedia } = require("./media.controller");
const {
  deleteMediaValidator,
  createMediaValidator,
} = require("./media.validator");

router.post(
  "/",
  authenticate,
  authorize("SUPER-ADMIN"),
  multer.single("file"),
  createMediaValidator,
  catchAsync("createMedia api", createMedia),
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  deleteMediaValidator,
  catchAsync("deleteMedia api", deleteMedia),
);

module.exports = router;
