const express = require("express");
const router = express.Router();

const dishController = require("../controllers/dish");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, dishController.getAll);
router.get("/get/:dishId", isAuth, dishController.getById);
router.post("/getAllByRestaurantById", dishController.getAllByRestaurantById);

module.exports = router;
