const express = require("express");
const router = express.Router();

const UserController = require("../controllers/user");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, UserController.getAll);
router.get("/get/:userId", isAuth, UserController.getUser);
router.get("/cart", isAuth, UserController.getCart);

// POST
router.post("/", UserController.registerUser);
router.post("/cart", isAuth, UserController.addToCart);

// PUT
router.put("/edit/:userId", isAuth, UserController.editUser);
router.put("/cart", isAuth, UserController.removeFromCart);

// DELETE
router.delete("/delete/:userId", isAuth, UserController.deleteUser);

module.exports = router;
