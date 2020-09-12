const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    totalPrice: Number,
    dishes: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: "Dish",
        },
        count: Number,
      },
    ],
    restaurantCart: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: "Company",
        },
        totalPrice: Number,
        count: Number,
        status: String,
        dishes: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            dish: {
              type: Schema.Types.ObjectId,
              ref: "Dish",
            },
            count: Number,
            status: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
