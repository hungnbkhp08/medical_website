import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['doctor', 'patient'], required: true }
  },
  receiver: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['doctor', 'patient'], required: true }
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const messageModel = mongoose.model.message || mongoose.model('messages', messageSchema);
export default messageModel;   

