const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth");
const isAuth = require("../utils/isAuth");

// GET
router.get("/checkemail/:email", AuthController.checkEmail);

// POST
router.post("/login", AuthController.login);

// PUT
router.put("/recover", AuthController.recover);

module.exports = router;
