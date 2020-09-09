const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    offPrice: { type: Number, required: true },
    credits: { type: Number, required: true },
    expiration: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
