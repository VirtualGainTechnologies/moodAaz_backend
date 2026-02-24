const slugify = require("slugify");
const repo = require("./category.repository");
const AppError = require("../../utils/AppError");

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
  const { name, parent } = payload;
  const slug = slugify(name, { lower: true });
  const exists = await repo.findOne({ slug }, "_id", { lean: true });
  if (exists) {
    throw new Error("Category already exists");
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

exports.updateCategory = async (id, name) => {
  const slug = slugify(name, { lower: true });
  return repo.updateById(id, { name, slug }, { new: true });
};

exports.deleteCategory = async (id) => {
  const category = await repo.findById(id, "_id", { lean: true });
  if (!category) {
    throw new AppError(400, "Category not found");
  }
  const children = await repo.findMany({ parent: id }, "_id", { lean: true });
  if (children.length) {
    throw new AppError(400, "Delete child categories first");
  }
  return repo.deleteById(id);
};
