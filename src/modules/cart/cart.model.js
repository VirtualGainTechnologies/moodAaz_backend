const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
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
            sku: {
              type: String,
              required: [true, "SKU is required"],
              uppercase: true,
              trim: true,
            },
            quantity: {
              type: Number,
              default: 1,
              min: [1, "Quantity must be at least 1"],
              max: [10, "Maximum 10 items per product"],
            },
          },
          { _id: false },
        ),
      ],
      default: [],
      validate: {
        validator: (items) => items.length <= 50,
        message: "Cart cannot have more than 50 items",
      },
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("cart", cartSchema);
