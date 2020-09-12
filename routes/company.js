const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", isAuth, companyController.getAll);
router.get("/get/:companyId", isAuth, companyController.getById);

// POST
router.post("/", companyController.registerCompany);

// PUT
router.put("/edit/:companyId", isAuth, companyController.editCompany);

// DELETE
router.delete("/delete/:companyId", isAuth, companyController.deleteCompany);

module.exports = router;
