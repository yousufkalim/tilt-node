const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../utils/isAuth");

// GET
router.get("/package", adminController.getAllPackages);
router.get("/package/get/:packageId", adminController.getPackage);
router.get("/block", adminController.getAllBlocks);
router.get("/block/get/:blockId", adminController.getBlock);

// POST
router.post("/package", adminController.registerPackage);
router.post("/block", adminController.registerBlock);

// PUT
router.put("/package/edit/:packageId", adminController.editPackage);
router.put("/block/edit/:blockId", adminController.editBlock);

// DELETE
router.delete("/package/delete/:packageId", adminController.deletePackage);
router.delete("/block/delete/:blockId", adminController.deleteBlock);

module.exports = router;
