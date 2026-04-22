const mongoose = require("mongoose");
const crypto = require("crypto");

const getRandomOrderId = () => {
  return `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
};
const orderItems = new mongoose.Schema(
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
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 1,
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
    },
  },
  { _id: false },
);

const shippingAddress = new mongoose.Schema(
  {
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: [true, "Address ID is required"],
    },
    address_type: {
      type: String,
      enum: {
        values: ["HOME", "WORK", "OTHER"],
        message: "Invalid label",
      },
      required: [true, "Address type is required"],
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
    },
    mobile_number: {
      type: String,
      required: [true, "Mobile number is required"],
    },
    alternate_contact: {
      type: String,
    },
    locallity: {
      type: String,
    },
    full_address: {
      type: String,
      required: [true, "Full address is required"],
    },
    landmark: {
      type: String,
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      unique: true,
      default: getRandomOrderId(),
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User ID is required"],
    },
    items: {
      type: [orderItems],
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    shipping_address: {
      type: shippingAddress,
      required: [true, "Shipping address is required"],
    },
    payment_method: {
      type: String,
      enum: {
        values: ["COD"],
        message: "Invalid payment method",
      },
      default: "COD",
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment",
      default: null,
    },
    items_total: {
      type: Number,
      required: true,
    },
    shipping_charge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
          "RETURN_REQUESTED",
          "RETURNED",
        ],
        message: "Invalid order status",
      },
      default: "PENDING",
    },
    status_history: [
      {
        status: {
          type: String,
        },
        changed_at: {
          type: Date,
          default: new Date().getTime(),
        },
        note: {
          type: String,
        },
        _id: false,
      },
    ],
    delivered_at: {
      type: Date,
    },
    cancelled_at: {
      type: Date,
    },
    cancellation_reason: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("order", orderSchema);
