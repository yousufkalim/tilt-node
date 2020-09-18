// Import Models
const User = require("../models/user");
const Dish = require("../models/dish");
const Cart = require("../models/cart");
const Menu = require("../models/menu");
const History = require("../models/history");
const bcrypt = require("bcryptjs");

// Ctrl + K + 0 to fold all and Ctrl + K + J to unfold all.

// Profile
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

// Ordering
exports.getCart = async (req, res, next) => {
  const userId = req.userId;
  try {
    const cart = await Cart.findOne({
      user: userId,
      "restaurantCarts.status": "In progress",
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

    const history = await History.findOne({ user: userId });
    if (history) {
      history.restaurantHistory.push({
        company: companyCart.company,
        status: "Cooked",
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
            status: "Cooked",
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
exports.getHistory = async (req, res, next) => {
  const userId = req.userId;
  try {
    const history = await History.findOne({
      user: userId,
      // "restaurantHistory.status": { $ne: "In progress" },
    })
      .populate({
        path: "restaurantHistory.company",
        populate: {
          path: "block",
        },
      })
      .populate("restaurantHistory.carts.id")
      .populate("restaurantHistory.carts.dishes.id")
      .exec();
    if (!history) {
      res.status(200).json({ history: [] });
    } else {
      res.status(200).json({ history: history.restaurantHistory });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Menu
exports.getMenuList = async (req, res, next) => {
  const userId = req.userId;
  try {
    const menuList = await Menu.find({
      user: userId,
    })
      .populate("dishes")
      .exec();
    if (!menuList) {
      res.status(200).json({ menuList: [] });
    } else {
      res.status(200).json({ menuList: menuList });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.registerMenu = async (req, res, next) => {
  const userId = req.userId;
  const name = req.body.name;
  const type = req.body.type;
  try {
    let restaurant = await User.findById(userId)
      .populate("restaurant.menus")
      .exec();
    if (!restaurant) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    restaurant.restaurant.menus.map((menu) => {
      if (menu.name === name) {
        const err = new Error("Menu with this name already exists!");
        err.status = 404;
        throw err;
      }
    });
    restaurant.restaurant.depopulate("menus");
    const menu = new Menu({
      user: userId,
      name: name,
      menuType: type,
    });
    const menuSaved = await menu.save();
    restaurant.restaurant.menus.push(menuSaved._id);
    await restaurant.save();
    res.status(201).json({ registered: true, menu: menuSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editMenu = async (req, res, next) => {
  const userId = req.userId;
  const menuId = req.body.menuId;
  const name = req.body.name;
  try {
    let menu = await Menu.findById(menuId).populate("dishes").exec();
    if (!menu) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    menu.name = name;
    const menuSaved = await menu.save();
    res.status(201).json({ updated: true, menu: menuSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getMenu = async (req, res, next) => {
  const userId = req.userId;
  const menuId = req.params.menuId;
  try {
    let menu = await Menu.findById(menuId).populate("dishes").exec();
    if (!menu) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    res.status(201).json({ menu });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.deleteMenu = async (req, res, next) => {
  const userId = req.userId;
  const menuId = req.params.menuId;
  try {
    let menu = await Menu.findByIdAndDelete(menuId);
    if (!menu) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    await Promise.all(
      menu.dishes.map(async (dish) => await Dish.findByIdAndDelete(dish._id))
    );
    res.status(201).json({ deleted: true, menu });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Dish
exports.getDish = async (req, res, next) => {
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId);
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
exports.addDish = async (req, res, next) => {
  const userId = req.userId;
  const name = req.body.name;
  const price = req.body.price;
  const dishType = req.body.dishType;
  const description = req.body.description;
  const menuId = req.body.menuId;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
  try {
    const menu = await Menu.findById(menuId).populate("dishes").exec();
    if (!menu) {
      const err = new Error("Whoops, there was a problem!");
      err.status = 404;
      throw err;
    }
    menu.dishes.map((dish) => {
      if (dish.name === name) {
        const err = new Error("Dish with this name already exists!");
        err.status = 404;
        throw err;
      }
    });
    menu.depopulate("dishes");
    const dish = new Dish({
      name: name,
      price: price,
      menu: menu._id,
      image: imagePath,
      dishType: dishType,
      description: description,
    });
    const dishSaved = await dish.save();
    menu.dishes.push(dishSaved._id);
    await menu.save();
    res.status(201).json({ registered: true, dish: dishSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editDish = async (req, res, next) => {
  const userId = req.userId;
  const dishId = req.body.dishId;
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
exports.deleteDish = async (req, res, next) => {
  const userId = req.userId;
  const menuId = req.params.menuId;
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    const menu = await Menu.findById(menuId);
    if (!menu) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    if (menu.user.toString() !== userId.toString()) {
      const err = new Error("You are not authorized for this action!");
      err.status = 404;
      throw err;
    }
    const dishIndex = menu.dishes.findIndex(
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
    const newDishes = menu.dishes.filter(
      (dish) => String(dish) !== String(dishId)
    );
    menu.dishes = newDishes;
    await menu.save();

    res.status(201).json({ deleted: true, dish: dishDeleted });
  } catch (err) {
    next(err);
  }
};
