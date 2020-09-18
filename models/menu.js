const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const menuSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    menuType: { type: String, required: true },
    dishes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
