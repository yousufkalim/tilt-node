// Import Models
const Company = require("../models/company");
const Block = require("../models/block");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const blocks = await Block.find()
      .populate("companies")
      .populate("restaurants")
      .exec();
    if (!blocks) {
      const err = new Error("Whoops, there was en error!");
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
exports.getById = async (req, res, next) => {
  const blockId = req.params.blockId;
  try {
    const block = await Block.findById(blockId)
      .populate("companies")
      .populate("restaurants")
      .exec();
    if (!block) {
      const err = new Error("Whoops, there was en error!");
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
exports.addBlock = async (req, res, next) => {
  const name = req.body.name;

  try {
    const blockCheck = await Block.findOne({ name: name });
    if (blockCheck) {
      const err = new Error("Block already exists with that name!");
      err.status = 404;
      throw err;
    }
    const block = new Block({
      name: name,
    });
    const blockSaved = await block.save();
    res.status(201).json({ block: blockSaved });
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
  try {
    const block = await Block.findById(blockId);
    if (!block) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    block.name = name;

    const blockSaved = await block.save();

    res.status(201).json({ block: blockSaved });
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
    const block = await Company.findByIdAndDelete(blockId);
    if (!block) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }

    res.status(201).json({ deleted: true, block: block });
  } catch (err) {
    next(err);
  }
};
