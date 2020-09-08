// Import Models
const Company = require("../models/company");
const Block = require("../models/block");

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
  const blockId = req.params.block;
  try {
    const block = await Block.findById(blockId).populate("companies").exec();
    if (!block) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ companies: block });
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
  const blockId = req.body.block;
  const address = req.body.address;
  const deliveryTime = req.body.deliveryTime;
  const deliveryPlace = req.body.deliveryPlace;

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
      deliveryTime: deliveryTime,
      deliveryPlace: deliveryPlace,
    });
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    const companySaved = await company.save();
    block.companies.push(companySaved._id);
    await block.save();
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
  const name = req.body.name;
  const address = req.body.address;
  const deliveryTime = req.body.deliveryTime;
  const deliveryPlace = req.body.deliveryPlace;
  try {
    const company = await Company.findById(companyId);
    if (!company) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    company.name = name;
    company.address = address;
    company.deliveryTime = deliveryTime;
    company.deliveryPlace = deliveryPlace;

    const companySaved = await company.save();

    res.status(201).json({ company: companySaved });
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
  const blockId = req.params.block;
  try {
    const company = await Company.findByIdAndDelete(companyId);
    if (!company) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    const block = await Block.findById(blockId);
    if (!block) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }

    const companies = block.companies.filter(
      (company) => String(company) !== String(company._id)
    );
    block.companies = companies;
    await block.save();
    res.status(201).json({ deleted: true, company: company });
  } catch (err) {
    next(err);
  }
};
