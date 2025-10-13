import userModel from "../models/userModel.js"
import reviewModel from "../models/reviewModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendMail } from "../utils/sendMail.js";
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
        const userData = await userModel.findById(userId).select('-password');
        await sendMail(
          userData.email,
          'Cảm ơn bạn đã đánh giá',
          null,
          `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2d9cdb;">Cảm ơn bạn!</h2>
            <p>Xin chào <strong>${userData.name}</strong>,</p>
            <p>Chúng tôi rất cảm ơn bạn đã dành thời gian đánh giá trải nghiệm khám bệnh gần đây:</p>
            <p>Những đánh giá của bạn giúp chúng tôi nâng cao chất lượng dịch vụ và mang đến trải nghiệm tốt hơn cho tất cả bệnh nhân.</p>
            <p style="margin-top: 20px;">Trân trọng,<br/> <em>HealthCare Booking</em></p>
      
            <div style="margin-top: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dhqgnr8up/image/upload/v1754365138/blog-2020-04-07-how_to_say_thank_you_in_business-Apr-09-2024-05-22-03-0706-PM_f6ltre.webp" 
                   alt="HealthCare Logo" 
                   style="width: 100%; max-width: 600px; border-radius: 8px;" />
            </div>
          </div>
          `
      );      
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
  const getAllReviews = async (req, res) => {
    try {
      const reviews = await reviewModel.find({});
      // map qua để lấy thêm user và doctor
      const reviewsWithDetails = await Promise.all(
        reviews.map(async (review) => {
          const user = await userModel.findById(review.userId).select("name image");
          const doctor = await doctorModel.findById(review.docId).select("name image speciality");
          return {
            ...review.toObject(),
            user,
            doctor
          };
        })
      );
  
      res.json({ success: true, reviews: reviewsWithDetails });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: error.message });
    }
  };

  const getDoctorReviews = async (req, res) => {
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

export { submitReview, getListReview, getAllReviews, getDoctorReviews };