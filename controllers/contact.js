const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.CONTACT_FORM_EMAIL_SERVICE,
  auth: {
    user: process.env.CONTACT_FORM_EMAIL_LOGIN_EMAIL,
    pass: process.env.CONTACT_FORM_EMAIL_PASSWORD,
  },
});

exports.sendEmail = async (req, res, next) => {
  try {
    const { prenom, nom, phone, email, message } = req.body;

    const mailOptions = {
      from: process.env.CONTACT_FORM_EMAIL_FROM_EMAIL,
      to: process.env.CONTACT_FORM_EMAIL_FROM_EMAIL,
      subject: "Contact Form Email",
      html: `
          <p><b>Prénom:</b> ${prenom}</p>
          <p><b>Nom:</b> ${nom}</p>
          <p><b>Numéro de téléphone:</b> ${phone}</p>
          <p><b>Adresse e-mail:</b> ${email}</p>
          <p><b>Message:</b> ${message}</p>
        `,
    };

    await transporter.sendMail(mailOptions);

    res.send({
      msg: "Email Sent Successfully",
      data: { prenom, nom, phone, email, message },
    });
  } catch (error) {
    console.log(error.message);
  }
};
