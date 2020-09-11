// Import Models
const Package = require("../models/package");
const Block = require("../models/block");

// Gets
exports.getAllPackages = async (req, res, next) => {
  try {
    const packages = await Package.find();
    if (!packages) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ packages: packages });
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
      const err = new Error("No such package found!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ package: package });
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

// Gets
exports.getAllBlocks = async (req, res, next) => {
  try {
    const blocks = await Block.find().populate("restaurants").exec();
    if (!blocks) {
      const err = new Error("Whoops, there was an error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ blocks: blocks });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getBlock = async (req, res, next) => {
  const blockId = req.params.blockId;
  try {
    const block = await Block.findById(blockId).populate("restaurants").exec();
    if (!block) {
      const err = new Error("No such block exists!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ block: block });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
exports.registerBlock = async (req, res, next) => {
  const name = req.body.name;
  const pickUpTime = req.body.pickUpTime;
  const deliveryTime = req.body.deliveryTime;
  const deliveryCost = req.body.deliveryCost;

  try {
    const blockCheck = await Block.findOne({ name: name });
    if (blockCheck) {
      const err = new Error("Block already exists with that name!");
      err.status = 404;
      throw err;
    }
    const block = new Block({
      name: name,
      pickUpTime: pickUpTime,
      deliveryTime: deliveryTime,
      deliveryCost: deliveryCost,
    });
    const blockSaved = await block.save();
    res.status(201).json({ registered: true, block: blockSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editBlock = async (req, res, next) => {
  const blockId = req.params.blockId;
  const name = req.body.name;
  const pickUpTime = req.body.pickUpTime;
  const deliveryTime = req.body.deliveryTime;
  const deliveryCost = req.body.deliveryCost;
  try {
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("No such block exists!!");
      err.status = 404;
      throw err;
    }
    block.name = name;
    block.pickUpTime = pickUpTime;
    block.deliveryTime = deliveryTime;
    block.deliveryCost = deliveryCost;

    const blockSaved = await block.save();

    res.status(201).json({ updated: true, block: blockSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deleteBlock = async (req, res, next) => {
  const blockId = req.params.blockId;
  try {
    const block = await Block.findByIdAndDelete(blockId);
    if (!block) {
      const error = new Error("No such block exists!");
      error.status = 404;
      throw error;
    }

    res.status(201).json({ deleted: true, block: block });
  } catch (err) {
    next(err);
  }
};
