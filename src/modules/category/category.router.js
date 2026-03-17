const router = require("express").Router();

const { authenticate, authorize, multer } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  createCategory,
  getAllCategories,
  getSubCategories,
  updateCategory,
  deleteCategory,
  getMainCategories,
} = require("./category.controller");
const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
} = require("./category.validator");

router.post(
  "/create",
  authenticate,
  authorize("SUPER-ADMIN"),
  multer.single("image"),
  createCategoryValidator,
  catchAsync("createCategory api", createCategory),
);

router.get("/", catchAsync("getAllCategories api", getAllCategories));

router.get("/main", catchAsync("getMainCategories api", getMainCategories));

router.get(
  "/:id/subcategories",
  categoryIdParamValidator,
  catchAsync("getSubCategories api", getSubCategories),
);

router.put(
  "/update/:id",
  // authenticate,
  // authorize("SUPER-ADMIN"),
  multer.single("image"),
  updateCategoryValidator,
  catchAsync("updateCategory api", updateCategory),
);

router.delete(
  "/delete/:id",
  // authenticate,
  // authorize("SUPER-ADMIN"),
  categoryIdParamValidator,
  catchAsync("deleteCategory api", deleteCategory),
);

module.exports = router;
