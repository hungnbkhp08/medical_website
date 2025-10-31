import mongoose from "mongoose";
const walletSchema = new mongoose.Schema({
        docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctors', required: true },
        balance : { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});
const walletModel = mongoose.model.wallet || mongoose.model("wallet", walletSchema);
export default walletModel;
