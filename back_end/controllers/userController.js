import userModel from "../models/userModel.js";
import validator from 'validator'
import bycrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendMail } from '../utils/sendMail.js';
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Please fill all the fields" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(password, salt);
        const userData = {
            name,
            email,
            password: hashedPassword,
        }
        const newUser = new userModel(userData)
        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        res.json({ success: true, token, message: 'Register Successfully' })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }
        const isMatch = await bycrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            return res.json({ success: false, message: "Invalid creedentials" });
        }
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')
        res.json({ success: true, userData })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file;
        if (!name || !phone || !address || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }
        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageUrl = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }
        res.json({ success: true, messange: "Profile Updated" })

    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
// API to book appointment 
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select('-password')
        if (!docData.available) {
            res.json({ success: false, message: 'Doctor not available' });
        }
        // check trùng lịch 
        const checkAppointment = await appointmentModel.findOne({
            userId,
            slotDate,
            slotTime,
            cancelled: { $ne: 'true' }
        });
        if (checkAppointment) {
            res.json({ success: false, message: 'You already booked an appointment at this time' });
            return;
        }        
        let slots_booked = docData.slots_booked
        //checking for slot availablity
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                res.json({ success: false, message: 'Slot not available' });
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        }
        else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }
        const userData = await userModel.findById(userId).select('-password')
        delete docData.slots_booked
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        };
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save()
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
        await sendMail(
            userData.email,
            'Đặt lịch hẹn thành công',
            null,
            `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2d9cdb;">Đặt lịch hẹn thành công</h2>
              <p>Xin chào <strong>${userData.name}</strong>,</p>
              <p>Bạn đã đặt thành công cho lịch hẹn khám bệnh:</p>
              <ul>
                <li><strong>Ngày:</strong> ${appointmentData.slotDate}</li>
                <li><strong>Giờ:</strong> ${appointmentData.slotTime}</li>
              </ul>
              <p style="margin-top: 20px;">Trân trọng,<br/> <em>HealthCare Booking</em></p>
          
              <div style="margin-top: 30px; text-align: center;">
                <img src="https://res.cloudinary.com/dhqgnr8up/image/upload/v1754365138/blog-2020-04-07-how_to_say_thank_you_in_business-Apr-09-2024-05-22-03-0706-PM_f6ltre.webp" alt="HealthCare Logo" style="width: 100%; max-width: 600px; border-radius: 8px;" />
              </div>
            </div>
            `
        );

        res.json({ success: true, messange: "Appointment booked" })

    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get user appointments for frontend my_appointments page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })
        res.json({ success: true, appointments })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const updatePaidAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Xác minh người dùng có phải là chủ lịch hẹn hay không
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }
        await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
        const userData = await userModel.findById(userId).select('-password')
        await sendMail(
            userData.email,
            'Xác nhận thanh toán lịch hẹn',
            null,
            `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2d9cdb;">Thanh toán thành công</h2>
              <p>Xin chào <strong>${userData.name}</strong>,</p>
              <p>Bạn đã thanh toán thành công cho lịch hẹn khám bệnh:</p>
              <ul>
                <li><strong>Ngày:</strong> ${appointmentData.slotDate}</li>
                <li><strong>Giờ:</strong> ${appointmentData.slotTime}</li>
              </ul>
              <p style="margin-top: 20px;">Trân trọng,<br/> <em>HealthCare Booking</em></p>
          
              <div style="margin-top: 40px; text-align: center;">
                <img src="https://res.cloudinary.com/dhqgnr8up/image/upload/v1754365138/blog-2020-04-07-how_to_say_thank_you_in_business-Apr-09-2024-05-22-03-0706-PM_f6ltre.webp" alt="HealthCare Logo" style="width: 100%; max-width: 600px; border-radius: 8px;" />
              </div>
            </div>
            `
        );
        return res.json({ success: true, message: 'Appointment payment successfully' });
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//API to cancel apppointment 
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Xác minh người dùng có phải là chủ lịch hẹn hay không
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        // Cập nhật trạng thái bị hủy của lịch hẹn
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Giải phóng slot của bác sĩ
        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        if (doctorData) {
            let slots_booked = doctorData.slots_booked;

            // Xóa slotTime khỏi danh sách đã đặt trong ngày slotDate
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

            // Cập nhật lại dữ liệu bác sĩ
            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }
        const userData = await userModel.findById(userId).select('-password');
        await sendMail(
            userData.email,
            'Xác nhận hủy lịch hẹn',
            null,
            `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #e74c3c;">Lịch hẹn của bạn đã được hủy</h2>
              <p>Xin chào <strong>${userData.name}</strong>,</p>
              <p>Chúng tôi xác nhận rằng bạn đã <strong>hủy lịch hẹn khám bệnh</strong> trước đó với thông tin như sau:</p>
              <ul>
                <li><strong>Ngày:</strong> ${appointmentData.slotDate}</li>
                <li><strong>Giờ:</strong> ${appointmentData.slotTime}</li>
              </ul>
              <p>Nếu đây là sự nhầm lẫn hoặc bạn cần đặt lại lịch hẹn, vui lòng truy cập website hoặc liên hệ chúng tôi để được hỗ trợ.</p>
              <p style="margin-top: 20px;">Trân trọng,<br/><em>HealthCare Booking</em></p>
          
              <div style="margin-top: 40px; text-align: center;">
                <img src="https://res.cloudinary.com/dhqgnr8up/image/upload/v1754365138/blog-2020-04-07-how_to_say_thank_you_in_business-Apr-09-2024-05-22-03-0706-PM_f6ltre.webp" alt="HealthCare Logo" style="width: 100%; max-width: 600px; border-radius: 8px;" />
              </div>
            </div>
            `
          );          
        return res.json({ success: true, message: 'Appointment cancelled successfully' });
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const getListUser = async (req, res) => {
    try {
        const users = await userModel.find({}).select(['-password', '-email'])
        res.json({ success: true, users })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, updatePaidAppointment, getListUser };