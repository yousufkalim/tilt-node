const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import Models
const User = require("../models/user");

exports.login = async (req, res, next) => {
  // req body values
  const email = req.body.email;
  const password = req.body.password;

  try {
    // find the user with data of everything related to him
    const user = await User.findOne({
      email: email,
      status: { $ne: "deleted" },
    })
      .populate("block")
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("The combination is incorrect, please try again!");
      err.status = 404;
      throw err;
    }
    if (
      (user.role === "restaurant" || user.role === "delivery") &&
      !user.block
    ) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 402;
      throw err;
    }
    // check password to login
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
      const err = new Error("The combination is incorrect, please try again!");
      err.status = 402;
      throw err;
    }
    // generate a jwt token
    var token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.MY_SECRET_KEY
    );
    // response send
    res.status(200).json({ loggedIn: true, user: user, token: token });
  } catch (err) {
    next(err);
  }
};
exports.checkEmail = async (req, res, next) => {
  // req body values
  const email = req.params.email;
  try {
    // find the user with that email if exists
    const user = await User.findOne({ email });
    if (user) {
      // response send
      res.status(200).json({ available: false });
    } else {
      // response send
      res.status(200).json({ available: true });
    }
  } catch (err) {
    next(err);
  }
};
exports.recover = async (req, res, next) => {
  // req body values
  const email = req.body.email;
  try {
    // find the user
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Whoops, no user found with this email!");
      err.status = 404;
      throw err;
    }
    // static password generation
    const generatePassword = "passwordReset12";
    // hash the new password
    const hashedPassword = await bcrypt.hash(generatePassword, 12);
    // update the password and save
    user.password = hashedPassword;
    await user.save();
    // response send
    res.status(201).json({ reset: true });
  } catch (err) {
    next(err);
  }
};
