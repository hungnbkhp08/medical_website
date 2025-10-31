import express from 'express';
const walletRoute=express.Router();
import { getWalletBalance,createAll,getAll,getWalletHistory,changeStatus } from '../controllers/walletController.js';
import authAdmin from '../middlewares/authAdmin.js';
import authDoctor from '../middlewares/authDoctor.js';
walletRoute.post('/get-wallet-balance',authDoctor, getWalletBalance);
walletRoute.post('/create-all-wallets', createAll);
walletRoute.get('/get-all-wallets',authAdmin, getAll);
walletRoute.post('/get-wallet-history',authDoctor, getWalletHistory);
walletRoute.post('/get-wallet-history-admin',authAdmin, getWalletHistory);
walletRoute.post('/change-wallet-status', authAdmin, changeStatus);

export default walletRoute;