const express = require("express");
const router = express.Router();

const UserController = require("../controllers/user");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, UserController.getAll);
router.get("/get", isAuth, UserController.getProfile);
router.get("/getbyid/:id", isAuth, UserController.getProfileById);
router.get("/cart", isAuth, UserController.getCart);
router.get("/order", isAuth, UserController.order);
router.get("/orders", isAuth, UserController.orders);
router.get("/dishes", isAuth, UserController.getDishes);
router.get("/dishlist/:companyId", UserController.getDishesWithoutAuth);

// POST
router.post("/", UserController.registerUser);
router.post("/cart", isAuth, UserController.addToCart);
router.post("/payment", isAuth, UserController.paymentHandler);
router.post("/package/payment", isAuth, UserController.packagePaymentHandler);

// PUT
router.put("/edit/:id", isAuth, UserController.editUser);
router.put("/cart", isAuth, UserController.removeFromCart);
router.put("/editpassword", isAuth, UserController.changePassword);
router.put("/creditCard", isAuth, UserController.editCreditCard);
router.put("/company/:companyId", isAuth, UserController.changeCompany);
router.put("/package/:packageId", isAuth, UserController.changePackage);

// DELETE
router.delete("/delete/:userId", isAuth, UserController.deleteUser);
router.delete("/creditCard", isAuth, UserController.deleteCreditCard);

module.exports = router;

// 01313964
