const mongoose = require("mongoose");

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
    url: {
      type: String,
      required: [true, "URL is required"],
    },
    s3_key: {
      type: String,
      required: [true, "Key is required"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { versionKey: false, timestamps: true },
);

module.exports = mongoose.model("media", mediaSchema);
