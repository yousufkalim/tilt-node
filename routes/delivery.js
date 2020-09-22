const express = require("express");
const router = express.Router();

const deliveryPersonController = require("../controllers/deliveryPerson");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, deliveryPersonController.getProfile);
router.get("/deliveries", isAuth, deliveryPersonController.getDeliveries);
router.get("/history", isAuth, deliveryPersonController.getHistory);

// POST
router.post("/", deliveryPersonController.registerUser);

// PUT
router.put("/edit", isAuth, deliveryPersonController.editProfile);
router.put("/deliveries", isAuth, deliveryPersonController.removeDelivery);
router.put("/editpassword", isAuth, deliveryPersonController.changePassword);

// DELETE
router.delete("/delete", isAuth, deliveryPersonController.deleteProfile);

module.exports = router;
