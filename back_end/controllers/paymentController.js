import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import appointmentModel from '../models/appointmentModel.js'; // Thêm dòng này để cập nhật DB
import userModel from '../models/userModel.js';
import { sendMail } from '../utils/sendMail.js';
dotenv.config();

// Lấy biến môi trường từ file .env
const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const redirectUrl = process.env.MOMO_REDIRECT_URL;
const ipnUrl = process.env.MOMO_IPN_URL;
const requestType = 'captureWallet';

// API tạo thanh toán
const createPayment = async (req, res) => {
  try {
    const { amount, orderId, orderInfo } = req.body;

    const requestId = Date.now().toString(); // Đảm bảo mỗi request có ID duy nhất
    const orderType = 'momo_wallet';
    const extraData = encodeURIComponent(JSON.stringify({ appointmentId: orderId })); // Truyền appointmentId dưới dạng extraData

    // Tạo chuỗi để ký
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    // Tạo chữ ký HMAC SHA256
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Dữ liệu gửi tới MoMo
    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    // Gửi request tạo đơn tới MoMo
    const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', body);

    return res.json({
      success: true,
      payUrl: response.data.payUrl,
      deeplink: response.data.deeplink,
      qrCodeUrl: response.data.qrCodeUrl
    });

  } catch (error) {
    console.error(' Payment error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      detail: error.response?.data
    });
  }
};

// API IPN Callback từ MoMo
const handleIpn = async (req, res) => {
  try {
    const {
      orderId,
      resultCode,
      extraData
    } = req.body;

    console.log(" MoMo IPN Received:", req.body);

    if (resultCode === 0) {
      // Thanh toán thành công

      // Lấy appointmentId từ extraData
      const parsedExtra = JSON.parse(decodeURIComponent(extraData));
      const appointmentId = parsedExtra.appointmentId;

      // Cập nhật trạng thái appointment là đã hoàn thành
      let appointment = await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true
      });
      const userId =appointment.userId;
      const userData = await userModel.findById(userId).select('-password');
              await sendMail(
                  userData.email,
                  'Xác nhận hủy lịch hẹn',
                  null,
                  `
                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #e74c3c;">Lịch hẹn của bạn đã được hủy</h2>
                    <p>Xin chào <strong>${userData.name}</strong>,</p>
                    <p>Chúng tôi xác nhận rằng bạn đã <strong>hủy lịch hẹn khám bệnh</strong> trước đó với thông tin như sau:</p>
                    <ul>
                      <li><strong>Ngày:</strong> ${appointmentData.slotDate}</li>
                      <li><strong>Giờ:</strong> ${appointmentData.slotTime}</li>
                    </ul>
                    <p>Nếu đây là sự nhầm lẫn hoặc bạn cần đặt lại lịch hẹn, vui lòng truy cập website hoặc liên hệ chúng tôi để được hỗ trợ.</p>
                    <p style="margin-top: 20px;">Trân trọng,<br/><em>HealthCare Booking</em></p>
                
                    <div style="margin-top: 40px; text-align: center;">
                      <img src="https://res.cloudinary.com/dhqgnr8up/image/upload/v1754365138/blog-2020-04-07-how_to_say_thank_you_in_business-Apr-09-2024-05-22-03-0706-PM_f6ltre.webp" alt="HealthCare Logo" style="width: 100%; max-width: 600px; border-radius: 8px;" />
                    </div>
                  </div>
                  `
                );          
      console.log(` Appointment ${appointmentId} marked as completed.`);
    } else {
      console.log(` Payment failed for OrderID: ${orderId}`);
    }

    return res.status(200).json({ success: true, message: 'IPN received' });

  } catch (error) {
    console.error(' IPN error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { createPayment, handleIpn };
