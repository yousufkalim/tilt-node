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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("History", HistorySchema);

// person.anything = { x: [3, 4, { y: "changed" }] };
// person.markModified('anything');
// person.save(); // Mongoose will save changes to `anything`

// let x = {a: 1, b: 2, c: 3, z:26};
// let {b, ...y} = x;
