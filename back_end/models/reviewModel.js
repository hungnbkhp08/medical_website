import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  docId: { type: String, required: true },
  userId: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
});

const reviewModel = mongoose.models.reviews || mongoose.model("reviews", reviewSchema);

export default reviewModel;