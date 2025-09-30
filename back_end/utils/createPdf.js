import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';

/**
 * Tạo PDF phiếu khám bệnh (trả về Buffer)
 * @param {String} diagnosis - Chuẩn đoán
 * @param {Array} prescription - Mảng thuốc [{ name, unit, quantity }]
 * @returns {Promise<Buffer>}
 */
export const generateMedicalReport = async (diagnosis, prescription = []) => {
  const doc = new PDFDocument();
  const stream = new PassThrough();
  doc.pipe(stream);

  // Load font Arial (hỗ trợ tiếng Việt)
  const fontPath = path.join(process.cwd(), 'fonts', 'arial.ttf');
  doc.registerFont('Arial', fontPath);
  doc.font('Arial');

  // Tiêu đề
  doc.fontSize(20).text('Phiếu Khám Bệnh', { align: 'center' });
  doc.moveDown();

  // Chẩn đoán
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

  // Convert sang Buffer để tái sử dụng
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};
