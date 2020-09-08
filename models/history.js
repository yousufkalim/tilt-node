const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PurchasesSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    histories: [
      {
        orderId: String,
        history: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Purchases", PurchasesSchema);

// person.anything = { x: [3, 4, { y: "changed" }] };
// person.markModified('anything');
// person.save(); // Mongoose will save changes to `anything`

// let x = {a: 1, b: 2, c: 3, z:26};
// let {b, ...y} = x;
