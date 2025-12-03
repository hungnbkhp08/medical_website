import express from 'express';
import { bookAppointment, cancelAppointment, getListUser, getProfile, listAppointment,managerPatient,verifyLoginOtp,
    loginUser, registerUser, updatePaidAppointment, updateProfile, googleLoginUser,downloadResult,googleSignUpUser, unlockAccount, changePassword} from '../controllers/userController.js';
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
userRouter.post('/download-result',authUser,downloadResult)
userRouter.post("/google-login", googleLoginUser);
userRouter.post("/google-signup", googleSignUpUser);
userRouter.post("/manager-patient", authUser, managerPatient);
userRouter.post("/unlock-account", unlockAccount);
userRouter.post("/change-password", authUser, changePassword);
userRouter.post("/verify-login-otp", verifyLoginOtp);
export default userRouter