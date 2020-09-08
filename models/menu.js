const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dishSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    dishes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);
