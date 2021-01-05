const bcrypt = require("bcryptjs");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpex = require("imagemin-mozjpeg");
const Stripe = require("stripe");

// Import Models
const User = require("../models/user");
const Dish = require("../models/dish");
const Cart = require("../models/cart");
const History = require("../models/history");
const Block = require("../models/block");
const Texts = require("../utils/Messages");
const { clearFile } = require("../utils/clearFile");

// Profile
exports.getAll = async (req, res, next) => {
  try {
    // get all the restaurants
    const restaurants = await User.find({ role: "restaurant" })
      .populate("block")
      .populate({
        path: "restaurant.dishes",
      })
      .exec();
    if (!restaurants) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(200).json({ restaurants: restaurants });
  } catch (err) {
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const userId = req.userId;
  try {
    const restaurant = await User.findById(userId);
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(200).json({ restaurant: restaurant });
  } catch (err) {
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
    let files;
    if (imagePath !== "") {
      files = await imagemin([imagePath], {
        destination: "data/restaurants",
        plugins: [
          imageminMozjpeg({ quality: 30 }),
          imageminPngquant({
            quality: [0.3, 0.3],
          }),
        ],
      });
    }

    const userCheck = await User.findOne({ email });
    if (userCheck) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const error = new Error(Texts.already_Email);
      error.status = 404;
      throw error;
    }
    const restaurantCheck = await User.findOne({ firstName: name });
    if (restaurantCheck) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const error = new Error(Texts.already_resturent);
      error.status = 404;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const restaurant = new User({
      firstName: name,
      email: email,
      password: hashedPassword,
      status: "active",
      role: "restaurant",
      address: {
        street: JSON.parse(address).street,
        city: JSON.parse(address).city,
        zip: JSON.parse(address).zip,
        lat: 0,
        long: 0,
      },
      restaurant: {
        image: files[0].destinationPath.replace(/\\/g, "/"),
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
    let files;
    if (imagePath !== "") {
      files = await imagemin([imagePath], {
        destination: "data/restaurants",
        plugins: [
          imageminMozjpeg({ quality: 30 }),
          imageminPngquant({
            quality: [0.3, 0.3],
          }),
        ],
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const error = new Error(Texts.Opps);
      error.status = 404;
      throw error;
    }
    if (email !== user.email) {
      const userCheck = await User.findOne({ email: email });
      if (userCheck) {
        if (imagePath !== "") {
          clearFile(files[0].destinationPath);
        }
        const err = new Error(Texts.already_Email);
        err.status = 404;
        throw err;
      }
    }

    user.firstName = name;
    user.email = email;
    user.address.street = JSON.parse(address).street;
    user.address.city = JSON.parse(address).city;
    user.address.zip = JSON.parse(address).zip;
    user.restaurant.pickupPlace = pickupPlace;
    imagePath !== "" &&
      (user.restaurant.image = files[0].destinationPath.replace(/\\/g, "/"));
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
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (checkPassword) {
      const err = new Error(Texts.password_change);
      err.status = 402;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    next(err);
  }
};
exports.deleteRestaurant = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error(Texts.Opps);
      error.status = 404;
      throw error;
    }
    await Promise.all(
      user.restaurant.dishes.map(async (dishId) => {
        let dishDeleted = await Dish.findByIdAndDelete(dishId);
        if (dishDeleted && dishDeleted.image) {
          let isDishes = dishDeleted.image.split("/")[1].split("/")[0];
          if (isDishes === "dishes") {
            clearFile(dishDeleted.image);
          }
        }
      })
    );
    let blockId = user.block;
    user.status = "deleted";
    user.block = undefined;
    user.restaurant.dishes = [];
    const restaurantSaved = await user.save();
    let block = await Block.findById(blockId);
    if (block) {
      let restaurants = block.restaurants;
      restaurants = restaurants.filter(
        (rest) => String(rest) !== String(restaurantSaved._id)
      );
      block.restaurants = restaurants;
      await block.save();
    }

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
      (companyOrder) =>
        companyOrder.company._id.toString() === companyId.toString()
    );

    cart.restaurantCarts[companyIndex].stopped = true;
    await cart.save();
    res.status(200).json({ cart: cart });
  } catch (err) {
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
      (companyOrder) => companyOrder.company.toString() === companyId.toString()
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
    next(err);
  }
};
exports.getHistory = async (req, res, next) => {
  const userId = req.userId;
  try {
    const history = await History.findOne({
      user: userId,
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
      let results = history.restaurantHistory.sort((rowDataA, rowDataB) => {
        if (new Date(rowDataA.completedAt) <= new Date(rowDataB.completedAt))
          return -1;
        if (new Date(rowDataA.completedAt) > new Date(rowDataB.completedAt))
          return 1;
        return 0;
      });
      results = results.reverse(); // descending
      res.status(200).json({ history: results });
    }
  } catch (err) {
    next(err);
  }
};

// Dish
exports.getDishes = async (req, res, next) => {
  const userId = req.userId;
  try {
    const restaurant = await User.findById(userId)
      .populate("restaurant.dishes")
      .exec();
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    let results = restaurant.restaurant.dishes.sort((rowDataA, rowDataB) => {
      if (new Date(rowDataA.createdAt) <= new Date(rowDataB.createdAt))
        return -1;
      if (new Date(rowDataA.createdAt) > new Date(rowDataB.createdAt)) return 1;
      return 0;
    });
    results = results.reverse(); // descending
    restaurant.restaurant.dishes = results;
    res.status(200).json({ dishes: restaurant.restaurant.dishes });
  } catch (err) {
    next(err);
  }
};
exports.getDish = async (req, res, next) => {
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId);
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
exports.addDish = async (req, res, next) => {
  const userId = req.userId;
  const name = req.body.name;
  const price = req.body.price;
  const dishType = req.body.dishType;
  const description = req.body.description;
  const specials = req.body.specials;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
  try {
    let files;
    if (imagePath !== "") {
      files = await imagemin([imagePath], {
        destination: "data/dishes",
        plugins: [
          imageminMozjpeg({ quality: 30 }),
          imageminPngquant({
            quality: [0.3, 0.3],
          }),
        ],
      });
    }
    const restaurant = await User.findById(userId).populate("dishes").exec();
    if (!restaurant) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    restaurant.restaurant.dishes.map((dish) => {
      if (dish.name === name) {
        if (imagePath !== "") {
          clearFile(files[0].destinationPath);
        }
        const err = new Error(Texts.already_dish);
        err.status = 404;
        throw err;
      }
    });
    restaurant.depopulate("dishes");
    const dish = new Dish({
      name: name,
      price: price,
      image:
        imagePath === ""
          ? restaurant.restaurant.image
          : files[0].destinationPath.replace(/\\/g, "/"),
      dishType: dishType,
      specials: JSON.parse(specials),
      description: description,
      restaurant: userId,
    });
    const dishSaved = await dish.save();
    restaurant.restaurant.dishes.push(dishSaved._id);
    await restaurant.save();
    res.status(201).json({ registered: true, dish: dishSaved });
  } catch (err) {
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
  const specials = req.body.specials;
  let imagePath = req.file !== undefined ? req.file.path : "";
  imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));

  try {
    let files;
    if (imagePath !== "") {
      files = await imagemin([imagePath], {
        destination: "data/dishes",
        plugins: [
          imageminMozjpeg({ quality: 30 }),
          imageminPngquant({
            quality: [0.3, 0.3],
          }),
        ],
      });
    }
    const dish = await Dish.findById(dishId);
    if (!dish) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    if (dish.restaurant.toString() !== userId.toString()) {
      if (imagePath !== "") {
        clearFile(files[0].destinationPath);
      }
      const err = new Error(Texts.not_Authorize);
      err.status = 404;
      throw err;
    }
    let isDishes = dish.image !== "" && dish.image.split("/")[1].split("/")[0];
    if (isDishes === "dishes" && imagePath !== "") {
      clearFile(dish.image);
    }
    dish.name = name;
    dish.price = price;
    dish.dishType = dishType;
    dish.description = description;
    dish.specials = JSON.parse(specials);
    imagePath !== "" &&
      (dish.image = files[0].destinationPath.replace(/\\/g, "/"));
    const dishSaved = await dish.save();

    res.status(201).json({ updated: true, dish: dishSaved });
  } catch (err) {
    next(err);
  }
};
exports.deleteDish = async (req, res, next) => {
  const userId = req.userId;
  const dishId = req.params.dishId;
  try {
    const restaurant = await User.findById(userId);
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    const dish = await Dish.findById(dishId);
    if (!dish) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    if (dish.restaurant.toString() !== userId.toString()) {
      const err = new Error(Texts.not_Authorize);
      err.status = 404;
      throw err;
    }
    const dishIndex = restaurant.restaurant.dishes.findIndex(
      (dish) => String(dish) === String(dishId)
    );
    if (dishIndex < 0) {
      const err = new Error(Texts.not_Authorize);
      err.status = 404;
      throw err;
    }

    const dishDeleted = await Dish.findByIdAndDelete(dishId);
    if (!dishDeleted) {
      const error = new Error(Texts.Opps);
      error.status = 404;
      throw error;
    }
    let isDishes =
      dishDeleted.image !== "" && dishDeleted.image.split("/")[1].split("/")[0];
    if (isDishes === "dishes") {
      clearFile(dishDeleted.image);
    }
    const newDishes = restaurant.restaurant.dishes.filter(
      (dish) => String(dish) !== String(dishId)
    );
    restaurant.restaurant.dishes = newDishes;
    await restaurant.save();

    res.status(201).json({ deleted: true, dish: dishDeleted });
  } catch (err) {
    next(err);
  }
};
/////////////////////////////////CREATING and UPDATING STRIPE ACCOUT/////////////////////////////////
exports.editBank = async (req, res, next) => {
  const userId = req.userId;

  const name = req.body.name;
  const phone = req.body.phone;
  const DOB = req.body.DOB;
  const newDOB = new Date(DOB);
  const bankName = req.body.bankName;
  const iban = req.body.iban;
  // const accountNumber = req.body.accountNumber;
  // const routing = req.body.routing;

  try {
    const restaurant = await User.findById(userId).populate("block").exec();
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }

    console.log("restarurnt", restaurant);

    const stripe = Stripe(process.env.STRIPE_URI);

    /////////////////////////////////UPDATING STRIPE ACCOUNT/////////////////////////////////

    const Updateaccount = await stripe.account.update("acct_1I69JCPqYDNw9YZ0", {
      individual: {
        first_name: "Jenny",
        last_name: "Rosen",
        dob: {
          day: 10,
          month: 11,
          year: 1980,
        },
      },
    });

    /////////////////////////////////CREATING STRIPE ACCOUNT/////////////////////////////////
    const account = await stripe.account.create({
      type: "custom",
      country: "FR",
      email: restaurant.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.ip,
        user_agent: null,
      },
      individual: {
        email: restaurant.email,
        first_name: "Jenny",
        last_name: "Rosen",

        phone: phone,
        dob: {
          // day: newDOB.getDate(),
          // month: newDOB.getMonth() + 1,
          // year: newDOB.getFullYear(),
          day: 10,
          month: 11,
          year: 1980,
        },

        address: {
          line1: restaurant.address.street,
          postal_code: parseInt(restaurant.address.zip),
          city: restaurant.address.city,
          country: "FR",
        },
      },
      external_account: {
        object: "bank_account",
        account_number: iban,
        bank_name: bankName,
        country: "FR",
        currency: "eur",
        // object: "bank_account",
        // // data: token.bank_account.id,
        // has_more: false,
        // url: "/v1/accounts/acct_1032D82eZvKYlo2C/external_accounts",
        // country: "FR",
        // currency: "EUR",
        // account_holder_name: restaurant.firstName + " " + restaurant.lastName,
        // account_holder_type: "individual",
        // routing_number: null,
        // account_number: "FR89370400440532013000",
        // iban: "FR1420041010050500013M02606",
        // object: "bank_account",
        // account_holder_name: "test",
        // account_holder_type: "company",
        // bank_name: "STRIPE TEST BANK",
        // country: "US",
        // currency: "usd",
        // customer: "cus_Ifo2fJGpAJQinS",
        // fingerprint: "1JWtPxqbdX5Gamtc",
        // last4: "6789",
        // metadata: {},
        // routing_number: "110000000",
        // status: "new",
      },
    });

    console.log("account", account);

    restaurant.restaurant.bank.name = name;
    restaurant.restaurant.bank.phone = phone;
    restaurant.restaurant.bank.DOB = DOB;
    restaurant.restaurant.bank.bankName = bankName;
    restaurant.restaurant.bank.iban = iban;
    restaurant.restaurant.bank.stripeID = account.id;
    const userSaved = await restaurant.save();

    res.status(201).json({ message: "updated successuflly" });
  } catch (err) {
    next(err);
  }
};

/////////////////////////////////TESTING ACCOUNT VERIFICATION/////////////////////////////////
exports.accounttest = async (req, res, next) => {
  try {
    const stripe = Stripe(process.env.STRIPE_URI);

    const account2 = await stripe.accounts.retrieve(account.id);
    console.log("account", account2);
    res.json({ account: account2 });
  } catch (err) {
    console.log(err);
  }
};
