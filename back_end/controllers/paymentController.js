import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import appointmentModel from '../models/appointmentModel.js'; // Thêm dòng này để cập nhật DB

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
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true
      });

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
