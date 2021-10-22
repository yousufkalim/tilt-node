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
            addOns: [
              {
                name: String,
                choice: [
                  {
                    name: String,
                    price: Number,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    restaurantCarts: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: "Company",
        },
        status: { type: String, default: "In progress" },
        stopped: { type: Boolean, default: false },
        carts: [
          {
            id: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            orderId: { type: String },
            dishes: [
              {
                id: {
                  type: Schema.Types.ObjectId,
                  ref: "Dish",
                },
                count: Number,
                addOns: [
                  {
                    name: String,
                    choice: [
                      {
                        name: String,
                        price: Number,
                      },
                    ],
                  },
                ],
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
