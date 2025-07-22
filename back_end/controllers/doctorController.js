import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";
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
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
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

export { changeAvailablity, getListDoctor, loginDoctor, getDoctorAppointments, markAppointmentCompleted, cancelAppointment, doctorDashboard, getDoctorProfile, updateDoctorProfile }