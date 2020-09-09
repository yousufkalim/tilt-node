const express = require("express");
const router = express.Router();

const blockController = require("../controllers/block");
const isAuth = require("../utils/isAuth");

// Gets
router.get("/getall", isAuth, blockController.getAll);
router.get("/getbyid/:blockId", isAuth, blockController.getById);

// Posts
router.post("/add", isAuth, blockController.addBlock);

// Others
router.put("/edit/:blockId", isAuth, blockController.editBlock);
router.delete("/delete/:blockId", isAuth, blockController.deleteBlock);

module.exports = router;
