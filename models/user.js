const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    userCode: String,
    email: String,
    password: String,
    address: {
      street: { type: String },
      city: { type: String },
      zip: { type: String },
      lat: { type: Number },
      long: { type: Number },
    },
    expoToken: String,
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
      affiliateCode: { type: String },
      referrals: { type: Number, default: 0 },
      package: {
        type: Schema.Types.ObjectId,
        ref: "Package",
      },
      packageExpiration: { type: Date },
      credits: { type: Number },
      cart: {
        type: Schema.Types.ObjectId,
        ref: "Cart",
      },
      company: {
        type: Schema.Types.ObjectId,
        ref: "Company",
      },
      creditCard: {
        number: String,
        date: String,
        year: String,
        code: String,
        name: String,
      },
    },
    restaurant: {
      isPremium: { type: Boolean, default: false },
      promotedDishes: [
        {
          type: Schema.Types.ObjectId,
          ref: "Dish",
        },
      ],
      reviews: [
        {
          type: Schema.Types.ObjectId,
          ref: "Review",
        },
      ],
      googleLink: { type: String },
      image: { type: String },
      ratings: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          rating: { type: Number, default: 0 },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      pickupPlace: { type: String },
      deliveryCost: { type: String },
      dishes: [
        {
          type: Schema.Types.ObjectId,
          ref: "Dish",
        },
      ],
      bank: {
        phone: String,
        DOB: Date,
        bankName: String,
        iban: String,
        stripeID: String,
        front: String,
        back: String,
      },
    },
    deliveryPerson: {
      bank: {
        phone: String,
        DOB: Date,
        bankName: String,
        iban: String,
        stripeID: String,
        front: String,
        back: String,
      },
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

// Course
//         .findById(req.params.courseId)
//         .populate({
//             path: 'classes',
//             model: 'Classroom',
//             populate: {
//                 path: 'instructors',
//                 model: 'User'
//             }
//         })
//         .exec(function(err, cour) {
//             if (err)
//                 console.log(err);
//             else {
//                 Course.populate(cour,
//                     {
//                         path: 'classes.location',
//                         model: 'Location',
//                     }, function(err, c1) {
//                         if (err)
//                             console.log(err);
//                         else
//                             console.log(util.inspect(c1, { showHidden: true, depth: null }));
//                     })
//             }
//         })

// company: this
// company: [UserSchema]

// person.anything = { x: [3, 4, { y: "changed" }] };
// person.markModified('anything');
// person.save(); // Mongoose will save changes to `anything`

// let x = {a: 1, b: 2, c: 3, z:26};
// let {b, ...y} = x;
