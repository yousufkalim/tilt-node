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
var storageDish = multer.diskStorage({
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
var uploadDish = multer({
  storage: storageDish,
  fileFilter: fileFilter,
});

// GET
router.get("/", isAuth, restaurantController.getAll);
router.get("/get", isAuth, restaurantController.getById);
router.get("/cart", isAuth, restaurantController.getCart);
router.get("/history", isAuth, restaurantController.getHistory);
router.get("/dishes", isAuth, restaurantController.getDishes);
router.get("/dish/:dishId", isAuth, restaurantController.getDish);

// POST
router.post(
  "/",
  uploadRes.single("image"),
  restaurantController.registerRestaurant
);
router.post(
  "/dish",
  isAuth,
  uploadDish.single("image"),
  restaurantController.addDish
);

// PUT
router.put(
  "/edit",
  isAuth,
  uploadRes.single("image"),
  restaurantController.editRestaurant
);
router.put("/editpassword", isAuth, restaurantController.changePassword);
router.put("/cart/stop/:companyId", isAuth, restaurantController.stopOrdering);
router.put(
  "/cart/complete/:companyId",
  isAuth,
  restaurantController.completeOrder
);
router.put(
  "/dish",
  isAuth,
  uploadDish.single("image"),
  restaurantController.editDish
);

// DELETE
router.delete("/delete", isAuth, restaurantController.deleteRestaurant);
router.delete("/dish/:dishId", isAuth, restaurantController.deleteDish);

module.exports = router;
