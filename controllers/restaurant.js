const bcrypt = require("bcryptjs");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpeg = require("imagemin-mozjpeg");
const Stripe = require("stripe");
const moment = require("moment");

// Import Models
const User = require("../models/user");
const Dish = require("../models/dish");
const Cart = require("../models/cart");
const History = require("../models/history");
const Block = require("../models/block");
const Texts = require("../utils/Messages");
const { clearFile } = require("../utils/clearFile");
const { findByIdAndUpdate } = require("../models/user");

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
  const googleLink = req.body.googleLink;
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
        googleLink: googleLink,
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
  const googleLink = req.body.googleLink;
  const isPremium = req.body.isPremium;

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
    user.restaurant.googleLink = googleLink;
    user.restaurant.isPremium = isPremium;

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
exports.changeDishStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const dishId = req.body.dishId;
    const dishStatus = req.body.status;

    const dish = await Dish.findByIdAndUpdate(
      dishId,
      { $set: { status: dishStatus } },
      { new: true }
    );
    if (!dish) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(201).json({ dish });
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
  try {
    const userId = req.userId;
    const name = req.body.name;
    const price = req.body.price;
    const dishType = req.body.dishType;
    const description = req.body.description;
    const specials = req.body.specials;
    let imagePath = req.file !== undefined ? req.file.path : "";
    imagePath !== "" && (imagePath = imagePath.replace(/\\/g, "/"));
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

  const isPromoted = req.body.isPromoted;
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
    let tempRes = await Dish.find({
      $and: [{ restaurant: userId }, { isPromoted: true }],
    });
    let length = tempRes.length;
    if (length == 4) {
      res.status(201).json({ message: "You can only promote dishes upto 4 " });
    } else {
      if (dish.restaurant.toString() !== userId.toString()) {
        if (imagePath !== "") {
          clearFile(files[0].destinationPath);
        }
        const err = new Error(Texts.not_Authorize);
        err.status = 404;
        throw err;
      }
      let isDishes =
        dish.image !== "" && dish.image.split("/")[1].split("/")[0];
      if (isDishes === "dishes" && imagePath !== "") {
        clearFile(dish.image);
      }
      dish.name = name;
      dish.isPromoted = isPromoted;
      dish.price = price;
      dish.dishType = dishType;
      dish.description = description;
      // dish.specials = specials;
      dish.specials = JSON.parse(specials);
      imagePath !== "" &&
        (dish.image = files[0].destinationPath.replace(/\\/g, "/"));
      const dishSaved = await dish.save();

      res.status(201).json({ updated: true, dish: dishSaved });
    }
  } catch (err) {
    res.status(404).json({ message: err.message });

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

/////////////////////////////////CREATING STRIPE ACCOUT/////////////////////////////////
exports.addBank = async (req, res, next) => {
  try {
    const userId = req.userId;
    const phone = req.body.phone;
    const DOB = JSON.parse(req.body.DOB);
    const newDOB = {
      day: parseInt(moment(DOB).format("DD")),
      month: parseInt(moment(DOB).format("MM")),
      year: parseInt(moment(DOB).format("YYYY")),
    };
    const bankName = req.body.bankName;
    const iban = req.body.iban;
    const stripeid = req.body.stripeID;
    console.log(stripeid);

    let front =
      req.files["front"] !== undefined ? req.files["front"][0].path : "";
    front !== "" && (front = front.replace(/\\/g, "/"));

    let back = req.files["back"] !== undefined ? req.files["back"][0].path : "";
    back !== "" && (back = back.replace(/\\/g, "/"));

    console.log("front", front, back);

    const restaurant = await User.findById(userId).populate("block").exec();
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }

    const stripe = Stripe(process.env.STRIPE_URI);

    const fs = require("fs");
    var fp = fs.readFileSync(front);
    var bk = fs.readFileSync(back);

    var fileFront = await stripe.files.create({
      purpose: "additional_verification",
      file: {
        data: fp,
        name: req.files["front"][0].filename,
        type: "application/octet-stream",
      },
    });
    var fileBack = await stripe.files.create({
      purpose: "additional_verification",
      file: {
        data: bk,
        name: req.files["back"][0].filename,
        type: "application/octet-stream",
      },
    });

    const token = await stripe.tokens.create({
      account: {
        tos_shown_and_accepted: true,
        business_type: "individual",
        individual: {
          email: restaurant.email,
          first_name: restaurant.firstName,
          last_name: restaurant.firstName,

          phone: phone,
          dob: newDOB,

          address: {
            line1: restaurant.address.street,
            postal_code: parseInt(restaurant.address.zip),
            city: restaurant.address.city,
            country: "FR",
          },
          verification: {
            additional_document: {
              back: fileBack.id,
              details: "Use document for front and back",
              front: fileFront.id,
            },
          },
        },
      },
    });

    const account = await stripe.account.create({
      type: "custom",
      country: "FR",
      account_token: token.id,
      email: restaurant.email,
      business_profile: {
        name: restaurant.name,
        mcc: "7011",
        url: "http://google.com",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      external_account: {
        object: "bank_account",
        account_number: iban,
        //test account_number: "FR1420041010050500013M02606",
        bank_name: bankName,
        country: "FR",
        currency: "eur",
      },
    });
    restaurant.restaurant.bank.phone = phone;
    restaurant.restaurant.bank.DOB = DOB;
    restaurant.restaurant.bank.bankName = bankName;
    restaurant.restaurant.bank.iban = iban;
    restaurant.restaurant.bank.stripeID = account.id;
    restaurant.restaurant.bank.front = front;
    restaurant.restaurant.bank.back = back;

    // restaurant.restaurant.bank.front = {
    //   uri: req.files["front"][0].path,
    //   name: req.files["front"][0].filename,
    //   type: "application/octet-stream",
    // };
    // restaurant.restaurant.bank.back = {
    //   uri: req.files["back"][0].path,
    //   name: req.files["back"][0].filename,
    //   type: "application/octet-stream",
    // };

    // restaurant.restaurant.bank = {
    //   ...restaurant.restaurant.bank,
    //   front: {
    //     uri: front,
    //     name: req.files["front"][0].filename,
    //     type: "application/octet-stream",
    //   },
    //   back: {
    //     uri: back,
    //     name: req.files["back"][0].filename,
    //     type: "application/octet-stream",
    //   },
    // };
    const userSaved = await restaurant.save();

    res
      .status(201)
      .json({ message: "updated successuflly", restaurant: userSaved });
  } catch (err) {
    next(err);
  }
};

/////////////////////////////////UPDATING STRIPE ACCOUNT/////////////////////////////////
exports.editBank = async (req, res, next) => {
  try {
    const userId = req.userId;
    const phone = req.body.phone;
    const DOB = JSON.parse(req.body.DOB);
    const newDOB = {
      day: parseInt(moment(DOB).format("DD")),
      month: parseInt(moment(DOB).format("MM")),
      year: parseInt(moment(DOB).format("YYYY")),
    };
    const bankName = req.body.bankName;
    const iban = req.body.iban;

    let front =
      req.files["front"] !== undefined ? req.files["front"][0].path : "";
    front !== "" && (front = front.replace(/\\/g, "/"));

    let back = req.files["back"] !== undefined ? req.files["back"][0].path : "";
    back !== "" && (back = back.replace(/\\/g, "/"));

    const restaurant = await User.findById(userId).populate("block").exec();
    if (!restaurant) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    const stripeid = restaurant.restaurant.bank.stripeID;

    const stripe = Stripe(process.env.STRIPE_URI);

    const token = await stripe.tokens.create({
      account: {
        individual: {
          first_name: restaurant.firstName,
          last_name: restaurant.firstName,
        },
      },
    });
    await stripe.account.update(stripeid, {
      account_token: token.id,
      external_account: {
        object: "bank_account",
        account_number: iban,
        //test account_number: "FR1420041010050500013M02606",
        bank_name: bankName,
        country: "FR",
        currency: "eur",
      },
    });

    restaurant.restaurant.bank.phone = phone;
    restaurant.restaurant.bank.DOB = DOB;
    restaurant.restaurant.bank.bankName = bankName;
    restaurant.restaurant.bank.iban = iban;
    front !== "" && (restaurant.restaurant.bank.front = front);
    back !== "" && (restaurant.restaurant.bank.back = back);

    const userSaved = await restaurant.save();

    res
      .status(201)
      .json({ message: "updated successuflly", restaurant: userSaved });
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

exports.togglePremiumStatus = async (req, res, next) => {
  try {
    const restaurantInDb = await User.findById(req.body.restaurantId);
    if (!restaurantInDb) return res.status(400).send("Restaurant Not Found");

    restaurantInDb.restaurant.isPremium = !restaurantInDb.restaurant.isPremium;
    await restaurantInDb.save();

    res.json({ restaurant: restaurantInDb });
  } catch (err) {
    console.log(err);
  }
};

exports.setPremiumDishes = async (req, res, next) => {
  try {
    const restaurantInDb = await User.findById(req.body.restaurantId);
    if (!restaurantInDb) return res.status(400).send("Restaurant Not Found");

    const dishInDb = await Dish.findById(req.body.dishId);
    if (!dishInDb) return res.status(400).send("Dish Not Found");

    const { promotedDishes } = restaurantInDb.restaurant;
    if (promotedDishes.length === 4)
      return res.status(400).send("You cannot add more than 4 dishes");

    const restaurant = await User.findByIdAndUpdate(
      restaurantInDb._id,
      {
        $addToSet: {
          "restaurant.promotedDishes": req.body.dishId,
        },
      },
      { new: true }
    );

    res.json({ restaurant });
  } catch (err) {
    console.log(err);
  }
};

exports.removePremiumDish = async (req, res, next) => {
  try {
    const restaurantInDb = await User.findById(req.body.restaurantId);
    if (!restaurantInDb) return res.status(400).send("Restaurant Not Found");

    const dishInDb = await Dish.findById(req.body.dishId);
    if (!dishInDb) return res.status(400).send("Dish Not Found");

    const restaurant = await User.findByIdAndUpdate(
      restaurantInDb._id,
      {
        $pull: {
          "restaurant.promotedDishes": req.body.dishId,
        },
      },
      { new: true }
    );

    res.json({ restaurant });
  } catch (err) {
    console.log(err);
  }
};

exports.getPremiumDishes = async (req, res, next) => {
  try {
    const restaurantInDb = await User.findById(req.params._id).populate(
      "restaurant.promotedDishes"
    );
    if (!restaurantInDb) return res.status(400).send("Restaurant Not Found");

    res.json({ premium: restaurantInDb.restaurant.promotedDishes });
  } catch (err) {
    console.log(err);
  }
};

exports.AddRating = async (req, res, next) => {
  try {
    const userId = req.userId;
    const restaurantId = req.params.id;
    const orderId = req.body.orderId;

    let restaurantCart1 = await History.findOne({ user: restaurantId });
    if (!restaurantCart1) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // change status of the orders of a company
    restaurantCart1.orderHistory.map((history) => {
      if (`${history.orderId}` === `${orderId}`) {
        history.popup = true;
      }
    });
    // save restaurant history doc
    await restaurantCart1.save();
    const rating = req.body.rating;
    // let result = await User.findByIdAndUpdate(restaurantId, {
    //   $pull: { "restaurant.rating": { user: `${userId}` } },
    // });
    let result = await User.findOneAndUpdate(
      { _id: restaurantId },
      { $push: { "restaurant.ratings": { user: userId, rating: rating } } },
      { new: true }
    );

    res.status(201).json({ result: result });
  } catch (err) {
    next(err);
  }
};

exports.updateGoogleLink = async (req, res, next) => {
  const userId = req.userId;

  console.log("req.body", req.body);

  const restaurantInDb = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "restaurant.googleLink": req.body.link,
      },
    },
    { new: true }
  );
  if (!restaurantInDb) return res.status(400).send("Restaurant Not Found");

  res.status(201).json({ success: true });
};
