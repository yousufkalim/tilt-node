const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    address: {
      street: { type: String },
      city: { type: String },
      zip: { type: String },
      lat: { type: Number },
      long: { type: Number },
    },
    status: { type: String, default: "active" },
    block: {
      type: Schema.Types.ObjectId,
      ref: "Block",
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
    role: {
      type: String,
      default: "user",
    },
    user: {
      referrals: { type: Number, default: 0 },
      credits: { type: Number, default: 0 },
      package: {
        type: Schema.Types.ObjectId,
        ref: "Package",
      },
      cart: {
        type: Schema.Types.ObjectId,
        ref: "Cart",
      },
      company: this,
      // company: [UserSchema]
    },
    restaurant: {
      image: { type: String },
      pickupPlace: { type: String },
      deliveryCost: { type: String },
      dishes: [
        {
          type: Schema.Types.ObjectId,
          ref: "Dish",
        },
      ],
      menus: [
        {
          type: Schema.Types.ObjectId,
          ref: "Menu",
        },
      ],
    },
    company: {
      deliveryPlace: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

// function obfuscate(cc) {
//   return "****-****-****-" + cc.slice(cc.length - 4, cc.length);
// }

// var AccountSchema = new Schema({
//   creditCardNumber: { type: String, get: obfuscate },
// });

// var Account = mongoose.model("Account", AccountSchema);

// Account.findById(someId, function (err, found) {
//   console.log(found.creditCardNumber); // '****-****-****-1234'
// });
