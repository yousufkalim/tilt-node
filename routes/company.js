const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company");
const isAuth = require("../utils/isAuth");

// GET
router.get("/", companyController.getAll);
router.get("/get", isAuth, companyController.getById);

// POST
router.post("/", companyController.registerCompany);

// PUT
router.put("/edit", isAuth, companyController.editCompany);

// DELETE
router.delete("/delete", isAuth, companyController.deleteCompany);

module.exports = router;
