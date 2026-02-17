require("dotenv").config();
const sgMail = require("@sendgrid/mail");

const AppError = require("./AppError");
const {
  getWelcomeLoginTemplate,
  getWelcomeRegistartionTemplate,
} = require("./emailTemplates");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmail = async (emailData) => {
  try {
    let subject, body;

    switch (emailData?.type) {
      case "login-success":
        subject = "Welcome back to Moodaaz!";
        body = await getWelcomeLoginTemplate(emailData);
        break;
      case "registration-success":
        subject = "Moodaaz-registration is successful";
        body = await getWelcomeRegistartionTemplate(emailData);
        break;
      default:
        throw new AppError(400, "Invalid email type");
    }

    await sgMail.send({
      from: process.env.SENDGRID_FROM_EMAIL,
      to: emailData?.email,
      subject: subject,
      html: body,
    });

    return {
      message: "Email sent successfully",
      error: false,
      data: null,
    };
  } catch (err) {
    console.log("error in catch block of sendEmail", err);
    return {
      message: err.message || "Failed to send email",
      error: false,
      data: null,
    };
  }
};
