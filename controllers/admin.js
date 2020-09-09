// Import Models
const Package = require("../models/package");

// Gets
exports.getAllPackages = async (req, res, next) => {
  try {
    const packages = await Package.find();
    if (!packages) {
      res.status(200).json({ packages: [] });
    } else {
      res.status(200).json({ packages: packages });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getPackage = async (req, res, next) => {
  const packageId = req.params.packageId;
  try {
    const package = await Package.findById(packageId);
    if (!package) {
      res.status(200).json({ package: "" });
    } else {
      res.status(200).json({ package: package });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
exports.registerPackage = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const offPrice = req.body.offPrice;
  const credits = req.body.credits;
  const expiration = req.body.expiration;

  try {
    const packageCheck = await Package.findOne({ name: name });
    if (packageCheck) {
      const error = new Error("Package with this name already exists!");
      error.status = 404;
      throw error;
    }
    const package = new Package({
      offPrice: offPrice,
      name: name,
      price: price,
      credits: credits,
      expiration: expiration,
    });
    const packageSaved = await package.save();

    res.status(201).json({
      registered: true,
      package: packageSaved,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editPackage = async (req, res, next) => {
  const packageId = req.params.packageId;
  const name = req.body.name;
  const price = req.body.price;
  const offPrice = req.body.offPrice;
  const credits = req.body.credits;
  const expiration = req.body.expiration;
  try {
    const package = await Package.findById(packageId);
    if (!package) {
      const err = new Error("No such package found!");
      err.status = 404;
      throw err;
    }

    package.name = name;
    package.price = price;
    package.offPrice = offPrice;
    package.credits = credits;
    package.expiration = expiration;

    const packageSaved = await package.save();

    res.status(201).json({
      updated: true,
      package: packageSaved,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deletePackage = async (req, res, next) => {
  const packageId = req.params.packageId;
  try {
    const package = await Package.findByIdAndDelete(packageId);
    if (!package) {
      const error = new Error("No such package found!");
      error.status = 404;
      throw error;
    }
    res.status(201).json({
      deleted: true,
      package: package,
    });
  } catch (err) {
    next(err);
  }
};
