const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    name: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      zip: { type: String },
      lat: { type: Number },
      long: { type: Number },
    },
    image: { type: String },
    pickupPlace: { type: String },
    deliveryCost: { type: String },
    dishes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
    },
    menus: [
      {
        type: Schema.Types.ObjectId,
        ref: "Block",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
