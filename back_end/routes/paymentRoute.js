
import express from 'express';
import { createPayment, handleIpn, createPaymentForWallet, handleIpnForWallet, simulateIpn, simulateIpnWallet } from '../controllers/paymentController.js';
import authDoctor from '../middlewares/authDoctor.js';
import authAdmin from '../middlewares/authAdmin.js';

const paymentRoute = express.Router();

paymentRoute.post('/create-payment', createPayment);
paymentRoute.post('/ipn', handleIpn);
paymentRoute.post('/create-payment-for-wallet', authDoctor, createPaymentForWallet);
paymentRoute.post('/ipn-for-wallet', handleIpnForWallet);

// Admin xác nhận thanh toán khi app MoMo test lỗi hoặc xác nhận thủ công
paymentRoute.post('/simulate-ipn', authAdmin, simulateIpn);
paymentRoute.post('/simulate-ipn-wallet', simulateIpnWallet);

export default paymentRoute;
