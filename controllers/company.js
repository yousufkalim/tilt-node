// Import Models
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// Profile
exports.getAll = async (req, res, next) => {
  try {
    // find the companies
    const companies = await User.find({
      role: "company",
    });
    if (!companies) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    // response send
    res.status(200).json({ companies: companies });
  } catch (err) {
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  // user id
  const companyId = req.userId;
  try {
    const company = await User.findById(companyId);
    if (!company) {
      const err = new Error("No such company exists!");
      err.status = 404;
      throw err;
    }
    // response send
    res.status(200).json({ company: company });
  } catch (err) {
    next(err);
  }
};
exports.registerCompany = async (req, res, next) => {
  // req body values
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;

  try {
    // email check
    const userCheck = await User.findOne({ email });
    if (userCheck) {
      const error = new Error("Email already exists!");
      error.status = 404;
      throw error;
    }
    // company check
    const companyCheck = await User.findOne({ firstName: name });
    if (companyCheck) {
      const err = new Error("Company already exists with that name!");
      err.status = 404;
      throw err;
    }
    // has the password
    const hashedPassword = await bcrypt.hash(password, 12);
    // new company user doc
    const company = new User({
      firstName: name,
      email: email,
      password: hashedPassword,
      status: "pending",
      role: "company",
      address: {
        street: address.street,
        city: address.city,
        zip: address.zip,
        lat: 0,
        long: 0,
      },
      company: {
        deliveryPlace: deliveryPlace,
      },
    });
    const companySaved = await company.save();

    // response send
    res.status(201).json({
      registered: true,
      company: companySaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.editCompany = async (req, res, next) => {
  // req body values
  const userId = req.userId;
  const email = req.body.email;
  const name = req.body.name;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;
  try {
    // find the user by id
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("No such company found!");
      error.status = 404;
      throw error;
    }
    // update the companies values
    user.email = email;
    user.firstName = name;
    user.address.street = address.street;
    user.address.city = address.city;
    user.address.zip = address.zip;
    user.company.deliveryPlace = deliveryPlace;

    const userSaved = await user.save();

    // response send
    res.status(201).json({
      updated: true,
      company: userSaved,
    });
  } catch (err) {
    next(err);
  }
};
exports.deleteCompany = async (req, res, next) => {
  // req body values
  const userId = req.userId;
  try {
    // find the user to change it's status
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    user.status = "deleted";
    const userSaved = await user.save();
    // find the users associated with that company
    const users = await User.find({ "user.company": userId });
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
      company: userSaved,
    });
  } catch (err) {
    next(err);
  }
};
