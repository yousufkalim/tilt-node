const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const discountSchema = new Schema(
  {
    leastCartValue: { type: Number, default: 20 },
    referralDiscount: { type: Number, default: 2 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", discountSchema);
