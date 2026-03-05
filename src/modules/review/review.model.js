const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      minlength: 10,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
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
    date: {
      type: Number,
      default: Date.now(),
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("review", reviewSchema);
