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
    article_number: {
      type: String,
      required: [true, "Article number is required"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: [true, "Category ID is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Product thumbnail is required"],
    },
    brand: {
      type: String,
      default: "MOODAAZ",
    },
    country_of_origin: {
      type: String,
      default: "INDIA",
    },
    manufacturer: String,
    warranty: String,
    care_instructions: String,
    attributes: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // variants
    image_attribute: {
      type: String,
      default: "color",
    },
    variants_images: [
      {
        value: String,
        images: [String],
        _id: false,
      },
    ],
    variants: {
      type: [
        new mongoose.Schema({
          sku: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            unique: true,
          },
          attributes: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: new Map(),
            // { color: "Black", size: "M" }
          },
          price: {
            type: Number,
            required: true,
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
            default: 0,
            min: 0,
          },
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
          _id: false,
        }),
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
    total_stock: {
      type: Number,
      default: 0,
      min: 0,
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
    // seo
    seo: {
      meta_title: {
        type: String,
        default: "",
      },
      meta_description: {
        type: String,
        default: "",
      },
      meta_keywords: {
        type: [String],
        default: [],
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DRAFT", "ARCHIVED"],
      default: "ACTIVE",
    },
    date: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// calculate & save total stock
productSchema.pre("save", function () {
  if (!this.variants || this.variants.length === 0) {
    this.total_stock = 0;
    return;
  }
  const totalStock = this.variants.reduce(
    (sum, variant) => sum + (variant.stock || 0),
    0,
  );
  this.total_stock = totalStock;
});

// text search index
productSchema.index(
  {
    name: "text",
    description: "text",
  },
  {
    default_language: "english",
    weights: {
      name: 10, // higher priority in search ranking
      description: 5,
    },
  },
);

module.exports = mongoose.model("product", productSchema);
