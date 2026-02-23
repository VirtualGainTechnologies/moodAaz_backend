const mongoose = require("mongoose");

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
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Category", categorySchema);
