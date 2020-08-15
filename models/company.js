const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: String,
    address: String,
    deliveryPlace: String,
    block: Number,
    deliveryTime: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
