// Import Models
const Plan = require("../models/plans");

// Gets
exports.getAll = async (req, res, next) => {
  try {
    const plans = await Plan.find();
    if (!plans) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ plans: plans });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getById = async (req, res, next) => {
  const planId = req.params.planId;
  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ plan: plan });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Posts
exports.addPlan = async (req, res, next) => {
  const name = req.body.name;
  const requirement = req.body.requirement;
  const discount = req.body.discount;

  try {
    const planCheck = await Plan.findOne({ name: name });
    if (planCheck) {
      const err = new Error("Plan already exists with that name!");
      err.status = 404;
      throw err;
    }
    const plan = new Plan({
      name: name,
      requirement: requirement,
      discount: discount,
    });
    const planSaved = await plan.save();
    res.status(201).json({ plan: planSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.editplan = async (req, res, next) => {
  const planId = req.params.planId;
  const name = req.body.name;
  const requirement = req.body.requirement;
  const discount = req.body.discount;
  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      const err = new Error("Whoops, there was en error!");
      err.status = 404;
      throw err;
    }
    plan.name = name;
    plan.requirement = requirement;
    plan.discount = discount;

    const planSaved = await plan.save();

    res.status(201).json({ plan: planSaved });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// Others
exports.deletePlan = async (req, res, next) => {
  const planId = req.params.planId;
  try {
    const plan = await Plan.findByIdAndDelete(planId);
    if (!plan) {
      const error = new Error("Whoops, there was an error!");
      error.status = 404;
      throw error;
    }
    res.status(201).json({ deleted: true, plan: plan });
  } catch (err) {
    next(err);
  }
};
