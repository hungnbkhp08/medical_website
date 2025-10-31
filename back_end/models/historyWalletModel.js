import mogoose from 'mongoose';
const historyWalletSchema = new mogoose.Schema({
    walletId: { type: mogoose.Schema.Types.ObjectId, ref: 'wallet', required: true },  
    amount: { type: Number, required: true }, 
    date: { type: Date, default: Date.now },
});
const historyWalletModel = mogoose.model.historyWallet || mogoose.model("historyWallet", historyWalletSchema);
export default historyWalletModel;