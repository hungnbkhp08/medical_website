import express from 'express';
import { bookAppointment, cancelAppointment, getListUser, getProfile, listAppointment, loginUser, registerUser, updatePaidAppointment, updateProfile } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';
const userRouter=express.Router();
userRouter.post('/sign-up',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/list',getListUser)
userRouter.post('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.post('/appointments',authUser,listAppointment)
userRouter.post('/cancel-appointments',authUser,cancelAppointment)
userRouter.post('/paid-appointments',authUser,updatePaidAppointment)

export default userRouter