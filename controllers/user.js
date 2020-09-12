const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Cart = require("../models/cart");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ "role.name": "user" })
      .populate("company")
      .populate("package")
      .populate("cart")
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
exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId)
      .populate("company")
      .populate("package")
      .populate("cart")
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
      company: companyId,
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
  const userId = req.params.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId);
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

// Others
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

exports.addToCart = async (req, res, next) => {
  const userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  const dishCount = req.body.dishCount;
  try {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      // Cart found
      const dishIndex = cart.dishes.findIndex(
        (dish) => String(dish.id._id) === String(dishId)
      );
      if (dishIndex < 0) {
        // dish not found
        cart.totalPrice += +dishPrice * +dishCount;
        cart.dishes.push({
          id: dishId,
          count: +dishCount,
        });
        const cartSaved = await cart.save();
        const cartToSend = await Cart.findById(cartSaved._id)
          .populate("dishes.id")
          .exec();
        res.status(201).json({ added: true, cart: cartToSend });
      } else {
        // dish found
        cart.dishes[dishIndex].count += +dishCount;
        cart.totalPrice += +dishPrice * +dishCount;
        const cartSaved = await cart.save();
        const cartToSend = await Cart.findById(cartSaved._id)
          .populate("dishes.id")
          .exec();
        res.status(201).json({ added: true, cart: cartToSend });
      }
    } else {
      const newCart = new Cart({
        user: userId,
        totalPrice: +dishPrice * +dishCount,
        dishes: [
          {
            id: dishId,
            count: +dishCount,
          },
        ],
      });
      const cartSaved = await newCart.save();
      const user = await User.findById(userId);
      user.cart = newCart._id;
      await user.save();
      const cartToSend = await Cart.findById(cartSaved._id)
        .populate("dishes.id")
        .exec();
      res.status(201).json({ added: true, cart: cartToSend });
    }
  } catch (err) {
    next(err);
  }
};

// Remove dish
exports.removeFromCart = async (req, res, next) => {
  let userId = req.userId;
  const dishId = req.body.dishId;
  const dishPrice = req.body.dishPrice;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("dishes.id")
      .exec();
    if (!cart) {
      const error = new Error("Whoops, no cart found!");
      error.status = 404;
      throw error;
    }
    let dishIndex = cart.dishes.findIndex(
      (dish) => String(dish.id._id) === String(dishId)
    );
    if (dishIndex < 0) {
      const error = new Error("No such dish found!");
      error.status = 404;
      throw error;
    }
    cart.totalPrice -= +dishPrice * +cart.dishes[dishIndex].count;
    cart.dishes = cart.dishes.filter(
      (dish) => String(dish.id._id) !== String(dishId)
    );
    const cartSaved = await cart.save();
    res.status(201).json({ removed: true, cart: cartSaved });
  } catch (err) {
    next(err);
  }
};
// Get Cart
exports.getCart = async (req, res, next) => {
  let userId = req.userId;
  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(200).json({ cart: "" });
    } else {
      res.status(200).json({ cart: cart });
    }
  } catch (err) {
    next(err);
  }
};

// // Purchases
// // Make purchase
// exports.purchase = async (req, res, next) => {
//   let userId = req.userId;
//   const address = req.body.address;
//   const zip = req.body.zip;
//   const city = req.body.city;
//   const country = req.body.country;
//   try {
//     const cart = await Cart.findOne({ userId })
//       .populate("userId")
//       .populate("dishes.id")
//       .exec();
//     if (!cart) {
//       const error = new Error("Whoops, no cart found!");
//       error.status = 404;
//       throw error;
//     }
//     const purchases = await Purchases.findOne({ userId });
//     const trackLink = new RandExp(/([A-Za-z]\w{16})\1/).gen();
//     if (purchases) {
//       purchases.carts.push(cart);
//       purchases.track = trackLink;
//       purchases.shipping = {
//         address: address,
//         zip: zip,
//         city: city,
//         country: country,
//       };
//       const purchaseSaved = await purchases.save();
//       await Cart.findOneAndDelete({ userId });
//       res.status(201).json({ purchases: purchaseSaved, link: trackLink });
//     } else {
//       const newPurchase = new Purchases({
//         userId: userId,
//         carts: [cart],
//         track: trackLink,
//         shipping: {
//           address: address,
//           zip: zip,
//           city: city,
//           country: country,
//         },
//       });
//       const purchaseSaved = await newPurchase.save();
//       await Cart.findOneAndDelete({ userId });
//       res.status(201).json({ purchases: purchaseSaved, link: trackLink });
//     }
//   } catch (err) {
//     next(err);
//   }
// };
// // Get purchases
// exports.getPurchases = async (req, res, next) => {
//   let userId = req.userId;
//   try {
//     const purchases = await Purchases.findOne({ userId });
//     if (!purchases) {
//       res.status(200).json({ purchases: "" });
//     } else {
//       res.status(200).json({ purchases: purchases });
//     }
//   } catch (err) {
//     next(err);
//   }
// };
