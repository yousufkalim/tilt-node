const express = require("express");
const router = express.Router();

const blockController = require("../controllers/block");
const isAuth = require("../utils/isAuth");

// GET
router.get("/getall", isAuth, blockController.getAll);
router.get("/getbyid/:blockId", isAuth, blockController.getById);

// POST
router.post("/add", isAuth, blockController.addBlock);

// PUT
router.put("/edit/:blockId", isAuth, blockController.editBlock);

// DELETE
router.delete("/delete/:blockId", isAuth, blockController.deleteBlock);

module.exports = router;
