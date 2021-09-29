const bcrypt = require("bcryptjs");
var Pusher = require("pusher");
const Stripe = require("stripe");
const moment = require("moment");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpeg = require("imagemin-mozjpeg");
const fetch = require("node-fetch");

// Import Models
const User = require("../models/user");
const Block = require("../models/block");
const History = require("../models/history");
const Texts = require("../utils/Messages");

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find({ role: "delivery" })
      .populate("block")
      .exec();
    if (!users) {
      const err = new Error(Texts.not_user);
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
      const err = new Error(Texts.not_user);
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
exports.registerUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const street = req.body.street;
  const city = req.body.city;
  const zip = req.body.zip;
  const lat = req.body.lat;
  const long = req.body.long;
  try {
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error(Texts.already_Email);
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
      address: {
        street: street || "street",
        city: city || "city",
        zip: zip || "41200",
        lat: lat || "0",
        long: long || "0",
      },
      deliveryPerson: {
        bank: {
          phone: "",
          DOB: new Date(),
          bankName: "",
          iban: "",
          stripeID: "",
          front: "",
          back: "",
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
exports.editProfile = async (req, res, next) => {
  const userId = req.userId;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  try {
    const user = await User.findById(userId).populate("block").exec();
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
exports.deleteProfile = async (req, res, next) => {
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
    const blockID = user.block;
    await Block.findByIdAndUpdate(blockID, {
      $unset: { deliveryPerson: 1 },
    });
    res.status(201).json({
      deleted: true,
      user: userSaved,
    });
  } catch (err) {
    next(err);
  }
};

const pushNotification = (expoToken) => {
  console.log("in notification...");
  fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    mode: "no-cors",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // to: "ExponentPushToken[twFMN5Fq_cqSDSAfJ913E7]",
      to: expoToken,
      title: Texts.order_is_ready,
      body: Texts.order_ready_30min,
      // data: {
      //   orderId: companyUserCart.orderId,
      // },
    }),
  });
};

exports.getDeliveries = async (req, res, next) => {
  let userId = req.userId;
  try {
    const user = await User.findById(userId).populate("block").exec();
    if (!user) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error(Texts.contact_admin);
      err.status = 404;
      throw err;
    }
    const restaurantsIds = user.block.restaurants;
    const companiesIds = user.block.companies;

    const getTime = user.block.deliveryTime.split("h")[1].split("m")[0]
      ? user.block.deliveryTime.split("h")[1].split("m")[0]
      : user.block.deliveryTime.split("m")[0];
    const checkTime = /\D/.test(getTime);
    console.log("delivery time ===> ", checkTime, getTime);

    const delivery_gay_detail = await User.findById(userId);

    if (delivery_gay_detail) {
      if (delivery_gay_detail.expoToken) {
        checkTime
          ? setTimeout(
              () => {
                pushNotification(delivery_gay_detail.expoToken);
              },
              getTime - 1 === 0 ? 30 * 10000 : ((getTime - 1) * 60 + 30) * 10000
            )
          : getTime === 30 || getTime <= 30
          ? pushNotification(delivery_gay_detail.expoToken)
          : setTimeout(() => {
              pushNotification(delivery_gay_detail.expoToken);
            }, getTime - 30 * 10000);
      }
    }

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
              if (restaurantHist) {
                if (restaurantHist.company) {
                  // console.log(
                  //   "restaurantHist****",
                  //   restaurantHist.company._id.toString()
                  // );
                  if (
                    restaurantHist.company._id.toString() &&
                    companyId.toString()
                  ) {
                    // console.log('restaurantHistory ===> ', restaurantHist.company?._id.toString(), 'company id ===> ', companyId.toString())
                    if (
                      restaurantHist.company._id.toString() ===
                      companyId.toString()
                    ) {
                      if (restaurantHist.status === "Cooked") {
                        cookedArray.push(restaurantHist);
                      }
                      if (restaurantHist.status === "Picked") {
                        pickedArray.push(restaurantHist);
                      }
                    }
                  }
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
      const err = new Error(Texts.Opps);
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
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error(Texts.contact_admin);
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
      const err = new Error(Texts.Opps);
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
                  userOrderHistory.completedAt = Date.now();
                  // Notifying the user for order delivery
                  // var pusher = new Pusher({
                  //   appId: process.env.PUSHER_APP_ID,
                  //   key: process.env.PUSHER_KEY,
                  //   secret: process.env.PUSHER_SECRET,
                  //   cluster: process.env.PUSHER_CLUSTER,
                  //   encrypted: true,
                  // });
                  // pusher.trigger("orderDelivery", companyUserCart.id, {
                  //   title: "Delivered! 📬",
                  //   message: Texts.message_delivered,
                  //   key: companyUserCart.id,
                  //   orderId: companyUserCart.orderId,
                  // });
                  User.findById(companyUserCart.id, function (err, data) {
                    if (err) {
                    } else if (!data) {
                    } else if (!data.expoToken) {
                    } else {
                      fetch("https://exp.host/--/api/v2/push/send", {
                        method: "POST",
                        mode: "no-cors",
                        headers: {
                          Accept: "application/json",
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          to: data.expoToken,
                          title: "Delivered! 📬",
                          body: Texts.message_delivered,
                          data: {
                            orderId: companyUserCart.orderId,
                          },
                        }),
                      });
                    }
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
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    if (!user.block) {
      const err = new Error(Texts.contact_admin);
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

/////////////////////////////////CREATING STRIPE ACCOUT/////////////////////////////////
exports.addBank = async (req, res, next) => {
  try {
    const userId = req.userId;
    const phone = req.body.phone;
    const DOB = JSON.parse(req.body.DOB);
    const bankName = req.body.bankName;
    const iban = req.body.iban;
    const stripeid = req.body.stripeID;
    const newDOB = {
      day: parseInt(moment(DOB).format("DD")),
      month: parseInt(moment(DOB).format("MM")),
      year: parseInt(moment(DOB).format("YYYY")),
    };

    let front =
      req.files["front"] !== undefined ? req.files["front"][0].path : "";
    front !== "" && (front = front.replace(/\\/g, "/"));

    let back = req.files["back"] !== undefined ? req.files["back"][0].path : "";
    back !== "" && (back = back.replace(/\\/g, "/"));

    const delivery = await User.findById(userId).populate("block").exec();
    if (!delivery) {
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
          email: delivery.email,
          first_name: delivery.firstName,
          last_name: delivery.firstName,

          phone: phone,
          dob: newDOB,

          address: {
            line1: delivery.address.street,
            postal_code: parseInt(delivery.address.zip),
            city: delivery.address.city,
            country: "FR",
          },
          verification: {
            additional_document: {
              back: fileBack.id,
              details: "Utiliser le document pour le recto et le verso",
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
      email: delivery.email,
      business_profile: {
        name: delivery.name,
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
    delivery.deliveryPerson.bank.phone = phone;
    delivery.deliveryPerson.bank.DOB = DOB;
    delivery.deliveryPerson.bank.bankName = bankName;
    delivery.deliveryPerson.bank.iban = iban;
    delivery.deliveryPerson.bank.stripeID = account.id;
    delivery.deliveryPerson.bank.front = front;
    delivery.deliveryPerson.bank.back = back;

    const userSaved = await delivery.save();

    res.status(201).json({ updated: true, delivery: userSaved });
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
    const bankName = req.body.bankName;
    const iban = req.body.iban;
    const newDOB = {
      day: parseInt(moment(DOB).format("DD")),
      month: parseInt(moment(DOB).format("MM")),
      year: parseInt(moment(DOB).format("YYYY")),
    };

    let front =
      req.files["front"] !== undefined ? req.files["front"][0].path : "";
    front !== "" && (front = front.replace(/\\/g, "/"));

    let back = req.files["back"] !== undefined ? req.files["back"][0].path : "";
    back !== "" && (back = back.replace(/\\/g, "/"));

    const delivery = await User.findById(userId).populate("block").exec();
    if (!delivery) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    const stripeid = delivery.deliveryPerson.bank.stripeID;

    const stripe = Stripe(process.env.STRIPE_URI);

    const token = await stripe.tokens.create({
      account: {
        individual: {
          first_name: delivery.firstName,
          last_name: delivery.firstName,
        },
      },
    });
    await stripe.account.update(stripeid, {
      account_token: token.id,
      external_account: {
        object: "bank_account",
        account_number: iban,
        bank_name: bankName,
        country: "FR",
        currency: "eur",
      },
    });

    delivery.deliveryPerson.bank.phone = phone;
    delivery.deliveryPerson.bank.DOB = DOB;
    delivery.deliveryPerson.bank.bankName = bankName;
    delivery.deliveryPerson.bank.iban = iban;
    front !== "" && (delivery.deliveryPerson.bank.front = front);
    back !== "" && (delivery.deliveryPerson.bank.back = back);

    const userSaved = await delivery.save();

    res.status(201).json({ updated: true, delivery: userSaved });
  } catch (err) {
    next(err);
  }
};
