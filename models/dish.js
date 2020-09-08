const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dishSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountedPrice: { type: Number },
    onPromotion: { type: Boolean },
    dishType: { type: String, required: true },
    image: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);
