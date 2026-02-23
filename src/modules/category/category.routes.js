const router = require("express").Router();

const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catchAsync");
const {
  createCategory,
  getCategoryTree,
  updateCategory,
  deleteCategory,
} = require("./category.controller");
const {
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("./category.validator");

router.post(
  "/create",
  authenticate,
  authorize("SUPER-ADMIN"),
  createCategoryValidator,
  catchAsync("createCategory api", createCategory),
);

router.get(
  "/",
  authenticate,
  authorize("SUPER-ADMIN"),
  catchAsync("getCategoriesTree api", getCategoryTree),
);

router.put(
  "/update/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  updateCategoryValidator,
  catchAsync("updateCategory api", updateCategory),
);
router.delete(
  "/delete/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  deleteCategoryValidator,
  catchAsync("deleteCategory api", deleteCategory),
);

module.exports = router;
