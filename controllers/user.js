const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Cart = require("../models/cart");
const Dish = require("../models/dish");
const History = require("../models/history");

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" })
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
    res.status(200).json({ user: user });
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
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error("Email already exists!");
      err.status = 404;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      user: {
        company: companyId,
      },
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
  const userId = req.userId;
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

exports.deleteUser = async (req, res, next) => {
  const userId = req.userId;
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
    let orderId = "3920023804923409234";
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
                carts: [
                  {
                    id: cart.user._id,
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

    let totalPrice =
      cart.totalPrice + cart.user.user.company.block.deliveryCost;
    const user = await User.findById(cart.user._id);
    if (user.user.credits && user.user.credits > 0) {
      let offPrice = cart.user.user.package.offPrice;
      totalPrice -= offPrice;
      user.user.credits -= 1;
    }
    if (user.user.referrals && user.user.referrals > 0) {
      let referralOff = 2;
      totalPrice -= referralOff;
      user.user.referrals -= 1;
    }

    const history = await History.findOne({ user: userId });
    if (history) {
      history.orderHistory.push({
        totalPrice: cart.totalPrice,
        paidPrice: totalPrice,
        orderId: orderId,
        status: "in progress",
        order: cart.userCarts,
      });
      const historySaved = await history.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({ ordered: true, history: historySaved, orderId });
    } else {
      const newHistory = new History({
        user: cart.user._id,
        orderHistory: [
          {
            totalPrice: cart.totalPrice,
            paidPrice: totalPrice,
            orderId: orderId,
            status: "in progress",
            order: cart.userCarts,
          },
        ],
      });
      const historySaved = await newHistory.save();
      await Cart.findByIdAndDelete(cart._id);
      res.status(201).json({ ordered: true, history: historySaved, orderId });
    }
  } catch (err) {
    next(err);
  }
};
exports.orders = async (req, res, next) => {
  let userId = req.userId;
  try {
    const history = await History.findOne({ user: userId })
      .populate("user")
      .populate("orderHistory.order.restaurant")
      .populate("orderHistory.order.dishes.id")
      .exec();
    if (!history) {
      res.status(200).json({ history: "" });
    } else {
      res.status(200).json({ history: history });
    }
  } catch (err) {
    next(err);
  }
};
