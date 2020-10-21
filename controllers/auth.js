const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");

// Import Models
const User = require("../models/user");

exports.login = async (req, res, next) => {
  // req body values
  const email = req.body.email;
  const password = req.body.password;

  try {
    // find the user with data of everything related to him
    let user = await User.findOne({
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
    // Check if the user is assigned a block (for delivery person or restaurant)
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
    if (
      user.user.package &&
      new Date(user.user.packageExpiration) <= new Date()
    ) {
      user.user.package = undefined;
      user.user.credits = undefined;
      user.user.packageExpiration = undefined;
      const savedUser = await user.save();
      res.status(200).json({ loggedIn: true, user: savedUser, token: token });
    } else {
      // response send
      res.status(200).json({ loggedIn: true, user: user, token: token });
    }
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
    var generatedPassword = "";
    var str =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";

    for (i = 1; i <= 10; i++) {
      var char = Math.floor(Math.random() * str.length + 1);
      generatedPassword += str.charAt(char);
    }
    // hash the new password
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    // Email Starts
    const filePath = path.join(__dirname, "../utils/resetPassword.html");
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);
    const replacements = {
      name: user.firstName + " " + user.lastName,
      email: email,
      password: generatedPassword,
      // action_url: "https://condescending-davinci.netlify.app/",
    };
    const htmlToSend = template(replacements);
    var transporter = nodemailer.createTransport({
      // host: 'smtp.mailtrap.io',
      // port: 2525,
      // auth: {
      //   user: 'b33edd77e38c85',
      //   pass: '4f6a254bdb395e',
      // },
      service: "Gmail",
      auth: {
        user: "ariaylake@gmail.com",
        pass: "shutdown12",
      },
    });
    const mailOptions = {
      from: "ariaylake@gmail.com",
      to: "betarid65@gmail.com",
      subject: "Tilt-Password Reset Request",
      // text: url,
      html: htmlToSend,
    };

    await transporter.sendMail(mailOptions);

    // update the password and save
    user.password = hashedPassword;
    await user.save();
    // response send
    res.status(201).json({ reset: true });
  } catch (err) {
    next(err);
  }
};
