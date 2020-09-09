// Import Models
const User = require("../models/user");
const Company = require("../models/company");
const bcrypt = require("bcryptjs");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const companies = await Company.find();
    if (!companies) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ companies: companies });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const companyId = req.params.companyId;
  try {
    const company = await Company.findById(companyId);
    res.status(200).json({ company: company });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
exports.registerCompany = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;

  try {
    const userCheck = await User.findOne({ email });
    if (userCheck) {
      const error = new Error("Email already exists!");
      error.status = 404;
      throw error;
    }
    const companyCheck = await Company.findOne({ name: name });
    if (companyCheck) {
      const err = new Error("Company already exists with that name!");
      err.status = 404;
      throw err;
    }
    const company = new Company({
      name: name,
      address: {
        street: address.street,
        city: address.city,
        zip: address.zip,
        lat: 0,
        long: 0,
      },
      deliveryPlace: deliveryPlace,
    });
    const companySaved = await company.save();

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      status: "pending",
      role: {
        name: "company",
        id: companySaved._id,
      },
    });
    const userSaved = await user.save();
    res.status(201).json({
      registered: true,
      company: {
        email: userSaved.email,
        ...companySaved.toObject(),
      },
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editCompany = async (req, res, next) => {
  const companyId = req.params.companyId;
  const email = req.body.email;
  const name = req.body.name;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;
  try {
    const user = await User.findOne({ "role.id": companyId });
    if (!user) {
      const error = new Error("Email not found!");
      error.status = 404;
      throw error;
    }
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }

    user.email = email;

    company.name = name;
    company.address.street = address.street;
    company.address.city = address.city;
    company.address.zip = address.zip;
    company.deliveryPlace = deliveryPlace;

    const userSaved = await user.save();
    const companySaved = await company.save();

    res.status(201).json({
      updated: true,
      company: {
        email: userSaved.email,
        ...companySaved.toObject(),
      },
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deleteCompany = async (req, res, next) => {
  const companyId = req.params.companyId;
  try {
    const user = await User.findOneAndDelete({ "role.id": companyId });
    if (!user) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    const company = await Company.findByIdAndDelete(companyId);
    if (!company) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    const users = await User.find({ company: companyId });
    await Promise.all(
      users.map(async (userIn) => {
        const statusUser = await User.findById(userIn._id);
        statusUser.status = "company";
        await statusUser.save();
      })
    );
    res.status(201).json({
      deleted: true,
      company: {
        email: user.email,
        ...company.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
};
