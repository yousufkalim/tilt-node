const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const History = require("../models/history");

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ role: "delivery" })
      .populate("block")
      .exec();
    if (!users) {
      const err = new Error("No such user exists!");
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
    const user = await User.findById(userId).populate("block").exec();
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
      role: "delivery",
      deliveryPerson: {
        bank: {
          account: "",
          name: "",
          code: "",
        },
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
exports.editBank = async (req, res, next) => {
  const userId = req.userId;
  const account = req.body.account;
  const name = req.body.name;
  const code = req.body.code;
  try {
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.deliveryPerson.bank.account = account;
    user.deliveryPerson.bank.name = name;
    user.deliveryPerson.bank.code = code;

    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
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
    const user = await User.findById(userId).populate("block").exec();
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
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const deliveryCartToSend = [];

    await Promise.all(
      restaurantsIds.map(async (restaurantId) => {
        const restaurantCart = await History.findOne({ user: restaurantId })
          .populate({
            path: "user",
            populate: {
              path: "block",
            },
          })
          .populate("restaurantHistory.company")
          .populate("restaurantHistory.carts.id")
          .populate("restaurantHistory.carts.dishes.id")
          .exec();
        const restaurantCartToAdd = [];
        restaurantCart.restaurantHistory.map((restaurantHist) => {
          companiesIds.map((companyId) => {
            if (
              restaurantHist.company._id.toString() === companyId.toString() &&
              (restaurantHist.status === "Cooked" ||
                restaurantHist.status === "Picked")
            ) {
              restaurantCartToAdd.push(restaurantHist);
            }
          });
        });
        deliveryCartToSend.push({
          historyId: restaurantCart._id,
          restaurant: restaurantCart.user,
          history: restaurantCartToAdd,
        });
      })
    );

    res.status(200).json({ deliveryCart: deliveryCartToSend, companiesIds });
  } catch (err) {
    next(err);
  }
};
exports.pickDelivery = async (req, res, next) => {
  let userId = req.userId;
  const restaurantId = req.body.restaurantId;
  const companiesIds1 = req.body.companiesIds;
  try {
    const restaurantCart1 = await History.findOne({ user: restaurantId });
    const newHistory = [];

    //  working even without this new Array and pushing into it the elements
    // map is storing the new values when status is changed to Picked
    restaurantCart1.restaurantHistory.map((history) => {
      companiesIds1.map((companyId) => {
        if (history.company.toString() === companyId.toString()) {
          history.status = "Picked";
        }
      });
      newHistory.push(history);
    });
    restaurantCart1.restaurantHistory = newHistory;
    await restaurantCart1.save();
    //
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const deliveryCartToSend = [];

    await Promise.all(
      restaurantsIds.map(async (restaurantId) => {
        const restaurantCart = await History.findOne({ user: restaurantId })
          .populate({
            path: "user",
            populate: {
              path: "block",
            },
          })
          .populate("restaurantHistory.company")
          .populate("restaurantHistory.carts.id")
          .populate("restaurantHistory.carts.dishes.id")
          .exec();
        const restaurantCartToAdd = [];
        restaurantCart.restaurantHistory.map((restaurantHist) => {
          companiesIds.map((companyId) => {
            if (
              restaurantHist.company._id.toString() === companyId.toString() &&
              (restaurantHist.status === "Cooked" ||
                restaurantHist.status === "Picked")
            ) {
              restaurantCartToAdd.push(restaurantHist);
            }
          });
        });
        deliveryCartToSend.push({
          historyId: restaurantCart._id,
          restaurant: restaurantCart.user,
          history: restaurantCartToAdd,
        });
      })
    );

    res.status(200).json({ deliveryCart: deliveryCartToSend, companiesIds });
  } catch (err) {
    next(err);
  }
};
exports.deliverDelivery = async (req, res, next) => {
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
