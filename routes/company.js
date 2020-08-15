const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company");
const isAuth = require("../utils/isAuth");

// Gets
router.get("/getall", isAuth, companyController.getAll);
router.get("/getbyid/:companyId", isAuth, companyController.getById);
router.get("/getallbyblock/:block", isAuth, companyController.getAllByBlock);

// Posts
router.post("/add", isAuth, companyController.addCompany);

// Others
router.put("/edit/:companyId", isAuth, companyController.editCompany);
router.delete("/delete/:companyId", isAuth, companyController.deleteCompany);

module.exports = router;
