import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";
import { sendMail } from '../utils/sendMail.js';
import userModel from "../models/userModel.js"
import reviewModel from "../models/reviewModel.js";
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Change' })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
const getListDoctor = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']).sort({ averageRating: -1 })
        res.json({ success: true, doctors })
    }
    catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
// API to login doctor
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await doctorModel.findOne({ email });
        if (!doctor) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token });
        }
        else {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
// API to get doctor appointments
const getDoctorAppointments = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//API to mark appointment as completed
const markAppointmentCompleted = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (appointment && appointment.docId === docId) {
            appointment.isCompleted = true;
            await appointment.save();
            // Send email to user about appointment completion
            const userData = await userModel.findById(appointment.userId).select('-password');
            await sendMail(
                userData.email,
                'Lịch hẹn đã hoàn tất',
                `Xin chào ${userData.name},\n\nLịch hẹn của bạn với bác sĩ ${appointment.docData.name} vào ngày ${appointment.slotDate} lúc ${appointment.slotTime} đã được đánh dấu là hoàn tất.\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Chúc bạn luôn mạnh khỏe và bình an!\n\nTrân trọng,\nĐội ngũ hỗ trợ HealthCare Booking`
            );            
            res.json({ success: true, message: "Appointment completed" });
        }
        else {
            return res.json({ success: false, message: "Appointment not found" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (appointment && appointment.docId === docId) {
            appointment.cancelled = true;
            await appointment.save();
            // Send email to user about appointment cancellation
            const userData = await userModel.findById(appointment.userId).select('-password');
            await sendMail(
                userData.email,
                'Lịch hẹn đã bị hủy',
                `Xin chào ${userData.name},\n\nLịch hẹn của bạn với bác sĩ ${appointment.docData.name} vào ngày ${appointment.slotDate} lúc ${appointment.slotTime} đã bị hủy.\n\nChúng tôi xin lỗi vì sự bất tiện này và hy vọng sẽ phục vụ bạn tốt hơn trong tương lai.\n\nTrân trọng,\nĐội ngũ hỗ trợ HealthCare Booking`
            );
            res.json({ success: true, message: "Appointment cancelled" });
        }
        else {
            return res.json({ success: false, message: "Appointment not found" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//Api to get dashboard data
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        let earnings = 0;
        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        })
        let patients = [];
        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId);
            }
        })
        const dashData = {
            appointments: appointments.length,
            earnings,
            patients: patients.length,
            lastestAppointments: appointments.reverse().slice(0, 5)
        }
        res.json({ success: true, dashData });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//Apii to get doctor profile
const getDoctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel.findById(docId).select(['-password', '-email']);
        if (!profileData) {
            return res.json({ success: false, message: 'Doctor not found' });
        }
        res.json({ success: true, profileData });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
//API to update doctor profile from Doctor panel
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
}
const getDoctorAvailability = async (req, res) => {
    try {
        let { slotDate, slotTime } = req.body;

        // Nếu slotDate là ISO string: "2025-08-07"
        // thì convert thành "7_8_2025"
        const dateObj = new Date(slotDate);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1; // JS month starts from 0
        const year = dateObj.getFullYear();

        const convertedDate = `${day}_${month}_${year}`;
        slotDate = convertedDate;

        // Tìm các lịch đã đặt (chưa bị hủy)
        const bookedAppointments = await appointmentModel.find({
            slotDate,
            slotTime,
            cancelled: { $ne: true }
        });

        // Lấy ID bác sĩ đã bị đặt
        const bookedDoctorIds = bookedAppointments.map(app => app.docId.toString());

        // Lọc ra bác sĩ chưa bị đặt
        const availableDoctors = await doctorModel.find({
            _id: { $nin: bookedDoctorIds }
        });
        console.log(availableDoctors.length)

        res.json({
            success: true,
            availableDoctors
        });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export { changeAvailablity, getListDoctor, loginDoctor, getDoctorAppointments, markAppointmentCompleted, 
    cancelAppointment, doctorDashboard, getDoctorProfile, updateDoctorProfile, getDoctorAvailability }