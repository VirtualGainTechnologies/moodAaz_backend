const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    product_type: {
      type: String,
      required: true,
      enum: ["CO-ORD SET", "DRESS", "KURTA SET", "KURTA", "SHORT KURTI"],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    details: {
      color: {
        type: [String], 
        required: true,
      },
      fabric: {
        type: String,
        required: true,
      },
      design: String,
      work: String,
      print: String,
      neckline: String,
      sleeves: {
        type: String, 
      },
      fit: {
        type: String, 
      },
      length: {
        type: String, 
      },
      frontDetail: String,
    },
    occasions: {
      type: [String], 
      index: true,
    },
    careInstructions: {
      type: [String],
      required: true,
    },

    // 🔹 Pricing (future ready)
    price: {
      type: Number,
      min: 0,
    },

    // 🔹 Status & Control
    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // 🔹 Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// 🔹 Compound indexes for performance
productSchema.index({ productType: 1, isActive: 1 });
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);
