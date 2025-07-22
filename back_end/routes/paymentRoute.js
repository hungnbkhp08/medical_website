
import express from 'express';
import { createPayment, handleIpn } from '../controllers/paymentController.js';

const paymentRoute = express.Router();

paymentRoute.post('/create-payment', createPayment);
paymentRoute.post('/ipn', handleIpn);

export default paymentRoute;
