const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: String,
    deliveryPlace: String,
    city: {
      type: String,
      enum: ["RS", "DU", "FDF", "LAM"],
      required: true,
    },
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
