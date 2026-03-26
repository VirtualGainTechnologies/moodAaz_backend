const router = require("express").Router();

const { multer, authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const { createMedia, deleteMedia } = require("./media.controller");
const {
  deleteMediaValidator,
  createMediaValidator,
} = require("./media.validator");

router.use(authenticate);
router.use(authorize("SUPER-ADMIN"));

router.post(
  "/",
  multer.single("file"),
  createMediaValidator,
  catchAsync("createMedia api", createMedia),
);

router.delete(
  "/:id",
  deleteMediaValidator,
  catchAsync("deleteMedia api", deleteMedia),
);

module.exports = router;
