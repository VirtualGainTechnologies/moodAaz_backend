const slugify = require("slugify");
const repo = require("./category.repository");
const AppError = require("../../utils/AppError");

const buildTree = (categories, parentId = null) => {
  return categories
    .filter((c) => String(c.parent) === String(parentId))
    .map((c) => ({
      ...c.toObject(),
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

exports.getCategoryTree = async () => {
  const categories = await repo.findAll(
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
  return categories;
  return buildTree(categories);
};

exports.updateCategory = async (id, payload) => {
  return repo.updateById(id, payload);
};

exports.deleteCategory = async (id) => {
  const children = await repo.findChildren(id);
  if (children.length) {
    throw new Error("Delete child categories first");
  }
  return repo.deleteById(id);
};
