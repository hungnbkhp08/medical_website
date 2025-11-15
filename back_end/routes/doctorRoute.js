import express from 'express';
import { cancelAppointment, doctorDashboard, getDoctorAppointments, getDoctorAvailability, changePassword,
    getDoctorProfile, getListDoctor, loginDoctor, markAppointmentCompleted, updateDoctorProfile, unlockAccount } from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';
const doctorRouter=express.Router()
doctorRouter.post('/list',getListDoctor)
doctorRouter.post('/login',loginDoctor)
doctorRouter.post('/appointments',authDoctor,getDoctorAppointments)
doctorRouter.post('/complete-appointment',authDoctor,markAppointmentCompleted)
doctorRouter.post('/cancel-appointment',authDoctor,cancelAppointment)
doctorRouter.post('/dashboard',authDoctor,doctorDashboard)
doctorRouter.post('/profile',authDoctor,getDoctorProfile)
doctorRouter.post('/update-profile',authDoctor,updateDoctorProfile)
doctorRouter.post('/doctor-available',getDoctorAvailability)
doctorRouter.post('/unlock-account', unlockAccount)
doctorRouter.post('/change-password', authDoctor, changePassword)
export default doctorRouter