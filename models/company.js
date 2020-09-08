const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: String,
    address: String,
    deliveryPlace: String,
    deliveryGuy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
