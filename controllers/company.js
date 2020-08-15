// Import Models
const Company = require("../models/company");

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
    if (!company) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ company: company });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getAllByBlock = async (req, res, next) => {
  const block = req.params.block;
  try {
    const companies = await Company.find({ block: block });
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

// Posts
exports.addCompany = async (req, res, next) => {
  const name = req.body.name;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;
  const block = req.body.block;
  const deliveryTime = req.body.deliveryTime;

  try {
    const companyCheck = await Company.findOne({ name: name });
    if (companyCheck) {
      const err = new Error("Company already exists with that name!");
      err.status = 404;
      throw err;
    }
    const company = new Company({
      name: name,
      address: address,
      deliveryPlace: deliveryPlace,
      block: block,
      deliveryTime: deliveryTime,
    });
    const companySaved = await company.save();

    res.status(201).json({ company: companySaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editCompany = async (req, res, next) => {
  const companyId = req.params.companyId;
  const address = req.body.address;
  const deliveryPlace = req.body.deliveryPlace;
  const block = req.body.block;
  const deliveryTime = req.body.deliveryTime;
  try {
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    company.address = address;
    company.deliveryPlace = deliveryPlace;
    company.block = block;
    company.deliveryTime = deliveryTime;
    const companySaved = await company.save();
    res.status(200).json({ company: companySaved });
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
    const company = await Company.findByIdAndDelete(companyId);
    if (!company) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    res.status(201).json({ deleted: true, company: company });
  } catch (err) {
    next(err);
  }
};
