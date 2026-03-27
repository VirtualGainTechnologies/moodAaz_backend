const sgMail = require("@sendgrid/mail");
const { SENDGRID_FROM_EMAIL, SENDGRID_API_KEY } = require("../config/env");

sgMail.setApiKey(SENDGRID_API_KEY);

exports.sendEmail = async ({ email, subject, body }) => {
  try {
    const response = await sgMail.send({
      from: SENDGRID_FROM_EMAIL,
      to: email,
      subject,
      html: body,
    });
    return response;
  } catch (error) {
    if (error.response) {
      const statusCode = error.code;
      const errors = error.response.body?.errors?.map((e) => e.message).join(", ") || "Unknown error";

      switch (statusCode) {
        case 400:
          throw new Error(`SendGrid bad request (400): ${errors}`);

        case 401:
          throw new Error(`SendGrid authentication failed (401): Invalid or missing API key`);

        case 403:
          throw new Error(`SendGrid authorization failed (403): ${errors}`);

        case 406:
          throw new Error(`SendGrid bad request (406): Missing or invalid Accept header`);

        case 429:
          throw new Error(`SendGrid rate limit exceeded (429): Too many requests, please retry later`);

        case 500:
          throw new Error(`SendGrid server error (500): Internal server error, please try again later`);

        default:
          throw new Error(`SendGrid error (${statusCode}): ${errors}`);
      }
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error(`Network error: Unable to reach SendGrid — check your internet connection`);
    }

    throw new Error(`Unexpected error while sending email: ${error.message}`);
  }
};
