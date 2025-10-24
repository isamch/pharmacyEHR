import nodemailer from "nodemailer";
import { emailTemplates } from "../templates/emailTemplates.js";


 
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});




export const sendMail = async ({ to, subject, templateName, templateData }) => {

  if (!emailTemplates[templateName]) {
    throw new Error("Email template not found");
  }

  const htmlContent = emailTemplates[templateName](templateData);

  const info = await transporter.sendMail({
    from: `"My App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent,
  });

  return info;
};