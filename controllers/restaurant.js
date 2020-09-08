// Import Models
const Restaurant = require("../models/restaurant");
const Dish = require("../models/dish");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find();
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
  const restaurantId = req.params.restaurantId;
  try {
    const restaurant = await Restaurant.findById(restaurantId);
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

// Posts
exports.addRestaurant = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const address = req.body.address;
  const pickupPlace = req.body.pickupPlace;
  let imagePath = req.file.path;
  imagePath = imagePath.replace(/\\/g, "/");
  try {
    const restaurantCheck = await Restaurant.findOne({ name: name });
    if (restaurantCheck) {
      const err = new Error("Restaurant already exists with that name!");
      err.status = 404;
      throw err;
    }
    const restaurant = new Restaurant({
      name: name,
      description: description,
      address: {
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        lat: address.lat,
        long: address.long,
      },
      pickupPlace: pickupPlace,
      image: imagePath,
    });
    const restaurantsaved = await restaurant.save();
    res.status(201).json({ restaurant: restaurantsaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  const name = req.body.name;
  const description = req.body.description;
  const address = req.body.address;
  const pickupPlace = req.body.pickupPlace;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    restaurant.name = name;
    restaurant.description = description;
    restaurant.address.street = address.street;
    restaurant.address.city = address.city;
    restaurant.address.postalCode = address.postalCode;
    restaurant.address.lat = address.lat;
    restaurant.address.long = address.long;
    restaurant.pickupPlace = pickupPlace;
    imagePath !== "" && (restaurant.image = imagePath);

    const restaurantsaved = await restaurant.save();

    res.status(201).json({ restaurant: restaurantsaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deleteRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
    if (!restaurant) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    restaurant.dishes.map(dishId => {
      await Dish.findByIdAndDelete(dishId);
    })
    res.status(201).json({ deleted: true, restaurant: restaurant });
  } catch (err) {
    next(err);
  }
};
