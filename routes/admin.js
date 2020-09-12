const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../utils/isAuth");

// GET
router.get("/package", isAuth, adminController.getAllPackages);
router.get("/package/get/:packageId", isAuth, adminController.getPackage);
router.get("/block", isAuth, adminController.getAllBlocks);
router.get("/block/get/:blockId", isAuth, adminController.getBlock);

// POST
router.post("/package", isAuth, adminController.registerPackage);
router.post("/block", isAuth, adminController.registerBlock);

// PUT
router.put("/package/edit/:packageId", isAuth, adminController.editPackage);
router.put("/block/edit/:blockId", isAuth, adminController.editBlock);

// DELETE
router.delete(
  "/package/delete/:packageId",
  isAuth,
  adminController.deletePackage
);
router.delete("/block/delete/:blockId", isAuth, adminController.deleteBlock);

module.exports = router;
