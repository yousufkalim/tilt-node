const express = require("express");
const router = express.Router();

const dishController = require("../controllers/dish");
const isAuth = require("../utils/isAuth");

// Gets
router.get("/getall", isAuth, dishController.getAll);
router.get("/getbyid/:blockId", isAuth, dishController.getById);

// Posts
router.post("/add", isAuth, dishController.addBlock);

// Others
router.put("/edit/:blockId", isAuth, dishController.editBlock);
router.delete("/delete/:blockId", isAuth, dishController.deleteBlock);

module.exports = router;
