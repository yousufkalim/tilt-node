const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blockSchema = new Schema(
  {
    name: String,
    orderTime: String,
    pickUpTime: String,
    deliveryTime: String,
    deliveryCost: Number,
    deliveryPerson: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    restaurants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
      },
    ],
    companies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Block", blockSchema);
