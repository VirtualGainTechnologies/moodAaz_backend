const slugify = require("slugify");

const repo = require("./category.repository");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");
const { uploadPublicFile, deleteFile } = require("../../services");

const buildTree = (categories, parentId = null) => {
  return categories
    .filter((c) => String(c.parent) === String(parentId))
    .map((c) => ({
      _id: c._id,
      name: c.name,
      category_image: c.category_image,
      children: buildTree(categories, c._id),
    }));
};

exports.createCategory = async (payload, file) => {
  const { name, parent = null } = payload;
  if (!file) {
    throw new AppError(400, "Category image is required");
  }

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

  const { key } = await uploadPublicFile(file, "category-image", 5);
  return repo.create({ ...payload, slug, level, image: key });
};

exports.getAllCategories = async () => {
  const categories = await repo.findMany(
    {
      is_active: true,
    },
    "_id name parent image",
    {
      lean: { virtuals: true },
    },
  );
  if (!categories) {
    throw new AppError(400, "Failed to get categories");
  }
  return buildTree(categories);
};

exports.getCategoriesByParent = async (parentId) => {
  return repo.findMany({ parent: parentId }, "_id name slug image", {
    lean: { virtuals: true },
  });
};

exports.updateCategory = async (payload) => {
  const { id, name, image } = payload;
  if (!name && !image) {
    throw new AppError(400, "Nothing to update");
  }

  const updateData = {};
  const category = await repo.findById(id, "_id image", { lean: true });
  if (!category) {
    throw new AppError(404, "Category not found");
  }

  if (name) {
    const slug = slugify(name, { lower: true });
    if (await repo.exists({ slug })) {
      throw new AppError(400, "Category name already exists");
    }
    updateData.name = name;
    updateData.slug = slug;
  }

  if (image) {
    await deleteFile(category.image);
    const { key } = await uploadPublicFile(image, "category-image", 5);
    updateData.image = key;
  }

  return repo.updateById(id, updateData, { returnDocument: "after" });
};

exports.deleteCategory = async (id) => {
  const category = await repo.findById(id, "_id image", { lean: true });
  if (!category) {
    throw new AppError(404, "Category not found");
  }

  const [hasSubcategories, hasProducts] = await Promise.all([
    repo.exists({ parent: id }),
    productRepo.exists({ category_path: id }),
  ]);
  if (hasSubcategories) {
    throw new AppError(400, "Cannot delete category with subcategories");
  }
  if (hasProducts) {
    throw new AppError(400, "Cannot delete category used by products");
  }

  if (category.image) {
    await deleteFile(category.image);
  }
  await repo.deleteById(id);
  return true;
};
