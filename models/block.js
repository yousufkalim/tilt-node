const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blockSchema = new Schema(
  {
    name: String,
    pickupTime: String,
    deliveryTime: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Block", blockSchema);
