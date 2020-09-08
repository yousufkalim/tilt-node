// Import Models
const Dish = require("../models/dish");
const Restaurant = require("../models/restaurant");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const dishes = await Dish.find();
    if (!dishes) {
      const err = new Error("Whoops, there was en error!");
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
    const dish = await Dish.findById(dishId);
    if (!dish) {
      const err = new Error("Whoops, there was en error!");
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

// Posts
exports.addDish = async (req, res, next) => {
  const restaurantId = req.body.restaurantId;
  const name = req.body.name;
  const description = req.body.description;
  const price = req.body.price;
  const dishType = req.body.dishType;
  let imagePath = req.file.path;
  imagePath = imagePath.replace(/\\/g, "/");
  try {
    let restaurant = await Restaurant.findById(restaurantId)
      .populate("dishes")
      .exec();
    if (!restaurant) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    console.log(restaurant);
    restaurant.dishes.map((dish) => {
      if (dish.name === name) {
        const err = new Error("Dish with this name already exists!");
        err.status = 404;
        throw err;
      }
    });
    restaurant.depopulate("dishes");
    console.log(restaurant);
    const dish = new Dish({
      name: name,
      description: description,
      price: price,
      dishType: dishType,
      image: imagePath,
    });
    const dishSaved = await dish.save();
    restaurant.dishes.push(dishSaved._id);
    await restaurant.save();
    res.status(201).json({ dish: dishSaved });
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
  const description = req.body.description;
  const price = req.body.price;
  const dishType = req.body.dishType;
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

    res.status(201).json({ dish: dishSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deleteDish = async (req, res, next) => {
  //   const userId = req.userId;
  const DishId = req.params.DishId;
  const restaurantId = req.body.restaurantId;
  try {
    // const user = await User.findById(userId);
    // if (!user) {
    //   const err = new Error("Whoops, there was en error!");
    //   err.status = 404;
    //   throw err;
    // }
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

    const dishDeleted = await Dish.findByIdAndDelete(DishId);
    if (!dishDeleted) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }

    res.status(201).json({ deleted: true, dish: dishDeleted });
  } catch (err) {
    next(err);
  }
};
