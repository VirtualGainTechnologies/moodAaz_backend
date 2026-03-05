const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // product
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [300, "Name cannot be longer than 300 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: [true, "Slug should be unique"],
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [20, "Description should be at least 20 characters"],
    },
    short_description: {
      type: String,
      maxlength: [280, "Short description max 280 characters"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: [true, "Category ID is required"],
    },
    category_path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: [true, "At least one category required"],
      },
    ],
    thumbnail: {
      type: String,
      required: [true, "Product thumbnail is required"],
    },
    // attributes
    attributes: {
      brand: {
        type: String,
        default: "MOODAAZ",
      },
      manufacturer: String,
      country_of_origin: String,
      warranty: String,
      care_instructions: String,
    },
    // variants
    has_variants: { type: Boolean, default: false },
    variants: {
      type: [
        new mongoose.Schema(
          {
            sku: {
              type: String,
              required: [true, "SKU is required"],
              uppercase: true,
              trim: true,
            },
            price: {
              type: Number,
              required: [true, "Price is required"],
              min: 0,
            },
            sale_price: {
              type: Number,
              min: 0,
              validate: {
                validator: function (v) {
                  return !v || v < this.price;
                },
                message: "Sale price must be lower than regular price",
              },
            },
            stock: {
              type: Number,
              required: [true, "Stock is required"],
              min: [0, "Stock cannot be negative"],
              default: 0,
            },
            attributes: {
              type: Map,
              of: String, // { color: "Black", size: "M", material: "Cotton" }
              default: {},
            },
            images: {
              type: [String],
              default: [],
            },
          },
          { _id: true },
        ),
      ],
      validate: [
        {
          validator: function (v) {
            return v.length > 0;
          },
          message: "At least one variant is required",
        },
      ],
    },

    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    is_featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_new_arrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_best_seller: {
      type: Boolean,
      default: false,
    },
    is_signature: {
      type: Boolean,
      default: false,
    },

    // ratings
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: (val) => Math.round(val * 10) / 10,
      },
      quantity: {
        type: Number,
        default: 0,
      },
    },

    // physical attributes
    weight_in_grams: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ["cm", "inch"],
        default: "cm",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    date: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// virtuals
productSchema.virtual("in_stock").get(function () {
  return this.has_variants
    ? this.variants.some((v) => v.stock > 0)
    : this.variants[0].stock > 0;
});

// text search index
productSchema.index(
  {
    name: "text",
    description: "text",
    short_description: "text",
  },
  {
    default_language: "english",
    weights: {
      name: 10, // higher priority in search ranking
      description: 5,
      short_description: 3,
    },
  },
);
productSchema.index({ "variants.sku": 1 }, { unique: true });

module.exports = mongoose.model("product", productSchema);
