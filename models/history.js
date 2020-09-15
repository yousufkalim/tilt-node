const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    history: [
      {
        orderId: String,
        order: Schema.Types.Mixed,
        paid: Number,
        status: { type: String, default: "In progress" },
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
