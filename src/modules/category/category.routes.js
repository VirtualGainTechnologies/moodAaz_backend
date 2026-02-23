const router = require("express").Router();
const { catchAsync } = require("../../utils/catchAsync");
const { createCategory, getCategoryTree } = require("./category.controller");
const {
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("./category.validator");

router.post(
  "/create",
  createCategoryValidator,
  catchAsync("createCategory api", createCategory),
);

router.get("/", catchAsync("getCategoriesTree api", getCategoryTree));

// router.put(
//   "/:id",
//   updateCategoryValidator,
//   validate,
//   controller.updateCategory,
// );

// router.delete(
//   "/:id",
//   deleteCategoryValidator,
//   validate,
//   controller.deleteCategory,
// );

module.exports = router;
