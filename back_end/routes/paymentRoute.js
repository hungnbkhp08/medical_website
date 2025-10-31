
import express from 'express';
import { createPayment, handleIpn, createPaymentForWallet, handleIpnForWallet} from '../controllers/paymentController.js';
import authDoctor from '../middlewares/authDoctor.js';

const paymentRoute = express.Router();

paymentRoute.post('/create-payment', createPayment);
paymentRoute.post('/ipn', handleIpn);
paymentRoute.post('/create-payment-for-wallet', authDoctor, createPaymentForWallet);
paymentRoute.post('/ipn-for-wallet', handleIpnForWallet);

export default paymentRoute;
