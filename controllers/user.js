const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Cart = require("../models/cart");
const Dish = require("../models/dish");
const Package = require("../models/package");
const History = require("../models/history");
const Discount = require("../models/discounts");
const Company = require("../models/company");

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" })
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "company" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!users) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ users: users });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getProfile = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("No such user exists!");
      err.status = 404;
      throw err;
    }
    if (
      user.user.package &&
      new Date(user.user.packageExpiration) <= new Date()
    ) {
      user.user.package = undefined;
      user.user.credits = undefined;
      user.user.packageExpiration = undefined;
      const savedUser = await user.save();
      res.status(200).json({ user: savedUser });
    } else {
      // response send
      res.status(200).json({ user: user });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getProfileById = async (req, res, next) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("No such user exists!");
      err.status = 404;
      throw err;
    }
    if (
      user.user.package &&
      new Date(user.user.packageExpiration) <= new Date()
    ) {
      user.user.package = undefined;
      user.user.credits = undefined;
      user.user.packageExpiration = undefined;
      const savedUser = await user.save();
      // response send
      res.status(200).json({ user: savedUser });
    } else {
      // response send
      res.status(200).json({ user: user });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
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
exports.changeCompany = async (req, res, next) => {
  const userId = req.userId;
  const companyId = req.params.companyId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    user.user.company = companyId;
    user.status = "active";
    await user.save();
    const user2 = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user2) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    res.status(201).json({ updated: true, user: user2 });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.changePackage = async (req, res, next) => {
  const userId = req.userId;
  const packageId = req.params.packageId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    const package = await Package.findById(packageId);
    if (!package) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    user.user.package = packageId;
    user.user.credits = package.credits;
    let expirationDate = new Date();
    expirationDate = expirationDate.setDate(
      expirationDate.getDate() + package.expiration
    );
    user.user.packageExpiration = new Date(expirationDate);
    await user.save();
    const user2 = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user2) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    res.status(201).json({ updated: true, user: user2 });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.registerUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const companyId = req.body.companyId;
  const affiliate = req.body.affiliate;
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error("Email already exists!");
      err.status = 404;
      throw err;
    }
    const affiliateCode = "0000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      user: {
        affiliateCode: affiliateCode,
        company: companyId,
      },
    });
    const userSaved = await user.save();
    if (affiliate !== "") {
      const userAffiliate = await User.findOne({
        "user.affiliateCode": affiliate,
      });
      if (userAffiliate) {
        userAffiliate.user.referrals == null
          ? (userAffiliate.user.referrals = 1)
          : (userAffiliate.user.referrals += 1);
        await userAffiliate.save();
      }
    }

    res.status(200).json({ registered: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editUser = async (req, res, next) => {
  const userId = req.params.id;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    if (email !== user.email) {
      const userCheck = await User.findOne({ email: email });
      if (userCheck) {
        const err = new Error("Email already exists!");
        err.status = 404;
        throw err;
      }
    }
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editCreditCard = async (req, res, next) => {
  const userId = req.userId;
  const number = req.body.number;
  const date = req.body.date;
  const year = req.body.year;
  const code = req.body.code;
  const name = req.body.name;
  try {
    const user = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.user.creditCard.number = number;
    user.user.creditCard.date = date;
    user.user.creditCard.year = year;
    user.user.creditCard.code = code;
    user.user.creditCard.name = name;

    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.deleteCreditCard = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "user.creditCard": undefined,
      },
      { new: true }
    )
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    res.status(201).json({ updated: true, user });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.status = "deleted";
    const userSaved = await user.save();
    res.status(201).json({
      deleted: true,
      user: userSaved,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDishes = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId)
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .exec();
    if (!user) {
      const err = new Error("No such user exists!");
      err.status = 404;
      throw err;
    }
    const restaurantsIdsArray = user.user.company.block.restaurants;
    const dishesArray = [];
    const restaurantsArray = [];
    await Promise.all(
      restaurantsIdsArray.map(async (restaurantId) => {
        const restaurant = await User.findById(restaurantId)
          .populate("restaurant.dishes")
          .exec();
        restaurantsArray.push(restaurant);
        restaurant.restaurant.dishes.map((dish) =>
          dishesArray.push({
            ...dish.toObject(),
            restaurantName: restaurant.firstName,
            restaurantImage: restaurant.restaurant.image,
          })
        );
      })
    );
    const discounts = await Discount.findOne();

    res.status(200).json({
      restaurantsArray: restaurantsArray,
      dishesArray: dishesArray,
      discounts,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getDishesWithoutAuth = async (req, res, next) => {
  const companyId = req.params.companyId;
  try {
    const company = await Company.findById(companyId).populate("block").exec();
    if (!company) {
      const err = new Error("No such company exists!");
      err.status = 404;
      throw err;
    }
    const restaurantsIdsArray = company.block.restaurants;
    const dishesArray = [];
    const restaurantsArray = [];
    await Promise.all(
      restaurantsIdsArray.map(async (restaurantId) => {
        const restaurant = await User.findById(restaurantId)
          .populate("restaurant.dishes")
          .exec();
        restaurantsArray.push(restaurant);
        restaurant.restaurant.dishes.map((dish) =>
          dishesArray.push({
            ...dish.toObject(),
            restaurantName: restaurant.firstName,
            restaurantImage: restaurant.restaurant.image,
          })
        );
      })
    );

    res.status(200).json({
      restaurantsArray: restaurantsArray,
      dishesArray: dishesArray,
      company,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  const userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  const dishCount = req.body.dishCount;
  try {
    const cart = await Cart.findOne({ user: userId });
    const dish = await Dish.findById(dishId);
    if (cart) {
      // Cart found
      const restaurantCartIndex = cart.userCarts.findIndex(
        (element) =>
          element.restaurant.toString() === dish.restaurant.toString()
      );
      if (restaurantCartIndex < 0) {
        // restaurnat entry not found
        cart.totalPrice += +dishPrice * +dishCount;
        cart.userCarts.push({
          restaurant: dish.restaurant,
          dishes: [
            {
              id: dishId,
              count: +dishCount,
            },
          ],
        });
        const cartSaved = await cart.save();
        const cartToSend = await Cart.findById(cartSaved._id)
          .populate("userCarts.restaurant")
          .populate("userCarts.dishes.id")
          .exec();
        res.status(201).json({ added: true, cart: cartToSend });
      } else {
        const dishIndex = cart.userCarts[restaurantCartIndex].dishes.findIndex(
          (dish) => String(dish.id) === String(dishId)
        );
        if (dishIndex < 0) {
          // dish not found
          cart.totalPrice += +dishPrice * +dishCount;
          cart.userCarts[restaurantCartIndex].dishes.push({
            id: dishId,
            count: +dishCount,
          });
          const cartSaved = await cart.save();
          const cartToSend = await Cart.findById(cartSaved._id)
            .populate("userCarts.restaurant")
            .populate("userCarts.dishes.id")
            .exec();
          res.status(201).json({ added: true, cart: cartToSend });
        } else {
          // dish found
          cart.userCarts[restaurantCartIndex].dishes[
            dishIndex
          ].count += +dishCount;
          cart.totalPrice += +dishPrice * +dishCount;
          const cartSaved = await cart.save();
          const cartToSend = await Cart.findById(cartSaved._id)
            .populate("userCarts.restaurant")
            .populate("userCarts.dishes.id")
            .exec();
          res.status(201).json({ added: true, cart: cartToSend });
        }
      }
    } else {
      const newCart = new Cart({
        user: userId,
        totalPrice: +dishPrice * +dishCount,
        userCarts: [
          {
            restaurant: dish.restaurant,
            dishes: [
              {
                id: dishId,
                count: +dishCount,
              },
            ],
          },
        ],
      });
      const cartSaved = await newCart.save();
      const user = await User.findById(userId);
      user.user.cart = newCart._id;
      await user.save();
      const cartToSend = await Cart.findById(cartSaved._id)
        .populate("userCarts.restaurant")
        .populate("userCarts.dishes.id")
        .exec();
      res.status(201).json({ added: true, cart: cartToSend });
    }
  } catch (err) {
    next(err);
  }
};
exports.removeFromCart = async (req, res, next) => {
  let userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  try {
    const cart = await Cart.findOne({ user: userId });
    const dish = await Dish.findById(dishId);
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }

    let restaurantCartIndex = cart.userCarts.findIndex(
      (element) => element.restaurant.toString() === dish.restaurant.toString()
    );
    if (restaurantCartIndex < 0) {
      const error = new Error("No such dish, found!");
      error.status = 404;
      throw error;
    }
    let dishIndex = cart.userCarts[restaurantCartIndex].dishes.findIndex(
      (dish) => String(dish.id) === String(dishId)
    );
    if (dishIndex < 0) {
      const error = new Error("No such dish found!");
      error.status = 404;
      throw error;
    }
    cart.totalPrice -=
      +dishPrice * +cart.userCarts[restaurantCartIndex].dishes[dishIndex].count;
    cart.userCarts[restaurantCartIndex].dishes = cart.userCarts[
      restaurantCartIndex
    ].dishes.filter((dish) => String(dish.id) !== String(dishId));
    const cartSaved = await cart.save();
    const cartToSend = await Cart.findById(cartSaved._id)
      .populate("userCarts.restaurant")
      .populate("userCarts.dishes.id")
      .exec();
    res.status(201).json({ removed: true, cart: cartToSend });
  } catch (err) {
    next(err);
  }
};
exports.getCart = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("userCarts.restaurant")
      .populate("userCarts.dishes.id")
      .exec();
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    res.status(200).json({ cart: cart });
  } catch (err) {
    next(err);
  }
};
exports.order = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "user",
        populate: {
          path: "user.package",
          path: "user.company",
          populate: {
            path: "block",
          },
        },
      })
      .exec();
    if (!cart || cart.totalPrice <= 0) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    let orderId = "0000000000000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    await Promise.all(
      cart.userCarts.map(async (userCart) => {
        if (userCart.dishes.length > 0) {
          const restaurantCart = await Cart.findOne({
            user: userCart.restaurant,
          });
          if (!restaurantCart) {
            // restaurantCart not found
            const newRestaurantCart = new Cart({
              user: userCart.restaurant,
              restaurantCarts: [
                {
                  company: cart.user.user.company._id,
                  carts: [
                    {
                      id: cart.user._id,
                      orderId: orderId,
                      totalPrice: cart.totalPrice,
                      dishes: userCart.dishes,
                    },
                  ],
                },
              ],
            });
            await newRestaurantCart.save();
          } else {
            const companyIndex = restaurantCart.restaurantCarts.findIndex(
              (element) =>
                element.company.toString() ===
                cart.user.user.company._id.toString()
            );
            if (companyIndex < 0) {
              // company not found
              restaurantCart.restaurantCarts.push({
                company: cart.user.user.company._id,
                orderId: orderId,
                carts: [
                  {
                    id: cart.user._id,
                    orderId: orderId,
                    totalPrice: cart.totalPrice,
                    dishes: userCart.dishes,
                  },
                ],
              });
              await restaurantCart.save();
            } else {
              // company found
              if (restaurantCart.restaurantCarts[companyIndex].stopped) {
                const error = new Error(
                  "Whoops, restaurant restricted more orders !"
                );
                error.status = 404;
                throw error;
              }
              const userIndex = restaurantCart.restaurantCarts[
                companyIndex
              ].carts.findIndex(
                (element) => element.id.toString() === cart.user._id.toString()
              );
              if (userIndex < 0) {
                // user entry not found
                restaurantCart.restaurantCarts[companyIndex].carts.push({
                  id: cart.user._id,
                  orderId: orderId,
                  totalPrice: cart.totalPrice,
                  dishes: userCart.dishes,
                });
                await restaurantCart.save();
              } else {
                // user entry found
                restaurantCart.restaurantCarts[companyIndex].carts[
                  userIndex
                ].totalPrice += cart.totalPrice;
                let newDishesArray =
                  restaurantCart.restaurantCarts[companyIndex].carts[userIndex]
                    .dishes;
                userCart.dishes.map((element) => {
                  newDishesArray.push({
                    id: element.id,
                    count: element.count,
                  });
                });
                restaurantCart.restaurantCarts[companyIndex].carts[
                  userIndex
                ].dishes = newDishesArray;
                await restaurantCart.save();
              }
            }
          }
        }
      })
    );
    const discounts = await Discount.findOne();

    let totalPrice =
      cart.totalPrice + cart.user.user.company.block.deliveryCost;
    const user = await User.findById(cart.user._id)
      .populate("user.package")
      .exec();
    if (user.user.credits && user.user.credits > 0) {
      totalPrice -= user.user.package.offPrice;
      user.user.credits -= 1;
    }
    if (user.user.referrals && user.user.referrals > 0 && discounts) {
      totalPrice -= discounts.referralDiscount;
      user.user.referrals -= 1;
    }
    if (user.user.credits === 0) {
      user.user.package = undefined;
      user.user.credits = undefined;
      user.user.packageExpiration = undefined;
    }

    const savedUser = await user.save();
    const history = await History.findOne({ user: savedUser._id });
    const userToSend = await User.findById(userId)
      .populate("user.package")
      .populate({
        path: "user.company",
        populate: { path: "block" },
      })
      .populate({
        path: "user.cart",
        populate: [
          {
            path: "userCarts.restaurant",
          },
          {
            path: "userCarts.dishes.id",
          },
        ],
      })
      .exec();
    if (history) {
      history.orderHistory.push({
        totalPrice: cart.totalPrice,
        paidPrice: totalPrice,
        orderId: orderId,
        status: "In progress",
        order: cart.userCarts,
      });
      const historySaved = await history.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({
        ordered: true,
        history: historySaved,
        orderId,
        user: userToSend,
      });
    } else {
      const newHistory = new History({
        user: cart.user._id,
        orderHistory: [
          {
            totalPrice: cart.totalPrice,
            paidPrice: totalPrice,
            orderId: orderId,
            status: "In progress",
            order: cart.userCarts,
          },
        ],
      });
      const historySaved = await newHistory.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({
        ordered: true,
        history: historySaved,
        orderId,
        user: userToSend,
      });
    }
  } catch (err) {
    next(err);
  }
};
exports.orders = async (req, res, next) => {
  let userId = req.userId;
  try {
    // .sort("orderHistory.time")
    // .sort("-orderHistory.time")
    // .sort({"orderHistory.time": 1})
    // .sort({"orderHistory.time": -1})
    // 'asc' / 'ascending' => 1
    // 'desc' / 'descending' => -1
    let history = await History.findOne({ user: userId })
      .populate("user")
      .populate("orderHistory.order.restaurant")
      .populate("orderHistory.order.dishes.id")
      .exec();

    if (!history) {
      res.status(200).json({ history: "" });
    } else {
      let results = history.orderHistory.sort((rowDataA, rowDataB) => {
        if (new Date(rowDataA.time) <= new Date(rowDataB.time)) return -1;
        if (new Date(rowDataA.time) > new Date(rowDataB.time)) return 1;
        return 0;
      });
      results = results.reverse(); // descending
      history.orderHistory = results;
      res.status(200).json({ history: history });
    }
  } catch (err) {
    next(err);
  }
};

const stripe = require("stripe")(
  "STRIPE_TEST_KEY_REDACTED"
);

exports.paymentHandler = async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const token = req.body.token;
    const amount = req.body.amount;
    const card = req.body.card;

    const token1 = await stripe.tokens.create({
      bank_account: {
        country: "US",
        currency: "eur",
        account_holder_name: "Jenny Rosen",
        account_holder_type: "individual",
        routing_number: "110000000",
        account_number: "000123456789",
      },
    });
    const bankAccount = await stripe.customers.createSource(
      "cus_IaTyy36c62nTtG",
      { source: token }
    );

    console.log(token1, bankAccount);

    const customer = await stripe.customers.create({
      name: name,
      email: email,
      source: token,
    });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "eur",
      payment_method_types: ["bank_account"],
      customer: customer.id,
      payment_method: card.card.cardId,
      confirm: true,
    });

    // await stripe.paymentIntents.confirm(paymentIntent.id);
    // await stripe.paymentIntents.capture(paymentIntent.id);
    if (paymentIntent.status !== "succeeded") {
      const error = new Error("There was a problem from payment end.");
      error.status = 404;
      throw error;
    }
    res.status(201).json({ paymentIntent });
  } catch (err) {
    next(err);
  }
};

exports.handler = async (event, context) => {
  try {
    const amount = event.arguments.input.amount;
    const name = event.arguments.input.name;
    const email = event.arguments.input.email;

    const customer = await createCustomer(name, email);

    const session = await createCheckOutSession(amount, customer.id);

    return session;
  } catch (error) {
    console.log("er is een fout opgetreden", error);
  }
};

async function createCustomer(name, email) {
  return new Promise(function (resolve, reject) {
    stripe.customers
      .create({
        email: email,
        name: name,
      })
      .then((customer) => {
        resolve(customer);
      })
      .catch((err) => {
        // Error response
        reject(err);
      });
  });
}

async function createCheckOutSession(amount, customer) {
  //eslint-disable-line

  return new Promise(function (resolve, reject) {
    stripe.checkout.sessions
      .create({
        payment_method_types: ["card", "ideal"],
        customer: customer,
        line_items: [
          {
            name: "Buy your stuff here",
            amount: amount * 100,
            currency: "eur",
            quantity: 1,
          },
        ],
        success_url: "AMPLIFY-URL/payment-success",
        cancel_url: "AMPLIFY-URL/payment-failure",
        locale: "nl",
      })
      .then((source) => {
        // Success response
        const response = {
          statusCode: 200,
          body: JSON.stringify(source),
        };

        resolve(response);
      })
      .catch((err) => {
        // Error response
        const response = {
          statusCode: 500,
          body: JSON.stringify(err.message),
        };

        reject(response);
      });
  });
}
