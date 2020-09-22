const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    orderHistory: [
      {
        totalPrice: Number,
        paidPrice: Number,
        orderId: String,
        time: { type: Date, default: Date.now },
        completedAt: { type: Date },
        status: { type: String, default: "in progress" },
        order: [
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
      },
    ],
    restaurantHistory: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: { type: String, default: "in progress" },
        stopped: { type: Boolean, default: false },
        orderId: { type: String },
        deliveredAt: { type: Date },
        completedAt: { type: Date, default: Date.now },
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
              },
            ],
            totalPrice: Number,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("History", HistorySchema);
