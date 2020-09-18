const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import Models
const User = require("../models/user");

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({
      email: email,
      status: { $ne: "deleted" },
    })
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

    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
      const err = new Error("The combination is incorrect, please try again!");
      err.status = 402;
      throw err;
    }

    var token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.MY_SECRET_KEY
    );
    res.status(200).json({ loggedIn: true, user: user, token: token });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.checkEmail = async (req, res, next) => {
  const email = req.params.email;
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.status(200).json({ available: false });
    } else {
      res.status(200).json({ available: true });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.recover = async (req, res, next) => {
  const email = req.body.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Whoops, no user found with this email!");
      err.status = 404;
      throw err;
    }
    const generatePassword = "passwordReset12";
    const hashedPassword = await bcrypt.hash(generatePassword, 12);
    user.password = hashedPassword;
    await user.save();
    res.status(201).json({ reset: true });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
