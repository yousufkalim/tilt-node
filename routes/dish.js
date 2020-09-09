const express = require("express");
const multer = require("multer");
const router = express.Router();

const dishController = require("../controllers/dish");
const isAuth = require("../utils/isAuth");

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
var storageRes = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "data/dishes");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var uploadRes = multer({
  storage: storageRes,
  fileFilter: fileFilter,
});

// ======================== GET =========================
// Profile
router.get("/", dishController.getAll);
router.get("/get/:dishId", dishController.getById);
router.get(
  "/getallbyrestaurant/:restaurantId",
  dishController.getAllByRestaurant
);

// ======================== POST ========================
router.post("/", uploadRes.single("image"), dishController.addDish);

// ======================== PUT =========================
router.put("/edit/:dishId", uploadRes.single("image"), dishController.editDish);

// ======================== DELETE ======================
router.delete("/delete/:dishId", dishController.deleteDish);

module.exports = router;
