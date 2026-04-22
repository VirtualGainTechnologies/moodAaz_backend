const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User ID is required"],
    },
    method: {
      type: String,
      enum: {
        values: ["COD"], // "RAZORPAY", "STRIPE"
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "PAID", "REFUNDED"],
        message: "Invalid payment status",
      },
      default: "PENDING",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    paid_at: { type: Date },
    refunded_at: { type: Date },
    refund_amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("payment", paymentSchema);
