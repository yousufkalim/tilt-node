const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import Models
const User = require("../models/user");

exports.checkEmail = async (req, res, next) => {
  const email = req.params.email;
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
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

exports.register = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const companyId = req.body.companyId;
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error("User already exists with that email!");
      err.status = 404;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      companyId: companyId,
    });
    const userSaved = await user.save();

    res.status(200).json({ registered: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      const err = new Error("Your email/password combination is incorrect!");
      err.status = 404;
      throw err;
    }

    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
      const err = new Error("Your email/password combination is incorrect!");
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

exports.editProfile = async (req, res, next) => {
  const userId = req.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const companyId = req.body.companyId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.companyId = companyId;

    const userSaved = await user.save();
    res.status(201).json({ saved: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  const userId = req.userId;
  const password = req.body.password;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (checkPassword) {
      const err = new Error("Change your password to a new one!");
      err.status = 402;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    const userSaved = await user.save();
    res.status(201).json({ saved: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
