const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const History = require("../models/history");

exports.getProfile = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId)
      .populate("user.block")
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
      const err = new Error("No such user exists!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ user: user });
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
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.registerUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const companyId = req.body.companyId;
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error("Email already exists!");
      err.status = 404;
      throw err;
    }
    let referralCode = "0000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      user: {
        affiliateCode: referralCode,
        company: companyId,
      },
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
exports.editProfile = async (req, res, next) => {
  const userId = req.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId)
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
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.deleteProfile = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.status = "deleted";
    const userSaved = await user.save();
    res.status(201).json({
      deleted: true,
      user: userSaved,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDeliveries = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("userCarts.restaurant")
      .populate("userCarts.dishes.id")
      .exec();
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    res.status(200).json({ cart: cart });
  } catch (err) {
    next(err);
  }
};
exports.removeDelivery = async (req, res, next) => {
  let userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  try {
    const cart = await Cart.findOne({ user: userId });
    const dish = await Dish.findById(dishId);
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }

    let restaurantCartIndex = cart.userCarts.findIndex(
      (element) => element.restaurant.toString() === dish.restaurant.toString()
    );
    if (restaurantCartIndex < 0) {
      const error = new Error("No such dish, found!");
      error.status = 404;
      throw error;
    }
    let dishIndex = cart.userCarts[restaurantCartIndex].dishes.findIndex(
      (dish) => String(dish.id) === String(dishId)
    );
    if (dishIndex < 0) {
      const error = new Error("No such dish found!");
      error.status = 404;
      throw error;
    }
    cart.totalPrice -=
      +dishPrice * +cart.userCarts[restaurantCartIndex].dishes[dishIndex].count;
    cart.userCarts[restaurantCartIndex].dishes = cart.userCarts[
      restaurantCartIndex
    ].dishes.filter((dish) => String(dish.id) !== String(dishId));
    const cartSaved = await cart.save();
    const cartToSend = await Cart.findById(cartSaved._id)
      .populate("userCarts.restaurant")
      .populate("userCarts.dishes.id")
      .exec();
    res.status(201).json({ removed: true, cart: cartToSend });
  } catch (err) {
    next(err);
  }
};
exports.getHistory = async (req, res, next) => {
  let userId = req.userId;
  try {
    const history = await History.findOne({ user: userId })
      .populate("user")
      .populate("orderHistory.order.restaurant")
      .populate("orderHistory.order.dishes.id")
      .exec();
    if (!history) {
      res.status(200).json({ history: "" });
    } else {
      res.status(200).json({ history: history });
    }
  } catch (err) {
    next(err);
  }
};
