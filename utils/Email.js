const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
module.exports = async (user, email, generatedPassword) => {
  // Email Starts
  const filePath = path.join(__dirname, "./utils/resetPassword.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: user.firstName + " " + user.lastName,
    email: email,
    password: generatedPassword,
  };
  const htmlToSend = template(replacements);
  var transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_LOGIN_EMAIL,
      pass: process.env.EMAIL_LOGIN_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_FROM_EMAIL,
    to: user.email,
    subject: "Chancee-Password Reset Request",
    html: htmlToSend,
  };

  await transporter.sendMail(mailOptions);
};
