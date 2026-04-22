const router = require("express").Router();

const { multer, authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const { createMedia, deleteMedia, getMedia } = require("./media.controller");
const {
  deleteMediaValidator,
  createMediaValidator,
  getMediaValidator,
} = require("./media.validator");

// router.use(authenticate);
// router.use(authorize("SUPER-ADMIN"));

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

router.get("/", getMediaValidator, catchAsync("getMedia api", getMedia));

module.exports = router;
