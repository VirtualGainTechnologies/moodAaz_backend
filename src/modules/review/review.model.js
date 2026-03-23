const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    images: [String],
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: [true, "Product id is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User id is required"],
    },
    votes: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    is_verified_purchase: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    date: {
      type: Number,
      default: Date.now(),
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("review", reviewSchema);
