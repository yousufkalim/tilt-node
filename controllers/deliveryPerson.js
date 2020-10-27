const bcrypt = require("bcryptjs");
var Pusher = require("pusher");

// Import Models
const User = require("../models/user");
const History = require("../models/history");

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ role: "delivery" })
      .populate("block")
      .exec();
    if (!users) {
      const err = new Error("No such user exists!");
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
    const user = await User.findById(userId).populate("block").exec();
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
exports.registerUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
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
      role: "delivery",
      deliveryPerson: {
        bank: {
          account: "",
          name: "",
          code: "",
        },
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
exports.editBank = async (req, res, next) => {
  const userId = req.userId;
  const account = req.body.account;
  const name = req.body.name;
  const code = req.body.code;
  try {
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("No such user found!");
      err.status = 404;
      throw err;
    }
    user.deliveryPerson.bank.account = account;
    user.deliveryPerson.bank.name = name;
    user.deliveryPerson.bank.code = code;

    const userSaved = await user.save();
    res.status(201).json({ updated: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editProfile = async (req, res, next) => {
  const userId = req.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId).populate("block").exec();
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
exports.deleteProfile = async (req, res, next) => {
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

exports.getDeliveries = async (req, res, next) => {
  let userId = req.userId;
  try {
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const cookedArrayToSend = [];
    const pickedArrayToSend = [];
    await Promise.all(
      restaurantsIds.map(async (restaurantId) => {
        const restaurantCart = await History.findOne({ user: restaurantId })
          .populate({
            path: "user",
            populate: {
              path: "block",
            },
          })
          .populate("restaurantHistory.company")
          .populate("restaurantHistory.carts.id")
          .populate("restaurantHistory.carts.dishes.id")
          .exec();
        console.log("restaurantCart", restaurantId, restaurantCart);
        if (restaurantCart) {
          const cookedArray = [];
          const pickedArray = [];
          restaurantCart.restaurantHistory.map((restaurantHist) => {
            companiesIds.map((companyId) => {
              if (
                restaurantHist.company._id.toString() === companyId.toString()
              ) {
                if (restaurantHist.status === "Cooked") {
                  cookedArray.push(restaurantHist);
                }
                if (restaurantHist.status === "Picked") {
                  pickedArray.push(restaurantHist);
                }
              }
            });
          });
          if (cookedArray.length > 0) {
            cookedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: cookedArray,
            });
          }
          if (pickedArray.length > 0) {
            pickedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: pickedArray,
            });
          }
        }
      })
    );
    res.status(201).json({
      cookedCart: cookedArrayToSend,
      pickedCart: pickedArrayToSend,
      companiesIds,
    });
  } catch (err) {
    next(err);
  }
};
exports.pickDelivery = async (req, res, next) => {
  let userId = req.userId;
  const restaurantId = req.body.restaurantId;
  const companiesIds1 = req.body.companiesIds;
  try {
    const restaurantCart1 = await History.findOne({ user: restaurantId });
    if (!restaurantCart1) {
      const err = new Error("Whooops, there was an error!");
      err.status = 404;
      throw err;
    }
    const newHistory = [];

    // working even without this new Array and pushing into it the elements
    // map is storing the new values when status is changed to Picked
    restaurantCart1.restaurantHistory.map((history) => {
      companiesIds1.map((companyId) => {
        if (
          history.company.toString() === companyId.toString() &&
          history.status === "Cooked"
        ) {
          history.status = "Picked";
        }
      });
      newHistory.push(history);
    });
    restaurantCart1.restaurantHistory = newHistory;
    await restaurantCart1.save();
    //
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const cookedArrayToSend = [];
    const pickedArrayToSend = [];
    await Promise.all(
      restaurantsIds.map(async (restaurantId) => {
        const restaurantCart = await History.findOne({ user: restaurantId })
          .populate({
            path: "user",
            populate: {
              path: "block",
            },
          })
          .populate("restaurantHistory.company")
          .populate("restaurantHistory.carts.id")
          .populate("restaurantHistory.carts.dishes.id")
          .exec();
        if (restaurantCart) {
          const cookedArray = [];
          const pickedArray = [];
          restaurantCart.restaurantHistory.map((restaurantHist) => {
            companiesIds.map((companyId) => {
              if (
                restaurantHist.company._id.toString() === companyId.toString()
              ) {
                if (restaurantHist.status === "Cooked") {
                  cookedArray.push(restaurantHist);
                }
                if (restaurantHist.status === "Picked") {
                  pickedArray.push(restaurantHist);
                }
              }
            });
          });
          if (cookedArray.length > 0) {
            cookedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: cookedArray,
            });
          }
          if (pickedArray.length > 0) {
            pickedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: pickedArray,
            });
          }
        }
      })
    );

    res.status(201).json({
      cookedCart: cookedArrayToSend,
      pickedCart: pickedArrayToSend,
      companiesIds,
    });
  } catch (err) {
    next(err);
  }
};
exports.deliverDelivery = async (req, res, next) => {
  let userId = req.userId;
  const restaurantId = req.body.restaurantId;
  const companyId = req.body.companyId;
  try {
    // find the restaurant history doc
    let restaurantCart1 = await History.findOne({ user: restaurantId });
    if (!restaurantCart1) {
      const err = new Error("Whooops, there was an error!");
      err.status = 404;
      throw err;
    }
    let newHistory = [];
    // change status of the orders of a company
    restaurantCart1.restaurantHistory.map((history) => {
      if (
        history.company.toString() === companyId.toString() &&
        history.status === "Picked"
      ) {
        history.status = "Completed";
      }
      newHistory.push(history);
    });
    // save restaurant history doc
    restaurantCart1.restaurantHistory = newHistory;
    let savedRestaurantCart1 = await restaurantCart1.save();

    // Creating / Adding to  Delivery Person History
    let deliveryPersonHistory = await History.findOne({ user: userId });
    // history doc found
    if (deliveryPersonHistory) {
      // history doc found - create new
      savedRestaurantCart1.restaurantHistory.map(async (history) => {
        if (history.company.toString() === companyId.toString()) {
          deliveryPersonHistory.deliveryPersonHistory.push({
            restaurant: savedRestaurantCart1.user._id,
            ...history.toObject(),
          });
        }
      });
      await deliveryPersonHistory.save();
    } else {
      // history doc not found - create new
      const newDeliveryPersonHistory = new History({
        user: userId,
        deliveryPersonHistory: [],
      });
      restaurantCart1.restaurantHistory.map(async (history) => {
        if (history.company.toString() === companyId.toString()) {
          newDeliveryPersonHistory.deliveryPersonHistory.push({
            restaurant: restaurantCart1.user._id,
            ...history.toObject(),
          });
        }
      });
      await newDeliveryPersonHistory.save();
    }

    // Changing the status at user end
    await Promise.all(
      savedRestaurantCart1.restaurantHistory.map((companyCart) => {
        if (companyCart.company.toString() === companyId.toString()) {
          companyCart.carts.map(async (companyUserCart) => {
            let userToHistory = await History.findOne({
              user: companyUserCart.id,
            });
            if (userToHistory) {
              let userToHistoryOrderHistory = userToHistory.orderHistory;
              userToHistoryOrderHistory.map((userOrderHistory) => {
                if (
                  userOrderHistory.orderId.toString() ===
                    companyUserCart.orderId.toString() &&
                  userOrderHistory.status !== "Completed"
                ) {
                  userOrderHistory.status = "Completed";
                  // Notifying the user for order delivery
                  var pusher = new Pusher({
                    appId: "1086980",
                    key: "f19bda9d7bdf644259ab",
                    secret: "991969f08f951d4548f3",
                    cluster: "mt1",
                    encrypted: true,
                  });
                  pusher.trigger("orderDelivery", companyUserCart.id, {
                    title: "Delivered! 📬",
                    message: "Your TILT order is delivered.",
                    key: companyUserCart.id,
                    orderId: companyUserCart.orderId,
                  });
                }
              });
              userToHistory.orderHistory = userToHistoryOrderHistory;
              await userToHistory.save();
            }
          });
        }
      })
    );

    // Functioning on response
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error("Contact admin to assign a block to you!");
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const cookedArrayToSend = [];
    const pickedArrayToSend = [];
    await Promise.all(
      restaurantsIds.map(async (restaurantId) => {
        const restaurantCart = await History.findOne({ user: restaurantId })
          .populate({
            path: "user",
            populate: {
              path: "block",
            },
          })
          .populate("restaurantHistory.company")
          .populate("restaurantHistory.carts.id")
          .populate("restaurantHistory.carts.dishes.id")
          .exec();
        const cookedArray = [];
        const pickedArray = [];
        if (restaurantCart) {
          restaurantCart.restaurantHistory.map((restaurantHist) => {
            companiesIds.map((companyId) => {
              if (
                restaurantHist.company._id.toString() === companyId.toString()
              ) {
                if (restaurantHist.status === "Cooked") {
                  cookedArray.push(restaurantHist);
                }
                if (restaurantHist.status === "Picked") {
                  pickedArray.push(restaurantHist);
                }
              }
            });
          });
          if (cookedArray.length > 0) {
            cookedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: cookedArray,
            });
          }
          if (pickedArray.length > 0) {
            pickedArrayToSend.push({
              historyId: restaurantCart._id,
              restaurant: restaurantCart.user,
              history: pickedArray,
            });
          }
        }
      })
    );

    res.status(201).json({
      cookedCart: cookedArrayToSend,
      pickedCart: pickedArrayToSend,
      companiesIds,
    });
  } catch (err) {
    next(err);
  }
};
exports.getHistory = async (req, res, next) => {
  let userId = req.userId;
  try {
    // find the history and references
    let history = await History.findOne({ user: userId })
      .populate("user")
      .populate("deliveryPersonHistory.restaurant")
      .populate({
        path: "deliveryPersonHistory.company",
        populate: { path: "block" },
      })
      .populate("deliveryPersonHistory.carts.id")
      .populate("deliveryPersonHistory.carts.dishes.id")
      .exec();
    if (!history) {
      res.status(200).json({ history: "" });
    } else {
      let results = history.deliveryPersonHistory.sort((rowDataA, rowDataB) => {
        if (new Date(rowDataA.completedAt) <= new Date(rowDataB.completedAt))
          return -1;
        if (new Date(rowDataA.completedAt) > new Date(rowDataB.completedAt))
          return 1;
        return 0;
      });
      results = results.reverse(); // descending
      history.deliveryPersonHistory = results;
      res.status(200).json({ history: history });
    }
  } catch (err) {
    next(err);
  }
};
