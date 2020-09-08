const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const discountSchema = new Schema(
  {
    leastCartValue: Number,
    discounts: [
      {
        id: { type: String },
        name: { type: String },
        off: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", discountSchema);
