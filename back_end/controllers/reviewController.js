import userModel from "../models/userModel.js"
import reviewModel from "../models/reviewModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
const submitReview = async (req, res) => {
    try {
        const { docId, userId, rating, comment } = req.body;
        const existingReview = await reviewModel.findOne({ docId, userId });
        if (existingReview) {
            return res.json({ success: false, message: 'Bạn đã đánh giá bác sĩ này rồi' });
        }
        const appointment = await appointmentModel.findOne({ docId, userId });
        if(!appointment.isCompleted){
            return res.json({ success: false, message: 'Bạn chưa từng khám bác sĩ này, không thể đánh giá' });
        }
        const newReview = new reviewModel({ docId, userId, rating, comment });
        await newReview.save();
        // Calculate the new average rating for the doctor
        const reviews = await reviewModel.find({ docId });
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        await doctorModel.findByIdAndUpdate(docId, { averageRating });
        res.json({ success: true, message: 'Đánh giá thành công', review: newReview });
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const getListReview = async (req, res) => {
    try {
      const { docId } = req.body;
      const reviews = await reviewModel.find({ docId });
      // map qua để lấy thêm user
      const reviewsWithUser = await Promise.all(
        reviews.map(async (review) => {
          const user = await userModel.findById(review.userId).select("name image");
          return {
            ...review.toObject(),
            user
          };
        })
      );
  
      res.json({ success: true, reviews: reviewsWithUser });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: error.message });
    }
  };

export { submitReview, getListReview };