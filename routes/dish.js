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
router.get("/", isAuth, dishController.getAll);
router.get("/get/:dishId", isAuth, dishController.getById);
router.get(
  "/getallbyrestaurant/:restaurantId",
  isAuth,
  dishController.getAllByRestaurant
);

// ======================== POST ========================
router.post("/", isAuth, uploadRes.single("image"), dishController.addDish);

// ======================== PUT =========================
router.put(
  "/edit/:dishId",
  isAuth,
  uploadRes.single("image"),
  dishController.editDish
);

// ======================== DELETE ======================
router.delete("/delete/:dishId", isAuth, dishController.deleteDish);

module.exports = router;
