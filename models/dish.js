const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dishSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    dishType: { type: String, required: true },
    description: { type: String, required: true },
    specials: { type: Array },
    image: { type: String },
    status: { type: String, default: "Active" },
    menu: {
      type: Schema.Types.ObjectId,
      ref: "Menu",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);
