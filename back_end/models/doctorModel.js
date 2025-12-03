import mongoose from "mongoose";
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    averageRating: { type: Number, default: 0.0 },
    isLocked: { type: Boolean, default: false, select: false },
    countFailed: { type: Number, default: 0, select: false },
    unlockToken: { type: String, select: false },
    lastFailedAt: { type: Date, default: null, select: false },
}, { minimize: false });
const doctorModel = mongoose.model.doctor || mongoose.model("doctors", doctorSchema);
export default doctorModel;
