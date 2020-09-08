const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    off: { type: Number, required: true },
    count: { type: Number, required: true },
    status: { type: String, required: true },
    expiration: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);
