const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Cart = require("../models/cart");
const Dish = require("../models/dish");
const Package = require("../models/package");
const History = require("../models/history");
const Discount = require("../models/discounts");
const Company = require("../models/company");
const Texts = require("../utils/Messages");
const fetch = require("node-fetch");

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
      const err = new Error(Texts.Opps);
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // UserCode Generation
    const company = await Company.findById(companyId);
    const companyUserCheck = await User.find({
      "user.company": companyId,
    });
    const userCode =
      company.city +
      "-" +
      company.name.substring(0, 3) +
      "-" +
      companyUserCheck.length;
    user.user.company = companyId;
    user.status = "active";
    user.userCode = userCode;
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
      const err = new Error(Texts.Opps);
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
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    const package = await Package.findById(packageId);
    if (!package) {
      const err = new Error(Texts.Opps);
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
      const err = new Error(Texts.Opps);
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
      const err = new Error(Texts.already_Email);
      err.status = 404;
      throw err;
    }
    if (affiliate !== "") {
      const userAffiliate = await User.findOne({
        "user.affiliateCode": affiliate,
      });
      if (userAffiliate) {
        userAffiliate.user.referrals == null
          ? (userAffiliate.user.referrals = 1)
          : (userAffiliate.user.referrals += 1);
        await userAffiliate.save();
      } else {
        const err = new Error(Texts.invalid_affiliate_code);
        err.status = 404;
        throw err;
      }
    }

    const affiliateCode = "0000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    const hashedPassword = await bcrypt.hash(password, 12);

    // UserCode Generation
    const company = await Company.findById(companyId);
    const companyUserCheck = await User.find({
      "user.company": companyId,
    });
    const userCode =
      company.city +
      "-" +
      company.name.substring(0, 3) +
      "-" +
      companyUserCheck.length;

    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      user: {
        affiliateCode: affiliateCode,
        company: companyId,
      },
      userCode: userCode,
    });
    const userSaved = await user.save();

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
      const err = new Error(Texts.not_user);
      err.status = 404;
      throw err;
    }
    if (email !== user.email) {
      const userCheck = await User.findOne({ email: email });
      if (userCheck) {
        const err = new Error(Texts.already_Email);
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
exports.addExpoToken = async (req, res, next) => {
  const userId = req.userId;
  const expoToken = req.body.expoToken;
  console.log("expoToken", expoToken);
  try {
    const user = await User.findByIdAndUpdate(userId, { expoToken: expoToken })
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
        restaurant.restaurant.dishes.map((dish) => {
          if (dish.status === "Active") {
            dishesArray.push({
              ...dish.toObject(),
              restaurantName: restaurant.firstName,
              restaurantImage: restaurant.restaurant.image,
            });
          }
        });
      })
    );
  //   res.status(200).json({
  //     sort: dishesArray,
  //   });
  //   const sort = dishesArray.sort(function(x, y) {
  //     // true values first
  //     console.log(y.isPromoted,"x.isPromoted")
  //     return (x.isPromoted === y.isPromoted)? 0 : x.isPromoted==false? -1 : 1;
  //     // false values first
  //     // return (x === y)? 0 : x? 1 : -1;
  // });
    
  //   res.status(200).json({
  //     sort: sort,
  //   });
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
      const err = new Error(Texts.not_company);
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
          cart.userCarts[restaurantCartIndex].dishes[dishIndex].count +=
            +dishCount;
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
      const error = new Error(Texts.Opps);
      error.status = 404;
      throw error;
    }

    let restaurantCartIndex = cart.userCarts.findIndex(
      (element) => element.restaurant.toString() === dish.restaurant.toString()
    );
    if (restaurantCartIndex < 0) {
      const error = new Error(Texts.not_dish);
      error.status = 404;
      throw error;
    }
    let dishIndex = cart.userCarts[restaurantCartIndex].dishes.findIndex(
      (dish) => String(dish.id) === String(dishId)
    );
    if (dishIndex < 0) {
      const error = new Error(Texts.not_dish);
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
      const error = new Error(Texts.Opps);
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
  const user = await User.findById(userId);
  // console.log("user details ===> ", JSON.stringify(user.user.company, null, 2));
  const cart = await Cart.find({
    "restaurantCarts.company": user.user.company,
  });

  cart.map(async (item) => {
    item.restaurantCarts.map(async (cartItems) => {
      if (!cartItems.carts || cartItems.carts.length === 0) {
        const companyID = await User.find({
          "user.company": cartItems.company,
        });
        companyID.map((companyUsers) => {
          if (companyUsers) {
            if (companyUsers.expoToken) {
              // console.log(
              //   "user cart ===> ",
              //   JSON.stringify(companyUsers.expoToken, null, 2)
              // );

              fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                mode: "no-cors",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: companyUsers.expoToken,
                  title: Texts.company_placed_first_order,
                  body: Texts.message_to_all_person,
                  // data: {
                  //   orderId: companyUserCart.orderId,
                  // },
                }),
              });
            }
          }
        });
      }
    });
  });
  // console.log("user cart ===> ", JSON.stringify(cart, null, 2));

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
      const error = new Error(Texts.not_cart);
      error.status = 404;
      throw error;
    }
    let orderId = "0000000000000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    console.log("orderId", orderId);
    await Promise.all(
      cart.userCarts.map(async (userCart) => {
        console.log("userCart", userCart);
        if (userCart.dishes.length > 0) {
          const restaurantCart = await Cart.findOne({
            user: userCart.restaurant,
          });
          const restaurant_order = await User.findById(userCart.restaurant);
          console.log("rest id ", restaurant_order);

          if (!restaurant_order) {
          } else if (!restaurant_order.expoToken) {
          } else {
            fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              mode: "no-cors",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: restaurant_order.expoToken,
                title: "Order Recived! 📬",
                body: Texts.new_order_recived,
                // data: {
                //   orderId: companyUserCart.orderId,
                // },
              }),
            });
          }

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
                const error = new Error(Texts.restricted_resturent);
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

const stripe = require("stripe")(process.env.STRIPE_URI);

exports.paymentHandler = async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const token = req.body.token;
    const amount = req.body.amount;
    const card = req.body.card;
    const totalres = req.body.totalres;

    const customer = await stripe.customers.create({
      name: name,
      email: email,
      source: card.tokenId,
      description: "My First Test Customer (created for API docs)",
    });
    let totalValueSent = 0;
    totalres.map(async (restaurant) => {
      totalValueSent += restaurant.value;
      const charge = await stripe.charges.create({
        amount: restaurant.value * 100,
        currency: "eur",
        receipt_email: restaurant.restaurant.email,
        transfer_data: {
          destination: restaurant.restaurant.restaurant.bank.stripeID,
          amount: restaurant.value * 100,
        },
        customer: customer.id,
        description: "Amount Paid by Customer",
      });
    });
    let amountleft = +amount - totalValueSent;
    if (amountleft > 0) {
      await stripe.charges.create({
        amount: amountleft * 100,
        currency: "eur",
        customer: customer.id,
        description: "Delivery Charges",
      });
    }

    res.status(201).json({ data: "success" });
  } catch (err) {
    next(err);
  }
};

exports.packagePaymentHandler = async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const token = req.body.token;
    const amount = req.body.amount;
    const card = req.body.card;

    const customer = await stripe.customers.create({
      name: name,
      email: email,
      source: token,
    });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "eur",
      payment_method_types: ["card"],
      customer: customer.id,
      payment_method: card.card.cardId,
      confirm: true,
    });

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
