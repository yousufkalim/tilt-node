const express = require("express");
const multer = require("multer");
const router = express.Router();

const restaurantController = require("../controllers/restaurant");
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
    cb(null, "data/restaurants");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var uploadRes = multer({
  storage: storageRes,
  fileFilter: fileFilter,
});

// GET
router.get("/", isAuth, restaurantController.getAll);
router.get("/get", isAuth, restaurantController.getById);
router.get("/cart", isAuth, restaurantController.getCart);

// POST
router.post(
  "/",
  uploadRes.single("image"),
  restaurantController.registerRestaurant
);

// PUT
router.put(
  "/edit",
  isAuth,
  uploadRes.single("image"),
  restaurantController.editRestaurant
);

// DELETE
router.delete("/delete", isAuth, restaurantController.deleteRestaurant);

module.exports = router;
