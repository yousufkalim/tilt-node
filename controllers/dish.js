// Import Models
const Dish = require("../models/dish");
const User = require("../models/user");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const dishes = await Dish.find().populate("restaurant").exec();
    if (!dishes) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ dishes: dishes });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId).populate("restaurant").exec();
    if (!dish) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ dish: dish });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getAllByRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    const dishes = await Dish.find({ restaurant: restaurantId })
      .populate("restaurant")
      .exec();
    if (!dishes) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ dishes: dishes });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
