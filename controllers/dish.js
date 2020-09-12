// Import Models
const Dish = require("../models/dish");
const Restaurant = require("../models/restaurant");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const dishes = await Dish.find().populate("restaurant").exec();
    if (!dishes) {
      res.status(200).json({ dishes: [] });
    } else {
      res.status(200).json({ dishes: dishes });
    }
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
      res.status(200).json({ dish: "" });
    } else {
      res.status(200).json({ dish: dish });
    }
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
      res.status(200).json({ dishes: [] });
    } else {
      res.status(200).json({ dishes: dishes });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
exports.addDish = async (req, res, next) => {
  const restaurantId = req.body.restaurantId;
  const name = req.body.name;
  const price = req.body.price;
  const dishType = req.body.dishType;
  const description = req.body.description;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
  try {
    let restaurant = await Restaurant.findById(restaurantId)
      .populate("dishes")
      .exec();
    if (!restaurant) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    restaurant.dishes.map((dish) => {
      if (dish.name === name) {
        const err = new Error("Dish with this name already exists!");
        err.status = 404;
        throw err;
      }
    });
    restaurant.depopulate("dishes");
    const dish = new Dish({
      name: name,
      description: description,
      price: price,
      dishType: dishType,
      image: imagePath,
      restaurant: restaurantId,
    });
    const dishSaved = await dish.save();
    restaurant.dishes.push(dishSaved._id);
    await restaurant.save();
    res.status(201).json({ registered: true, dish: dishSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editDish = async (req, res, next) => {
  const dishId = req.params.dishId;
  const restaurantId = req.body.restaurantId;
  const name = req.body.name;
  const price = req.body.price;
  const dishType = req.body.dishType;
  const description = req.body.description;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));

  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    const dishIndex = restaurant.dishes.findIndex(
      (dish) => String(dish) === String(dishId)
    );
    if (dishIndex < 0) {
      const err = new Error("You are not authorized for this action!");
      err.status = 404;
      throw err;
    }

    dish.name = name;
    dish.price = price;
    dish.dishType = dishType;
    dish.description = description;
    imagePath !== "" && (dish.image = imagePath);
    const dishSaved = await dish.save();

    res.status(201).json({ updated: true, dish: dishSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deleteDish = async (req, res, next) => {
  const dishId = req.params.dishId;
  const restaurantId = req.body.restaurantId;
  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    const dishIndex = restaurant.dishes.findIndex(
      (dish) => String(dish) === String(dishId)
    );
    if (dishIndex < 0) {
      const err = new Error("You are not authorized for this action!");
      err.status = 404;
      throw err;
    }

    const dishDeleted = await Dish.findByIdAndDelete(dishId);
    if (!dishDeleted) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    const newDishes = restaurant.dishes.filter(
      (dish) => String(dish) !== String(dishId)
    );
    restaurant.dishes = newDishes;
    await restaurant.save();

    res.status(201).json({ deleted: true, dish: dishDeleted });
  } catch (err) {
    next(err);
  }
};
