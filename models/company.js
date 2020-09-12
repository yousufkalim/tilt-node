const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: String,
    address: {
      street: { type: String },
      city: { type: String },
      zip: { type: String },
      lat: { type: Number },
      long: { type: Number },
    },
    deliveryPlace: String,
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
