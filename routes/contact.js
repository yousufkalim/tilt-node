const express = require("express");
const router = express.Router();

const { sendEmail } = require("../controllers/contact");

// POST
router.post("/contact-form", sendEmail);

module.exports = router;
