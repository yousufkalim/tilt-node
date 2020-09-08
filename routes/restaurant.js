const express = require("express");
const router = express.Router();

const restaurantController = require("../controllers/restaurant");
const isAuth = require("../utils/isAuth");

// Gets
router.get("/getall", isAuth, restaurantController.getAll);
router.get("/getbyid/:restaurantId", isAuth, restaurantController.getById);
router.get("/getallbyblock/:block", isAuth, restaurantController.getAllByBlock);

// Posts
router.post("/add", isAuth, restaurantController.addRestaurant);

// Others
router.put("/edit/:restaurantId", isAuth, restaurantController.editRestaurant);
router.delete(
  "/delete/:restaurantId",
  isAuth,
  restaurantController.deleteRestaurant
);

module.exports = router;
