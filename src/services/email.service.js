const sgMail = require("@sendgrid/mail");
const { SENDGRID_FROM_EMAIL, SENDGRID_API_KEY } = require("../config/env");

sgMail.setApiKey(SENDGRID_API_KEY);
exports.sendEmail = ({ email, subject, body }) => {
  return sgMail.send({
    from: SENDGRID_FROM_EMAIL,
    to: email,
    subject,
    html: body,
  });
};
