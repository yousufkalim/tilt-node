// Import Models
const User = require("../models/user");
const Dish = require("../models/dish");
const Cart = require("../models/cart");
const History = require("../models/history");
const bcrypt = require("bcryptjs");

exports.getAll = async (req, res, next) => {
  try {
    const restaurants = await User.find({ role: "restaurant" });
    if (!restaurants) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ restaurants: restaurants });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const userId = req.userId;
  try {
    const restaurant = await User.findById(userId);
    if (!restaurant) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ restaurant: restaurant });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.registerRestaurant = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const address = req.body.address;
  const pickupPlace = req.body.pickupPlace;
  let imagePath = req.file.path;
  imagePath = imagePath.replace(/\\/g, "/");
  try {
    const userCheck = await User.findOne({ email });
    if (userCheck) {
      const error = new Error("Email already exists!");
      error.status = 404;
      throw error;
    }
    const restaurantCheck = await User.findOne({ firstName: name });
    if (restaurantCheck) {
      const error = new Error("Restaurant with this name already exists!");
      error.status = 404;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const restaurant = new User({
      firstName: name,
      email: email,
      password: hashedPassword,
      status: "pending",
      role: "restaurant",
      address: {
        street: JSON.parse(address).street,
        city: JSON.parse(address).city,
        zip: JSON.parse(address).zip,
        lat: 0,
        long: 0,
      },
      restaurant: {
        image: imagePath,
        pickupPlace: pickupPlace,
      },
    });
    const restaurantSaved = await restaurant.save();

    res.status(201).json({
      registered: true,
      restaurant: restaurantSaved,
    });
  } catch (err) {
    next(err);
  }
};

exports.editRestaurant = async (req, res, next) => {
  const userId = req.userId;
  const email = req.body.email;
  const name = req.body.name;
  const address = req.body.address;
  const pickupPlace = req.body.pickupPlace;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }

    user.firstName = name;
    user.email = email;
    user.address.street = JSON.parse(address).street;
    user.address.city = JSON.parse(address).city;
    user.address.zip = JSON.parse(address).zip;
    user.restaurant.pickupPlace = pickupPlace;
    imagePath !== "" && (user.restaurant.image = imagePath);
    const restaurantSaved = await user.save();
    res.status(201).json({
      updated: true,
      restaurant: restaurantSaved,
    });
  } catch (err) {
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

exports.deleteRestaurant = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    user.status = "deleted";
    const restaurantSaved = await user.save();
    restaurantSaved.restaurant.dishes.map(async (dishId) => {
      await Dish.findByIdAndDelete(dishId);
    });
    res.status(201).json({
      deleted: true,
      restaurant: restaurantSaved,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCart = async (req, res, next) => {
  const userId = req.userId;
  try {
    const cart = await Cart.findOne({
      user: userId,
      "restaurantCarts.status": "in progress",
    })
      .populate({
        path: "restaurantCarts.company",
        populate: {
          path: "block",
        },
      })
      .populate("restaurantCarts.carts.id")
      .populate("restaurantCarts.carts.dishes.id")
      .exec();
    res.status(200).json({ cart: cart });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.stopOrdering = async (req, res, next) => {
  const userId = req.userId;
  const companyId = req.params.companyId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "restaurantCarts.company",
        populate: {
          path: "block",
        },
      })
      .populate("restaurantCarts.carts.id")
      .populate("restaurantCarts.carts.dishes.id")
      .exec();

    const companyIndex = cart.restaurantCarts.findIndex(
      (company) => company.company._id.toString() === companyId.toString()
    );

    cart.restaurantCarts[companyIndex].stopped = true;
    await cart.save();
    res.status(200).json({ cart: cart });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.completeOrder = async (req, res, next) => {
  const userId = req.userId;
  const companyId = req.params.companyId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("restaurantCarts.carts.id")
      .populate("restaurantCarts.carts.dishes.id")
      .exec();

    const companyIndex = cart.restaurantCarts.findIndex(
      (company) => company.company.toString() === companyId.toString()
    );

    const companyCart = cart.restaurantCarts[companyIndex];
    console.log(companyCart);

    const history = await History.findOne({ user: userId });
    if (history) {
      history.restaurantHistory.push({
        company: companyCart.company,
        status: "cooked",
        stopped: companyCart.stopped,
        carts: companyCart.carts,
      });
      const historySaved = await history.save();
      cart.restaurantCarts.pull(companyCart);
      await cart.save();
      res.status(201).json({
        completed: true,
        history: historySaved,
      });
    } else {
      const newHistory = new History({
        user: userId,
        restaurantHistory: [
          {
            company: companyCart.company,
            status: "cooked",
            stopped: companyCart.stopped,
            carts: companyCart.carts,
          },
        ],
      });
      const historySaved = await newHistory.save();
      cart.restaurantCarts.pull(companyCart);
      await cart.save();
      res.status(201).json({
        completed: true,
        history: historySaved,
      });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
