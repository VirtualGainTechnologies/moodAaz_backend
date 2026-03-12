const slugify = require("slugify");

const repo = require("./category.repository");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");

const buildTree = (categories, parentId = null) => {
  return categories
    .filter((c) => String(c.parent) === String(parentId))
    .map((c) => ({
      _id: c._id,
      name: c.name,
      children: buildTree(categories, c._id),
    }));
};

exports.createCategory = async (payload) => {
  const { name, parent = null } = payload;
  const slug = slugify(name, { lower: true });
  if (await repo.exists({ slug })) {
    throw new AppError(409, "Category already exists");
  }

  let level = 0;
  if (parent) {
    const parentCat = await repo.findById(parent);
    if (!parentCat) {
      throw new Error("Parent category not found");
    }
    level = parentCat.level + 1;
  }

  return repo.create({ ...payload, slug, level });
};

exports.getAllCategories = async () => {
  const categories = await repo.findMany(
    {
      is_active: true,
    },
    "_id name parent",
    {
      lean: true,
    },
  );
  if (!categories) {
    throw new AppError(400, "Failed to get categories");
  }
  return buildTree(categories);
};

exports.getCategoriesByParent = async (parentId) => {
  return repo.findMany({ parent: parentId }, "_id name slug", { lean: true });
};

exports.updateCategory = async (id, name) => {
  const category = await repo.findById(id, "_id", { lean: true });
  if (!category) {
    throw new AppError(404, "Category not found");
  }
  const slug = slugify(name, { lower: true });
  if (await repo.exists({ slug })) {
    throw new AppError(400, "Category name already exists");
  }

  return repo.updateById(id, { name, slug }, { returnDocument: "after" });
};

exports.deleteCategory = async (id) => {
  const category = await repo.findById(id, "_id", { lean: true });
  if (!category) {
    throw new AppError(404, "Category not found");
  }

  const [hasSubcategories, hasProducts] = await Promise.all([
    repo.exists({ parent: id }),
    productRepo.exists({ category_id: id }),
  ]);
  if (hasSubcategories) {
    throw new AppError(400, "Cannot delete category with subcategories");
  }
  if (hasProducts) {
    throw new AppError(400, "Cannot delete category used by products");
  }

  await repo.deleteById(id);
  return true;
};
