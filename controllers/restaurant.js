// Import Models
const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const Dish = require("../models/dish");
const bcrypt = require("bcryptjs");

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
    res.status(200).json({ restaurant: restaurant });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
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
    const restaurantCheck = await Restaurant.findOne({ name: name });
    if (restaurantCheck) {
      const error = new Error("Restaurant with this name already exists!");
      error.status = 404;
      throw error;
    }
    const restaurant = new Restaurant({
      name: name,
      address: {
        street: JSON.parse(address).street,
        city: JSON.parse(address).city,
        zip: JSON.parse(address).zip,
        lat: 0,
        long: 0,
      },
      image: imagePath,
      pickupPlace: pickupPlace,
    });
    const restaurantSaved = await restaurant.save();
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      status: "pending",
      role: {
        name: "restaurant",
        id: restaurantSaved._id,
      },
    });
    const userSaved = await user.save();

    res.status(201).json({
      registered: true,
      restaurant: {
        email: userSaved.email,
        ...restaurantSaved.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.editRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  const email = req.body.email;
  const name = req.body.name;
  const address = req.body.address;
  const pickupPlace = req.body.pickupPlace;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
  try {
    const user = await User.findOne({ "role.id": restaurantId });
    if (!user) {
      const error = new Error("Email not found!");
      error.status = 404;
      throw error;
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      const error = new Error("Restaurant not found!");
      error.status = 404;
      throw error;
    }

    user.email = email;

    restaurant.name = name;
    restaurant.address.street = JSON.parse(address).street;
    restaurant.address.city = JSON.parse(address).city;
    restaurant.address.zip = JSON.parse(address).zip;
    restaurant.pickupPlace = pickupPlace;
    imagePath !== "" && (restaurant.image = imagePath);
    const userSaved = await user.save();
    let restaurantSaved = await restaurant.save();
    res.status(201).json({
      updated: true,
      restaurant: {
        email: userSaved.email,
        ...restaurantSaved.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Others
exports.deleteRestaurant = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    const user = await User.findOneAndDelete({ "role.id": restaurantId });
    if (!user) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
    if (!restaurant) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    restaurant.dishes.map(async (dishId) => {
      await Dish.findByIdAndDelete(dishId);
    });
    res.status(201).json({ deleted: true, restaurant: restaurant });
  } catch (err) {
    next(err);
  }
};
