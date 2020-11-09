const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan"); // logger
const helmet = require("helmet"); // headers
const DiscountsModel = require("./models/discounts");

// Routes Imports
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const deliveryRoutes = require("./routes/deliveryPerson");
const restaurantRoutes = require("./routes/restaurant");
const dishRoutes = require("./routes/dish");
const userRoutes = require("./routes/user");

// App initialization
const app = express();

// Debuggers
mongoose.set("debug", true);

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

// Logger
app.use(
  process.env.PORT
    ? morgan("combined", { stream: accessLogStream })
    : morgan("dev")
);

// CORS
app.options("*", cors()); // enable pre-flight across-the-board
app.use(cors());
app.use(helmet());

// BodyParser
app.use(bodyParser.json()); // application/json
app.use(bodyParser.urlencoded({ extended: false })); // application/x-www-form-urlencoded

// Serving Images Statically
app.use("/data", express.static(path.join(__dirname, "data")));

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/deliveryuser", deliveryRoutes);
app.use("/restaurant", restaurantRoutes);
app.use("/dish", dishRoutes);
app.use("/user", userRoutes);

// Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  const message = error.message;
  const status = error.status || 500;
  res.status(status).json({ message: message, error: error });
});

// PORT Handling
const PORT = process.env.PORT || 8080;

// Connecting to Database and listening to server
mongoose
  .connect(
<<<<<<< HEAD
    `mongodb+srv://${process.env.MONGO_URI_USERNAME}:${process.env.MONGO_URI_PASSWORD}@cluster0.ecurz.mongodb.net/${process.env.MONGO_URI_DATABASE}?retryWrites=true&w=majority`,
=======
    "mongodb://REDACTED:REDACTED@node.5ioaz.mongodb.net/tilt?retryWrites=true&w=majority",
>>>>>>> 2c7af6c288732730df52f8460777d77d4afc1c13
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(async (result) => {
    app.listen(PORT, () => console.log(`App listening at ${PORT}`));
    const discount = await DiscountsModel.find();
    if (!discount || discount.length === 0) {
      const discountNew = new DiscountsModel();
      await discountNew.save();
    }
  })
  .catch((err) => {
    console.log("[App.Mongoose]", err);
  });

// `mongodb://REDACTED:REDACTED@cluster0.ecurz.mongodb.net/tilt?retryWrites=true&w=majority`
