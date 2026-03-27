const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User ID is required"],
      unique: [true, "Each user can have only one cart"],
    },
    items: {
      type: [
        new mongoose.Schema(
          {
            product_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "product",
              required: [true, "Product ID is required"],
            },
            variant_id: {
              type: mongoose.Schema.Types.ObjectId,
              required: [true, "Variant ID is required"],
            },
            date: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("wishlist", wishlistSchema);
