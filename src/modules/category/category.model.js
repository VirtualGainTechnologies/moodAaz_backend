const mongoose = require("mongoose");

const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is a required field"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is a required field"],
      unique: true,
      lowercase: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    level: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

categorySchema.plugin(require("mongoose-lean-virtuals"));

categorySchema.virtual("category_image").get(function () {
  if (!this.image) return null;
  return NODE_ENV === "production"
    ? `${S3_PROD_PUBLIC_BASE_URL}/${this.image}`
    : `${S3_TEST_PUBLIC_BASE_URL}/${this.image}`;
});

module.exports = mongoose.model("category", categorySchema);
