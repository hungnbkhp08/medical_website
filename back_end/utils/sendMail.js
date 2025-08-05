import nodemailer from 'nodemailer';
export const sendMail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: `"HealthCare Booking" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,  
    html 
  };

  return transporter.sendMail(mailOptions);
};