const mongoose = require("mongoose");

const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["SOCIAL_ICON", "LOGO", "BANNER"],
        message: "{VALUE} is not supported",
      },
      required: [true, "Type is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    key: {
      type: String,
      required: [true, "Key is required"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

mediaSchema.plugin(require("mongoose-lean-virtuals"));

mediaSchema.virtual("image").get(function () {
  if (!this.key) return null;
  return NODE_ENV === "production"
    ? `${S3_PROD_PUBLIC_BASE_URL}/${this.key}`
    : `${S3_TEST_PUBLIC_BASE_URL}/${this.key}`;
});

module.exports = mongoose.model("media", mediaSchema);
