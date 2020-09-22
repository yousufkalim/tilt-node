const bcrypt = require("bcryptjs");

// Import Models
const User = require("../models/user");
const Company = require("../models/company");
const Package = require("../models/package");
const Block = require("../models/block");

// Profile
exports.registerAdmin = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const secret_code = req.body.secret_code;
  try {
    if (secret_code !== "secretcodeforadmin") {
      const err = new Error("Not authorized!");
      err.status = 404;
      throw err;
    }
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
      role: "admin",
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

// Company
exports.getAllCompanies = async (req, res, next) => {
  try {
    // find the company doc
    const companies = await Company.find();
    if (!companies) {
      const err = new Error("Whoops, there was an error!");
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
      const err = new Error("No such company found!");
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
      const error = new Error("Company with this name already exists!");
      error.status = 404;
      throw error;
    }
    // create a company doc
    const company = new Company({
      name: name,
      deliveryPlace: deliveryPlace,
    });
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
      const err = new Error("No such company found!");
      err.status = 404;
      throw err;
    }
    // update the new values
    company.name = name;
    company.deliveryPlace = deliveryPlace;
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
      const error = new Error("Whoops, there was an error!");
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
      const err = new Error("Whoops, there was an error!");
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
      const err = new Error("No such package found!");
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
      const error = new Error("Package with this name already exists!");
      error.status = 404;
      throw error;
    }
    // create a package doc
    const package = new Package({
      offPrice: offPrice,
      name: name,
      price: price,
      credits: credits,
      expiration: expiration,
    });
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
      const err = new Error("No such package found!");
      err.status = 404;
      throw err;
    }
    // update the new values
    package.name = name;
    package.price = price;
    package.offPrice = offPrice;
    package.credits = credits;
    package.expiration = expiration;
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
      const error = new Error("No such package found!");
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
    const blocks = await Block.find().populate("restaurants").exec();
    if (!blocks) {
      const err = new Error("Whoops, there was an error!");
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
    const block = await Block.findById(blockId).populate("restaurants").exec();
    if (!block) {
      const err = new Error("No such block exists!");
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
  // req body values
  const name = req.body.name;
  const orderTime = req.body.orderTime;
  const pickUpTime = req.body.pickUpTime;
  const deliveryTime = req.body.deliveryTime;
  const deliveryCost = req.body.deliveryCost;

  try {
    // check if a block exists of same name
    const blockCheck = await Block.findOne({ name: name });
    if (blockCheck) {
      const err = new Error("Block already exists with that name!");
      err.status = 404;
      throw err;
    }
    // create a new block doc
    const block = new Block({
      name: name,
      orderTime: orderTime,
      pickUpTime: pickUpTime,
      deliveryTime: deliveryTime,
      deliveryCost: deliveryCost,
    });
    // save the block
    const blockSaved = await block.save();
    // response sending
    res.status(201).json({ registered: true, block: blockSaved });
  } catch (err) {
    next(err);
  }
};
exports.editBlock = async (req, res, next) => {
  // block id to edit from req params
  const blockId = req.params.blockId;
  // req body values
  const name = req.body.name;
  const orderTime = req.body.orderTime;
  const pickUpTime = req.body.pickUpTime;
  const deliveryTime = req.body.deliveryTime;
  const deliveryCost = req.body.deliveryCost;
  try {
    // get a block by id with it's restaurants
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("No such block exists!!");
      err.status = 404;
      throw err;
    }
    // update with the new values
    block.name = name;
    block.orderTime = orderTime;
    block.pickUpTime = pickUpTime;
    block.deliveryTime = deliveryTime;
    block.deliveryCost = deliveryCost;
    // save the block
    const blockSaved = await block.save();
    // response sending
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
      const error = new Error("No such block exists!");
      error.status = 404;
      throw error;
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
      const err = new Error("No such restaurant exists!!");
      err.status = 404;
      throw err;
    }
    // find the block to add
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("No such block exists!!");
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
    const company = await User.findById(companyId);
    if (!company) {
      const err = new Error("No such company exists!!");
      err.status = 404;
      throw err;
    }
    // find the block to add
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("No such block exists!!");
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
