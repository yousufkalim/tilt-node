const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    totalPrice: Number,
    userCarts: [
      {
        restaurant: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        dishes: [
          {
            id: {
              type: Schema.Types.ObjectId,
              ref: "Dish",
            },
            count: Number,
          },
        ],
      },
    ],
    restaurantCarts: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: { type: String, default: "in progress" },
        stopped: { type: Boolean, default: false },
        carts: [
          {
            id: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            dishes: [
              {
                id: {
                  type: Schema.Types.ObjectId,
                  ref: "Dish",
                },
                count: Number,
              },
            ],
            totalPrice: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
