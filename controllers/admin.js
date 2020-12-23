const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
// Import Models
const User = require("../models/user");
const Company = require("../models/company");
const Package = require("../models/package");
const Block = require("../models/block");
const Discounts = require("../models/discounts");
const Texts = require("../utils/Messages");
const validaion = require("../utils/Validations");
// Profile
exports.registerAdmin = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const secret_code = req.body.secret_code;
  try {
    if (secret_code !== "secretcodeforadmin") {
      const err = new Error(Texts.not_Authorize);
      err.status = 404;
      throw err;
    }
    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      const err = new Error(Texts.already_Email);
      err.status = 404;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const input = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      role: "admin",
    };
    const value = await validaion.admin_Register(input);
    const user = new User(value);

    const userSaved = await user.save();

    res.status(200).json({ registered: true, user: userSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Company
exports.getAllCompanies = async (req, res, next) => {
  try {
    // find the company doc
    const companies = await Company.find().populate("block", "name");
    if (!companies) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ companies: companies });
  } catch (err) {
    next(err);
  }
};
exports.getCompany = async (req, res, next) => {
  // package id from params
  const companyId = req.params.companyId;
  try {
    // find a single company by id
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error(Texts.not_Exists);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ company: company });
  } catch (err) {
    next(err);
  }
};
exports.registerCompany = async (req, res, next) => {
  // req body values
  const name = req.body.name;
  const deliveryPlace = req.body.deliveryPlace;

  try {
    // check if the package exists already
    const companyCheck = await Company.findOne({ name: name });
    if (companyCheck) {
      const error = new Error(Texts.already_company);
      error.status = 404;
      throw error;
    }
    // create a company doc
    const input = {
      name: name,
      deliveryPlace: deliveryPlace,
    };
    const value = await validaion.register_Company(input);
    const company = new Company(value);
    // save the company to the db
    const companySaved = await company.save();
    // response sending
    res.status(201).json({
      registered: true,
      company: companySaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.editCompany = async (req, res, next) => {
  // company id from params
  const companyId = req.params.companyId;
  // req body values
  const name = req.body.name;
  const deliveryPlace = req.body.deliveryPlace;
  try {
    // find the package to edit by id
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error(Texts.not_Exists);
      err.status = 404;
      throw err;
    }
    const input = {
      name,
      deliveryPlace,
    };
    const value = await validaion.edit_company(input);

    // update the new values
    company.name = value.name;
    company.deliveryPlace = value.deliveryPlace;
    // saving the updated doc
    const companySaved = await company.save();
    // response sending
    res.status(201).json({
      updated: true,
      company: companySaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.deleteCompany = async (req, res, next) => {
  // req body values
  const userId = req.userId;
  const companyId = req.params.companyId;
  try {
    // find the company
    const company = await Company.findByIdAndDelete(companyId);
    if (!company) {
      const error = new Error(Texts.Opps);
      error.status = 404;
      throw error;
    }
    // find the users associated with that company
    const users = await User.find({ "user.company": companyId });
    // change status of every user to company (needs company to be functional)
    await Promise.all(
      users.map(async (userIn) => {
        const statusUser = await User.findById(userIn._id);
        statusUser.status = "company";
        await statusUser.save();
      })
    );
    // response send
    res.status(201).json({
      deleted: true,
      company,
    });
  } catch (err) {
    next(err);
  }
};

// Packages
exports.getAllPackages = async (req, res, next) => {
  try {
    // find the package doc
    const packages = await Package.find();
    if (!packages) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ packages: packages });
  } catch (err) {
    next(err);
  }
};
exports.getPackage = async (req, res, next) => {
  // package id from params
  const packageId = req.params.packageId;
  try {
    // find a single package by id
    const package = await Package.findById(packageId);
    if (!package) {
      const err = new Error(Texts.not_package);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ package: package });
  } catch (err) {
    next(err);
  }
};
exports.registerPackage = async (req, res, next) => {
  // req body values
  const name = req.body.name;
  const price = req.body.price;
  const offPrice = req.body.offPrice;
  const credits = req.body.credits;
  const expiration = req.body.expiration;

  try {
    // check if the package exists already
    const packageCheck = await Package.findOne({ name: name });
    if (packageCheck) {
      const error = new Error(Texts.already_package);
      error.status = 404;
      throw error;
    }
    // create a package doc
    const input = {
      offPrice: offPrice,
      name: name,
      price: price,
      credits: credits,
      expiration: expiration,
    };
    const value = await validaion.register_package(input);

    const package = new Package(value);
    // save the package to the db
    const packageSaved = await package.save();
    // response sending
    res.status(201).json({
      registered: true,
      package: packageSaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.editPackage = async (req, res, next) => {
  // package id from params
  const packageId = req.params.packageId;
  // req body values
  const name = req.body.name;
  const price = req.body.price;
  const offPrice = req.body.offPrice;
  const credits = req.body.credits;
  const expiration = req.body.expiration;
  try {
    // find the package to edit by id
    const package = await Package.findById(packageId);
    if (!package) {
      const err = new Error(Texts.not_package);
      err.status = 404;
      throw err;
    }
    const input = {
      name,
      price,
      offPrice,
      credits,
      expiration,
    };
    const value = await validaion.edit_package(input);
    // update the new values
    package.name = value.name;
    package.price = value.price;
    package.offPrice = value.offPrice;
    package.credits = value.credits;
    package.expiration = value.expiration;
    // saving the updated doc
    const packageSaved = await package.save();
    // response sending
    res.status(201).json({
      updated: true,
      package: packageSaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.deletePackage = async (req, res, next) => {
  // package id from params
  const packageId = req.params.packageId;
  try {
    // search and delete a package by id
    const package = await Package.findByIdAndDelete(packageId);
    if (!package) {
      const error = new Error(Texts.not_package);
      error.status = 404;
      throw error;
    }
    // response sending
    res.status(201).json({
      deleted: true,
      package: package,
    });
  } catch (err) {
    next(err);
  }
};

// Blocks
exports.getAllBlocks = async (req, res, next) => {
  try {
    // get all the blocks and it's restaurants data
    const blocks = await Block.find()
      .populate("restaurants", "firstName")
      .populate("companies", "name")
      .populate("deliveryPerson", "firstName")
      .exec();
    if (!blocks) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ blocks: blocks });
  } catch (err) {
    next(err);
  }
};
exports.getBlock = async (req, res, next) => {
  // block id from params
  const blockId = req.params.blockId;
  try {
    // get a block by id with it's restaurants
    const block = await Block.findById(blockId)
      .populate("restaurants", "firstName")
      .populate("companies", "name")
      .populate("deliveryPerson", "firstName")
      .exec();
    if (!block) {
      const err = new Error(Texts.not_block);
      err.status = 404;
      throw err;
    }
    // response sending
    res.status(200).json({ block: block });
  } catch (err) {
    next(err);
  }
};
exports.registerBlock = async (req, res, next) => {
  let orderTime = req.body.timeForOrder;
  let timeforPickup = req.body.pickUpTime;
  let timeforDelivery = req.body.deliveryTime;

  orderTime = orderTime.split(":");
  orderTime = orderTime[0] + "h" + orderTime[1] + "m";

  timeforPickup = timeforPickup.split(":");
  timeforPickup = timeforPickup[0] + "h" + timeforPickup[1] + "m";

  timeforDelivery = timeforDelivery.split(":");
  timeforDelivery = timeforDelivery[0] + "h" + timeforDelivery[1] + "m";

  // req body values
  const name = req.body.name;
  const timeForOrder = orderTime;
  const pickUpTime = timeforPickup;
  const deliveryTime = timeforDelivery;
  const deliveryCost = req.body.deliveryCost;
  const restaurants = req.body.restaurants;
  const companies = req.body.companies;
  const deliveryPerson = req.body.deliveryPerson;

  try {
    // check if a block exists of same name
    const blockCheck = await Block.findOne({ name: name });
    if (blockCheck) {
      const err = new Error(Texts.already_block);
      err.status = 404;
      throw err;
    }
    if (!deliveryPerson) {
      // create a new block doc
      const input = {
        name: name,
        timeForOrder: timeForOrder,
        pickUpTime: pickUpTime,
        deliveryTime: deliveryTime,
        deliveryCost: deliveryCost,
        companies: req.body.companies,
        restaurants: req.body.restaurants,
      };
      const value = await validaion.register_block(input);
      const block = new Block(value);
      // save the block
      var blockSaved = await block.save();
    } else {
      const block = new Block({
        name: name,
        timeForOrder: timeForOrder,
        pickUpTime: pickUpTime,
        deliveryTime: deliveryTime,
        deliveryCost: deliveryCost,
        companies: req.body.companies,
        restaurants: req.body.restaurants,
        deliveryPerson: req.body.deliveryPerson,
      });
      // save the block
      var blockSaved = await block.save();
    }

    // Adding Block ID to company
    if (companies) {
      companies.map(async (id) => {
        var company = await Company.findByIdAndUpdate(id, {
          block: blockSaved._id,
        });
      });
    }

    // Adding Block ID to Restaurant
    if (restaurants) {
      restaurants.map(async (id) => {
        var restaurant = await User.findByIdAndUpdate(id, {
          block: blockSaved._id,
        });
      });
    }

    if (deliveryPerson) {
      await User.findByIdAndUpdate(deliveryPerson, {
        block: blockSaved._id,
      });
    }

    // response sending
    res.status(201).json({ registered: true, block: blockSaved });
  } catch (err) {
    next(err);
  }
};
exports.editBlock = async (req, res, next) => {
  let orderTime = req.body.timeForOrder;
  let timeforPickup = req.body.pickUpTime;
  let timeforDelivery = req.body.deliveryTime;

  orderTime = orderTime.split(":");
  orderTime = orderTime[0] + "h" + orderTime[1] + "m";

  timeforPickup = timeforPickup.split(":");
  timeforPickup = timeforPickup[0] + "h" + timeforPickup[1] + "m";

  timeforDelivery = timeforDelivery.split(":");
  timeforDelivery = timeforDelivery[0] + "h" + timeforDelivery[1] + "m";

  const companies = req.body.companies;
  const restaurants = req.body.restaurants;
  const deliveryPerson = req.body.deliveryPerson;
  const blockId = req.params.blockId;
  try {
    if (!deliveryPerson) {
      const input = {
        name: req.body.name,
        timeForOrder: orderTime,
        pickUpTime: timeforPickup,
        deliveryTime: timeforDelivery,
        deliveryCost: req.body.deliveryCost,
        companies: req.body.companies,
        restaurants: req.body.restaurants,
      };

      const value = await validaion.edit_block(input);

      var blockSaved = await Block.findByIdAndUpdate(blockId, value);
    } else {
      const input = {
        name: req.body.name,
        timeForOrder: orderTime,
        pickUpTime: timeforPickup,
        deliveryTime: timeforDelivery,
        deliveryCost: req.body.deliveryCost,
        companies: req.body.companies,
        restaurants: req.body.restaurants,
        deliveryPerson: req.body.deliveryPerson,
      };
      const value = await validaion.edit_block(input);
      var blockSaved = await Block.findByIdAndUpdate(blockId, value);
    }

    // Removing BlockId from deleted Company //
    const oldCompaniesID = [];
    // Storing already existed companies in OldCompanies from DataBase //
    const oldCompanies = await Company.find({ block: blockId });
    if (oldCompanies) {
      oldCompanies.map((val) => {
        oldCompaniesID.push(val.id);
      });

      // Comparing Old companies array with new requested companies array //
      const array3 = oldCompaniesID.filter(function (id) {
        return companies.indexOf(id) == -1;
      });
      array3.map(async (val) => {
        await Company.findByIdAndUpdate(val, { $unset: { block: 1 } });
        // find the users associated with that company
        const users = await User.find({ "user.company": val });
        // change status of every user to company (needs company to be functional)
        await Promise.all(
          users.map(async (userIn) => {
            const statusUser = await User.findById(userIn._id);
            statusUser.status = "company";
            await statusUser.save();
          })
        );
      });
    }

    // Removing BlockId from deleted Resturant //
    const oldResturantsID = [];
    // Storing already existed Restaurants in OldCompanies from DataBase //

    const oldResturants = await User.find({
      role: "restaurant",
      block: blockId,
    });
    if (oldResturants) {
      oldResturants.map((val) => {
        oldResturantsID.push(val.id);
      });
      // Comparing Old restaurants array with new requested restaurants array //

      const arr3 = oldResturantsID.filter(function (id) {
        return restaurants.indexOf(id) == -1;
      });
      arr3.map(async (val) => {
        await User.findByIdAndUpdate(val, { $unset: { block: 1 } });
      });
    }

    // Removing BlockId from deleted Delivery Person //
    const oldDeliveryPersonID = [];
    // Storing already existed Restaurants in OldCompanies from DataBase //

    const oldDeliveryPerson = await User.find({
      role: "delivery",
      block: blockId,
    });
    if (oldDeliveryPerson) {
      oldDeliveryPerson.map((val) => {
        oldDeliveryPersonID.push(val.id);
      });
      // Comparing Old restaurants array with new requested restaurants array //

      oldDeliveryPersonID.map(async (val) => {
        if (val !== deliveryPerson) {
          await User.findByIdAndUpdate(val, { $unset: { block: 1 } });
        }
      });
    }

    // Adding Block ID to company
    if (companies) {
      companies.map(async (id) => {
        var company = await Company.findByIdAndUpdate(id, {
          block: blockId,
        });
      });
    }

    // Adding Block ID to Restaurant
    if (restaurants) {
      restaurants.map(async (id) => {
        var restaurant = await User.findByIdAndUpdate(id, {
          block: blockId,
        });
      });
    }

    // Adding block id in delivery person
    if (deliveryPerson) {
      await User.findByIdAndUpdate(deliveryPerson, {
        block: blockId,
      });
    }

    res.status(201).json({ updated: true, block: blockSaved });
  } catch (err) {
    next(err);
  }
};
exports.deleteBlock = async (req, res, next) => {
  // block id from params
  const blockId = req.params.blockId;
  try {
    // find the block and dekete it by id
    const block = await Block.findByIdAndDelete(blockId);
    if (!block) {
      const error = new Error(Texts.not_block);
      error.status = 404;
      throw error;
    } else {
      const companies = block.companies;
      if (companies) {
        companies.map(async (item) => {
          await Company.findByIdAndUpdate(item, {
            $unset: { block: 1 },
          });
          // find the users associated with that company
          const users = await User.find({ "user.company": item });
          // change status of every user to company (needs company to be functional)
          await Promise.all(
            users.map(async (userIn) => {
              const statusUser = await User.findById(userIn._id);
              statusUser.status = "company";
              await statusUser.save();
            })
          );
        });
      }
      const restaurants = block.restaurants;
      if (restaurants) {
        restaurants.map(async (item) => {
          await User.findByIdAndUpdate(item, {
            $unset: { block: 1 },
          });
        });
      }
      const deliveryPerson = block.deliveryPerson;
      if (deliveryPerson) {
        await User.findByIdAndUpdate(deliveryPerson, {
          $unset: { block: 1 },
        });
      }
    }
    // response sending
    res.status(201).json({ deleted: true, block: block });
  } catch (err) {
    next(err);
  }
};

// Blocks +
exports.addRestaurantToBlock = async (req, res, next) => {
  // req body values
  const restaurantId = req.body.restaurantId;
  const blockId = req.body.blockId;

  try {
    // find the restaurant to add
    const restaurant = await User.findById(restaurantId);
    if (!restaurant) {
      const err = new Error(Texts.not_resturent);
      err.status = 404;
      throw err;
    }
    // find the block to add
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error(Texts.not_block);
      err.status = 404;
      throw err;
    }
    // add the restaurant to the block
    restaurant.block = block._id;
    block.restaurants.push(restaurant._id);
    const restaurantSaved = await restaurant.save();
    const blockSaved = await block.save();
    // response sending
    res
      .status(201)
      .json({ added: true, restaurant: restaurantSaved, block: blockSaved });
  } catch (err) {
    next(err);
  }
};
exports.addCompanyToBlock = async (req, res, next) => {
  // req body values
  const companyId = req.body.companyId;
  const blockId = req.body.blockId;

  try {
    // find the company to add
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error(Texts.not_company);
      err.status = 404;
      throw err;
    }
    // find the block to add
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error(Texts.not_block);
      err.status = 404;
      throw err;
    }
    // add the company to the block
    company.block = block._id;
    block.companies.push(company._id);
    const companySaved = await company.save();
    const blockSaved = await block.save();
    // response sending
    res
      .status(201)
      .json({ added: true, company: companySaved, block: blockSaved });
  } catch (err) {
    next(err);
  }
};
exports.addDeliveryPerson = async (req, res, next) => {
  // req body values
  const deliveryPersonId = req.body.deliveryPersonId;
  const blockId = req.body.blockId;

  try {
    // find the user to add
    const user = await User.findById(deliveryPersonId);
    if (!user) {
      const err = new Error(Texts.not_user);
      err.status = 404;
      throw err;
    }
    // find the block to add
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error(Texts.not_block);
      err.status = 404;
      throw err;
    }
    // add the user to the block
    user.block = block._id;
    block.deliveryPerson = user._id;
    const userSaved = await user.save();
    const blockSaved = await block.save();
    // response sending
    res.status(201).json({ added: true, user: userSaved, block: blockSaved });
  } catch (err) {
    next(err);
  }
};

exports.editDiscounts = async (req, res, next) => {
  const leastCart = req.body.leastCartValue;
  const referralDiscount = req.body.referralDiscount;

  try {
    const discount = await Discounts.findOne();
    if (!discount || discount.length === 0) {
      const input = {
        leastCartValue: leastCart,
        referralDiscount: referralDiscount,
      };
      const value = await validaion.edit_discount(input);
      const discountNew = new Discounts(value);
      const discountSaved = await discountNew.save();
      res.status(201).json({ created: true, discounts: discountSaved });
    } else {
      discount.leastCartValue = leastCart;
      discount.referralDiscount = referralDiscount;
      const discountSaved = await discount.save();
      res.status(201).json({ updated: true, discounts: discountSaved });
    }
  } catch (err) {
    next(err);
  }
};
exports.getDiscounts = async (req, res, next) => {
  try {
    const discounts = await Discounts.find();
    if (!discounts) {
      const err = new Error(Texts.Opps);
      err.status = 404;
      throw err;
    }
    res.status(200).json({ discounts: discounts });
  } catch (err) {
    next(err);
  }
};
