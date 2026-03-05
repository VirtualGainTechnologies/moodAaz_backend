const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
    title: {
      type: String,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      minlength: 10,
    },
    is_verified_purchase: {
      type: Boolean,
      default: false,
    },
    helpful_votes: {
      type: Number,
      default: 0,
    },
    reported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("review", reviewSchema);
