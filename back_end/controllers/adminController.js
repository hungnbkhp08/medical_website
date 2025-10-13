import validator from 'validator';
import bcrypt from 'bcrypt';
import{v2 as cloudinary} from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { sendMail } from '../utils/sendMail.js';
// API for adding doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, image, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;
        // checking data
        if (!name || !email || !password || !imageFile || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Please fill all the fields" });
        }
        if(!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }
        // hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        //uploading image to cloudinary
        const imageUpload= await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"});
        const imageUrl = imageUpload.secure_url;
        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now(),
        };
        const doctor = new doctorModel(doctorData);
        await doctor.save();
        res.json({ success: true, message: "Doctor added successfully" });
    }
    catch (error) {
        console.error("Error in addDoctor:", error);
        res.json({ success: false, message:error.message});
    }
}
 // API admin login
 const loginAdmin = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(email===process.env.ADMIN_EMAIL && password===process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }
        else{
            return res.json({ success: false, message: "Invalid email or password" });
        }
    }
    catch (error) {
        console.error( error);
        res.json({ success: false, message:error.message});
    }
 }
 // API get all doctor
const allDoctor= async (req,res) =>{
     try {
         const doctors=await doctorModel.find({}).select('-password')
         res.json({success:true,doctors})
     }
     catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
     }

}
//API get list appointment 
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
//API to cancel apppointment 
const cancelAppointment =async(req,res) =>{
    try{
        const {  appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
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
        const userData = await userModel.findById(appointmentData.userId).select('-password');
        await sendMail(
            userData.email,
            'Hủy lịch khám thành công',
            `Xin chào ${userData.name},\n\nLịch khám của bạn vào ngày ${slotDate} lúc ${slotTime} đã được hủy bởi hệ thống.\n\nTrân trọng!`
          );
    
        return res.json({ success: true, message: 'Appointment cancelled successfully' });
    } 
    catch(error){
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({});

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        };

        res.json({ success: true, dashData });
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, address, available, fees } = req.body;
        await doctorModel.findByIdAndUpdate(docId, {
            address,
            available,
            fees
        });
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        await doctorModel.findByIdAndDelete(docId);
        res.json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
export { addDoctor,loginAdmin,allDoctor, appointmentsAdmin,cancelAppointment,adminDashboard,
    updateDoctorProfile,deleteDoctor
};  