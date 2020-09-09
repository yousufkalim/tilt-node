const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../utils/isAuth");

// GET
router.get("/package", adminController.getAllPackages);
router.get("/package/get/:packageId", adminController.getPackage);

// POST
router.post("/package", adminController.registerPackage);

// PUT
router.put("/package/edit/:packageId", adminController.editPackage);

// DELETE
router.delete("/package/delete/:packageId", adminController.deletePackage);

module.exports = router;
