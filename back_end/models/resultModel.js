import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    diagnosis: { type: String, required: true },
    prescription : [
    {
        name: { type: String },
        unit: { type: String },
        quantity: { type: Number }
    }
],    
});

const resultModel = mongoose.models.result || mongoose.model('result', resultSchema);

export default resultModel;
