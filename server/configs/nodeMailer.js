import nodemailer from "nodemailer";

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add connection timeout and retry options
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

const sendEmail = async ({ to, subject, body }) => {
  try {
    // Verify connection first
    await transporter.verify();

    const response = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html: body,
    });

    console.log("Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    console.error("Email sending failed:", error.message);

    // For development/testing, return a mock response
    if (process.env.NODE_ENV !== "production") {
      console.log("Development mode: Email not sent, but continuing...");
      return {
        messageId: "dev-mock-id",
        response: "Mock email sent in development",
      };
    }

    throw error;
  }
};

export default sendEmail;
