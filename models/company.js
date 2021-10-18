const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: String,
    deliveryPlace: String,
    street: String,
    city: {
      type: String,
      enum: ["RS", "DU", "FDF", "LAM", "SCH", "SL"],
      required: true,
    },
    deliveryPerson: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
