const express = require("express");
const multer = require("multer");
const router = express.Router();

const deliveryPersonController = require("../controllers/deliveryPerson");
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

var storageDocs = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "data/documents");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var uploadDoc = multer({
  storage: storageDocs,
  fileFilter: fileFilter,
});

// GET
router.get("/", isAuth, deliveryPersonController.getAll);
router.get("/get", isAuth, deliveryPersonController.getProfile);
router.get("/deliveries", isAuth, deliveryPersonController.getDeliveries);
router.get("/history", isAuth, deliveryPersonController.getHistory);

// POST
router.post("/", deliveryPersonController.registerUser);

// PUT
router.put(
  "/add-bank",
  isAuth,
  uploadDoc.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  deliveryPersonController.addBank
);
router.put(
  "/edit-bank",
  isAuth,
  uploadDoc.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  deliveryPersonController.editBank
);
router.put("/edit", isAuth, deliveryPersonController.editProfile);
router.put("/pick", isAuth, deliveryPersonController.pickDelivery);
router.put("/deliver", isAuth, deliveryPersonController.deliverDelivery);
router.put("/editpassword", isAuth, deliveryPersonController.changePassword);

// DELETE
router.delete(
  "/delete/:userId",
  isAuth,
  deliveryPersonController.deleteProfile
);

module.exports = router;
