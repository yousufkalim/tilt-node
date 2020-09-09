const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    plan: String,
    referrals: Number,
    credits: Number,
    status: { type: String, default: "active" },
    role: {
      name: {
        type: String,
        default: "user",
      },
      id: {
        type: String,
      },
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    vouchers: {
      type: Schema.Types.ObjectId,
      ref: "Voucher",
    },
    cart: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
    history: {
      type: Schema.Types.ObjectId,
      ref: "History",
    },
    notifications: [
      {
        title: String,
        description: String,
        status: { type: String, default: "active" },
      },
    ],
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
