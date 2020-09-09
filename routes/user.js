const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/user");
const isAuth = require("../utils/isAuth");

// Posts
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Gets
router.get("/checkemail/:email", AuthController.checkEmail);

// others
router.put("/edit", isAuth, AuthController.editProfile);
router.put("/editpassword", isAuth, AuthController.changePassword);

module.exports = router;
