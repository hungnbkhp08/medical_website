import nodemailer from 'nodemailer';
import {generateMedicalReport} from './createPdf.js';
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
export const sendMailWithReport = async (to, diagnosis, prescription) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  // Tạo PDF trong bộ nhớ
  const pdfBuffer = await generateMedicalReport(diagnosis, prescription);
  // Gửi mail kèm PDF
  const mailOptions = {
    from: `"HealthCare Booking" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Kết quả khám bệnh',
    text: 'Bác sĩ gửi kèm kết quả khám bệnh và đơn thuốc.',
    html: `
      <p>Bác sĩ gửi kèm kết quả khám bệnh và đơn thuốc.</p>
      <p style="margin-top: 20px;">
        Trân trọng,<br/> 
        <em>HealthCare Booking</em>
      </p>
    `,
    attachments: [
      {
        filename: 'phieu-kham.pdf',
        content: pdfBuffer(),
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};