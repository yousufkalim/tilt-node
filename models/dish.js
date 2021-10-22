const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addOnsSchema = new Schema({
  name: String,
  min: Number,
  max: Number,
  choice: [
    {
      name: String,
      price: Number,
    },
  ],
});

const dishSchema = new Schema(
  {
    name: { type: String, required: true },
    isPromoted: { type: Boolean, default: false },
    price: { type: Number, required: true },
    dishType: { type: String, required: true },
    description: { type: String, required: true },
    specials: { type: Array },
    image: { type: String },
    status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    addOns: [addOnsSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);
