const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      lat: { type: Number, required: true },
      long: { type: Number, required: true },
    },
    image: { type: String, required: true },
    pickupPlace: { type: String, required: true },
    deliveryCost: { type: String, required: true },
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
