import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendMail,sendMailWithReport } from '../utils/sendMail.js';
import walletModel from "../models/walletModel.js";
import historyWalletModel from "../models/historyWalletModel.js";
const getWalletBalance = async (req, res) => {
    try {
        const { docId } = req.body;
        const walletData = await walletModel.findOne({ docId });
        if (!walletData) {
            return res.json({ success: false, message: 'Wallet not found' });
        }  
        const docData= await doctorModel.findById(docId).select('-password');
        res.json({ success: true, balance: walletData.balance, doctor: docData });
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
const createAll = async () => {
    try {
        const doctors = await doctorModel.find({});
        for (const doctor of doctors) {
            const existingWallet = await walletModel.findOne({ docId: doctor._id });
            if (!existingWallet) {
                const newWallet = new walletModel({
                    docId: doctor._id,
                    balance: 0
                });
                await newWallet.save();
            }
        }
        res.json({ success: true, message: 'All wallets created successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
const getAll = async (req, res) => {
    try {
        const wallets = await walletModel.find({});
        const detailedWallets = await Promise.all(wallets.map(async (wallet) => {
            const doctor = await doctorModel.findById(wallet.docId).select('-password');
            return {
                ...wallet.toObject(),
                doctor
            };
        }));
        res.json({ success: true, wallets: detailedWallets });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const getWalletHistory = async (req, res) => {
    try {
        const { docId } = req.body;
        const wallet = await walletModel.findOne({ docId });
        
        if (!wallet) {
            return res.json({ success: false, message: 'Wallet not found' });
        }
        
        const history = await historyWalletModel.find({ walletId: wallet._id }).sort({ date: -1 });
        res.json({ success: true, history });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
const changeStatus = async (req, res) => {
    try {
        const { docId, status } = req.body;
        const wallet = await walletModel.findOne({ docId });
        if (!wallet) {
            return res.json({ success: false, message: 'Wallet not found' });
        }   
        wallet.status = status;
        await wallet.save();
        res.json({ success: true, message: 'Wallet status updated successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export { getWalletBalance, createAll, getAll, getWalletHistory, changeStatus };