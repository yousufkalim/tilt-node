const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Cart = require("../models/cart");
const History = require("../models/history");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ "role.name": "user" })
      .populate("package")
      .populate({
        path: "company",
        populate: { path: "block" },
      })
      .populate({
        path: "cart",
        populate: { path: "dishes.id" },
      })
      .exec();
    if (!users) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ users: users });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getProfile = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId)
      .populate("package")
      .populate({
        path: "company",
        populate: { path: "block" },
      })
      .populate({
        path: "cart",
        populate: { path: "dishes.id" },
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
exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId)
      .populate("package")
      .populate({
        path: "company",
        populate: { path: "block" },
      })
      .populate({
        path: "cart",
        populate: { path: "dishes.id" },
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
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      company: companyId,
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
exports.editUser = async (req, res, next) => {
  const userId = req.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId)
      .populate("package")
      .populate({
        path: "company",
        populate: { path: "block" },
      })
      .populate({
        path: "cart",
        populate: { path: "dishes.id" },
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

// Others
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
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

exports.addToCart = async (req, res, next) => {
  const userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  const dishCount = req.body.dishCount;
  try {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      // Cart found
      const dishIndex = cart.dishes.findIndex(
        (dish) => String(dish.id._id) === String(dishId)
      );
      if (dishIndex < 0) {
        // dish not found
        cart.totalPrice += +dishPrice * +dishCount;
        cart.dishes.push({
          id: dishId,
          count: +dishCount,
        });
        const cartSaved = await cart.save();
        const cartToSend = await Cart.findById(cartSaved._id)
          .populate("dishes.id")
          .exec();
        res.status(201).json({ added: true, cart: cartToSend });
      } else {
        // dish found
        cart.dishes[dishIndex].count += +dishCount;
        cart.totalPrice += +dishPrice * +dishCount;
        const cartSaved = await cart.save();
        const cartToSend = await Cart.findById(cartSaved._id)
          .populate("dishes.id")
          .exec();
        res.status(201).json({ added: true, cart: cartToSend });
      }
    } else {
      const newCart = new Cart({
        user: userId,
        totalPrice: +dishPrice * +dishCount,
        dishes: [
          {
            id: dishId,
            count: +dishCount,
          },
        ],
      });
      const cartSaved = await newCart.save();
      const user = await User.findById(userId);
      user.cart = newCart._id;
      await user.save();
      const cartToSend = await Cart.findById(cartSaved._id)
        .populate("dishes.id")
        .exec();
      res.status(201).json({ added: true, cart: cartToSend });
    }
  } catch (err) {
    next(err);
  }
};

// Remove dish
exports.removeFromCart = async (req, res, next) => {
  let userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("dishes.id")
      .exec();
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    let dishIndex = cart.dishes.findIndex(
      (dish) => String(dish.id._id) === String(dishId)
    );
    if (dishIndex < 0) {
      const error = new Error("No such dish found!");
      error.status = 404;
      throw error;
    }
    cart.totalPrice -= +dishPrice * +cart.dishes[dishIndex].count;
    cart.dishes = cart.dishes.filter(
      (dish) => String(dish.id._id) !== String(dishId)
    );
    const cartSaved = await cart.save();
    res.status(201).json({ removed: true, cart: cartSaved });
  } catch (err) {
    next(err);
  }
};
// Get Cart
exports.getCart = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("dishes.id")
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

exports.order = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("dishes.id")
      .populate({
        path: "user",
        populate: {
          path: "package",
          path: "company",
          populate: {
            path: "block",
          },
        },
      })
      .exec();
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    let totalPrice = cart.totalPrice + cart.user.company.block.deliveryCost;
    const user = await User.findById(cart.user._id);
    if (user.credits && user.credits > 0) {
      let offPrice = cart.user.package.offPrice;
      totalPrice -= offPrice;
      user.credits -= 1;
    }
    if (user.referrals && user.referrals > 0) {
      let referralOff = 2;
      totalPrice -= referralOff;
      user.referrals -= 1;
    }

    const history = await History.findOne({ user: userId });
    let orderId = "3920023804923409234";
    if (history) {
      history.history.push({
        orderId: orderId,
        order: cart.toObject(),
        paid: totalPrice,
      });
      history.markModified("history.order");
      const historySaved = await history.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({ ordered: true, history: historySaved, orderId });
    } else {
      const newHistory = new History({
        user: userId,
        history: [
          {
            orderId: orderId,
            order: cart.toObject(),
            paid: totalPrice,
          },
        ],
      });
      newHistory.markModified("history.order");
      const historySaved = await newHistory.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({ ordered: true, history: historySaved, orderId });
    }
  } catch (err) {
    next(err);
  }
};

// Get purchases
exports.orders = async (req, res, next) => {
  let userId = req.userId;
  try {
    const history = await History.findOne({ user: userId });
    if (!history) {
      res.status(200).json({ history: "" });
    } else {
      res.status(200).json({ history: history });
    }
  } catch (err) {
    next(err);
  }
};
