import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
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
  const doc = new PDFDocument();
  const stream = new PassThrough();
  doc.pipe(stream);

  // Load font Arial hỗ trợ tiếng Việt
  const fontPath = path.join(process.cwd(), 'fonts', 'arial.ttf');
  doc.registerFont('Arial', fontPath);
  doc.font('Arial');

  // Tiêu đề
  doc.fontSize(20).text('Phiếu Khám Bệnh', { align: 'center' });
  doc.moveDown();

  // Kết quả chẩn đoán
  doc.fontSize(14).text(`Chẩn đoán: ${diagnosis}`);
  doc.moveDown();

  // Đơn thuốc
  doc.fontSize(16).text('Đơn thuốc:', { underline: true });
  doc.moveDown(0.5);

  prescription.forEach((item, index) => {
    doc.fontSize(12).text(
      `${index + 1}. ${item.name} - ${item.quantity} ${item.unit}`
    );
  });

  doc.end();

  // Convert sang Buffer
  const pdfBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

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
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};