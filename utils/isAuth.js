const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const header = req.get("Authorization");

  if (!header) {
    const error = new Error("En-tête d'autorisation introuvable!");
    error.status = 400;
    next(error);
  }

  const token = header.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "verykeysecurehereused");
  } catch (error) {
    if (!error.status) {
      error.status = 500;
      next(error);
    }
  }

  if (!decodedToken) {
    const error = new Error("Jeton d'autorisation non validé!");
    error.status = 401;
    next(error);
  }
  req.userId = decodedToken.userId.toString();
  req.email = decodedToken.email;
  next();
};
