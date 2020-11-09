const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../utils/isAuth");

// GET
router.get("/company", adminController.getAllCompanies);
router.get("/company/get/:companyId", isAuth, adminController.getCompany);
router.get("/package", isAuth, adminController.getAllPackages);
router.get("/package/get/:packageId", isAuth, adminController.getPackage);
router.get("/block", isAuth, adminController.getAllBlocks);
router.get("/block/get/:blockId", isAuth, adminController.getBlock);
router.get("/discounts", adminController.getDiscounts);

// POST
router.post("/", adminController.registerAdmin);
router.post("/company", isAuth, adminController.registerCompany);
router.post("/package", isAuth, adminController.registerPackage);
router.post("/block", isAuth, adminController.registerBlock);
router.post(
  "/block/addRestaurant",
  isAuth,
  adminController.addRestaurantToBlock
);
router.post("/block/addCompany", isAuth, adminController.addCompanyToBlock);
router.post(
  "/block/addDeliveryPerson",
  isAuth,
  adminController.addDeliveryPerson
);

// PUT
router.put("/company/edit/:companyId", isAuth, adminController.editCompany);
router.put("/package/edit/:packageId", isAuth, adminController.editPackage);
router.put("/block/edit/:blockId", isAuth, adminController.editBlock);
router.put("/editDiscounts", isAuth, adminController.editDiscounts);
<<<<<<< HEAD
// router.put("/referral", isAuth, adminController.editReferralDiscount);
=======
>>>>>>> 2c7af6c288732730df52f8460777d77d4afc1c13

// DELETE
router.delete(
  "/company/delete/:companyId",
  isAuth,
  adminController.deleteCompany
);
router.delete(
  "/package/delete/:packageId",
  isAuth,
  adminController.deletePackage
);
router.delete("/block/delete/:blockId", isAuth, adminController.deleteBlock);

module.exports = router;
