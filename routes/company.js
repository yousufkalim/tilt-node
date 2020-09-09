const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", companyController.getAll);
router.get("/get/:companyId", companyController.getById);

// POST
router.post("/", companyController.registerCompany);

// PUT
router.put("/edit/:companyId", companyController.editCompany);

// DELETE
router.delete("/delete/:companyId", companyController.deleteCompany);

module.exports = router;
