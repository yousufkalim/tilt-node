// Import Models
const Dish = require("../models/dish");
const User = require("../models/user");
const Texts = require("../utils/Messages");
// Gets
exports.getAll = async (req, res, next) => {
  try {
    // find all the dishes with it's restaurant
    const dishes = await Dish.find().populate("restaurant").exec();
    if (!dishes) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // response send
    res.status(200).json({ dishes: dishes });
  } catch (err) {
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const dishId = req.params.dishId;
  try {
    // find the dish with it's restaurant
    const dish = await Dish.findById(dishId).populate("restaurant").exec();
    if (!dish) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(200).json({ dish: dish });
  } catch (err) {
    next(err);
  }
};
exports.getAllByRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    // find all the dish of a restaurant
    const dishes = await Dish.find({ restaurant: restaurantId })
      .populate("restaurant")
      .exec();
    if (!dishes) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(200).json({ dishes: dishes });
  } catch (err) {
    next(err);
  }
};
