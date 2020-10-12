const express = require("express");
const router = express.Router();

const deliveryPersonController = require("../controllers/deliveryPerson");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, deliveryPersonController.getAll);
router.get("/get", isAuth, deliveryPersonController.getProfile);
router.get("/deliveries", isAuth, deliveryPersonController.getDeliveries);
router.get("/history", isAuth, deliveryPersonController.getHistory);

// POST
router.post("/", deliveryPersonController.registerUser);

// PUT
router.put("/bank", isAuth, deliveryPersonController.editBank);
router.put("/edit", isAuth, deliveryPersonController.editProfile);
router.put("/pick", isAuth, deliveryPersonController.pickDelivery);
router.put("/deliver", isAuth, deliveryPersonController.deliverDelivery);
router.put("/editpassword", isAuth, deliveryPersonController.changePassword);

// DELETE
router.delete("/delete", isAuth, deliveryPersonController.deleteProfile);

module.exports = router;
