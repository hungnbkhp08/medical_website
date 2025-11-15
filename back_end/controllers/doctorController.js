import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import { sendMail, sendMailWithReport } from "../utils/sendMail.js";
import userModel from "../models/userModel.js";
import reviewModel from "../models/reviewModel.js";
import resultModel from "../models/resultModel.js";
import walletModel from "../models/walletModel.js";
const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availablity Change" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
const getListDoctor = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select(["-password", "-email"])
      .sort({ averageRating: -1 });
    res.json({ success: true, doctors });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
// API to login doctor
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel
      .findOne({ email })
      .select("+isLocked +countFailed +unlockToken");
    if (!doctor) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    if (doctor.isLocked) {
      return res.json({
        success: false,
        message:
          "Tài khoản của bạn đã bị khóa. Vui lòng kiểm tra email để mở khóa.",
      });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      doctor.countFailed += 1;
      if (doctor.countFailed >= 5) {
        doctor.isLocked = true;
        const unlockToken = jwt.sign(
          { id: doctor._id, purpose: "unlock_only" },
          process.env.JWT_SECRET
        );
        doctor.unlockToken = unlockToken;

        //  Tạo link mở khóa
        const unlockUrl = `${process.env.FRONTEND_URL_ADMIN}/unlock-account?dtoken=${unlockToken}`;

        // Gửi email với link mở khóa
        await sendMail(
          doctor.email,
          "Tài khoản của bạn đã bị khóa",
          null,
          `
                                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                            <h1 style="color: white; margin: 0;"> Tài khoản bị khóa</h1>
                                        </div>
                                        
                                        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                                            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                                                Xin chào <strong>${doctor.name}</strong>,
                                            </p>
                                            
                                            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                                     Tài khoản của bạn đã bị khóa do nhập sai mật khẩu <strong>quá 5 lần</strong>.
                                                </p>
                                            </div>
                                            
                                            <p style="color: #555; font-size: 15px; line-height: 1.6;">
                                                Để mở khóa tài khoản, vui lòng nhấp vào nút bên dưới:
                                            </p>
                                            
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="${unlockUrl}" 
                                                   style="display: inline-block; 
                                                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                                          color: white; 
                                                          padding: 15px 40px; 
                                                          text-decoration: none; 
                                                          border-radius: 50px; 
                                                          font-weight: bold; 
                                                          font-size: 16px;
                                                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                                     Mở khóa tài khoản
                                                </a>
                                            </div>
                                            
                                            <p style="color: #888; font-size: 13px; text-align: center; margin: 20px 0;">
                                                Hoặc copy link sau vào trình duyệt:
                                            </p>
                                            <div style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #495057; text-align: center;">
                                                ${unlockUrl}
                                            </div>
                                            
                                            
                                            <p style="color: #555; font-size: 14px; line-height: 1.6;">
                                                Nếu bạn không thực hiện hành động này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức để bảo mật tài khoản.
                                            </p>
                                            
                                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                                                <p style="color: #6c757d; font-size: 13px; margin: 0;">
                                                    Trân trọng,<br/>
                                                    <strong>HealthCare Booking Team</strong>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f1f3f5; border-radius: 5px;">
                                            <p style="color: #6c757d; font-size: 12px; margin: 0;">
                                                © 2025 HealthCare Booking. All rights reserved.<br/>
                                                Đây là email tự động, vui lòng không trả lời email này.
                                            </p>
                                        </div>
                                    </div>
                                    `
        );
      }
      await doctor.save();
      return res.json({
        success: false,
        message: "Thông tin đăng nhập không hợp lệ",
      });
    }
    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      doctor.countFailed = 0;
      doctor.isLocked = false;
      doctor.unlockToken = null;
      await doctor.save();
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const unlockAccount = async (req, res) => {
  try {
    const { dtoken } = req.body;

    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);

    // Chặn token nếu không phải loại unlock
    if (decoded.purpose !== "unlock_only") {
      return res.json({
        success: false,
        message: "Token không hợp lệ hoặc không có quyền mở khóa.",
      });
    }

    const doctor = await doctorModel
      .findById(decoded.id)
      .select("+isLocked +countFailed +unlockToken");

    if (!doctor || doctor.unlockToken !== dtoken) {
      return res.json({
        success: false,
        message: "Token không hợp lệ.",
      });
    }

    // Mở khóa
    doctor.isLocked = false;
    doctor.countFailed = 0;
    doctor.unlockToken = null;
    await doctor.save();

    return res.json({
      success: true,
      message: "Tài khoản đã được mở khóa.",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: "Token hết hạn hoặc không hợp lệ.",
    });
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
};
//API to mark appointment as completed
const markAppointmentCompleted = async (req, res) => {
  try {
    const { docId, appointmentId, diagnosis, prescription } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (appointment && appointment.docId === docId) {
      appointment.isCompleted = true;
      await appointment.save();
      const result = {
        appointmentId,
        diagnosis,
        prescription,
        userId: appointment.userId,
      };
      const newResult = new resultModel(result);
      await newResult.save();
      // Update user wallet balance
      const wallet = await walletModel.findOne({ docId: docId });
      if (appointment.payment) {
        wallet.balance += appointment.amount * 0.9;
        await wallet.save();
      } else {
        wallet.balance = wallet.balance - appointment.amount * 0.1;
        await wallet.save();
      }
      // Send email to user about appointment completion
      const userData = await userModel
        .findById(appointment.userId)
        .select("-password");
      await sendMailWithReport(userData.email, diagnosis, prescription);
      res.json({ success: true, message: "Appointment completed" });
    } else {
      return res.json({ success: false, message: "Appointment not found" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
//API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (appointment && appointment.docId === docId) {
      appointment.cancelled = true;
      await appointment.save();
      // Send email to user about appointment cancellation
      const userData = await userModel
        .findById(appointment.userId)
        .select("-password");
      await sendMail(
        userData.email,
        "Lịch hẹn đã bị hủy",
        `Xin chào ${userData.name},\n\nLịch hẹn của bạn với bác sĩ ${appointment.docData.name} vào ngày ${appointment.slotDate} lúc ${appointment.slotTime} đã bị hủy.\n\nChúng tôi xin lỗi vì sự bất tiện này và hy vọng sẽ phục vụ bạn tốt hơn trong tương lai.\n\nTrân trọng,\nĐội ngũ hỗ trợ HealthCare Booking`
      );
      res.json({ success: true, message: "Appointment cancelled" });
    } else {
      return res.json({ success: false, message: "Appointment not found" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
//Api to get dashboard data
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    const doctor = await doctorModel.findById(docId).select("-password -email");
    let earnings = 0;
    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });
    let patients = [];
    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });
    const wallet = await walletModel.findOne({ docId });
    const dashData = {
      appointments: appointments.length,
      rating: (doctor.averageRating / 5) * 100 || 0,
      earnings: earnings * 0.9,
      patients: patients.length,
      lastestAppointments: appointments.reverse().slice(0, 5),
      listAppointments: appointments,
      wallet,
      fees: doctor.fees,
    };
    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
//Apii to get doctor profile
const getDoctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel
      .findById(docId)
      .select(["-password", "-email"]);
    if (!profileData) {
      return res.json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, profileData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
//API to update doctor profile from Doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, address, available, fees } = req.body;
    await doctorModel.findByIdAndUpdate(docId, {
      address,
      available,
      fees,
    });
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
const changePassword= async (req, res) => {
  try {
    const { docId, currentPw, newPw } = req.body;
    const doctor = await doctorModel.findById(docId).select("+password");
    if (!doctor) {
      return res.json({ success: false, message: "Không tìm thấy bác sĩ" });
    }
    const isMatch = await bcrypt.compare(currentPw, doctor.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Mật khẩu cũ không đúng" });
    }
     const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!strongPasswordRegex.test(newPw)) {
        return res.json({
          success: false,
          message:
            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
        });
      }
    const hashedPassword = await bcrypt.hash(newPw, 10);
    doctor.password = hashedPassword;
    await doctor.save();
         await sendMail(
            doctor.email,
            'Đổi mật khẩu thành công',
            null,
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #2d9cdb;">Mật khẩu của bạn đã được thay đổi</h2>
                  <p>Xin chào <strong>${doctor.name}</strong>,</p>  
                  <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công.</p>
                  <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức để bảo mật tài khoản.</p>
                  <p style="margin-top: 20px;">Trân trọng,<br/> <em>HealthCare Booking</em></p>
                  </div>
                `
          );
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
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
      cancelled: { $ne: true },
    });

    // Lấy ID bác sĩ đã bị đặt
    const bookedDoctorIds = bookedAppointments.map((app) =>
      app.docId.toString()
    );

    // Lọc ra bác sĩ chưa bị đặt
    const availableDoctors = await doctorModel
      .find({
        _id: { $nin: bookedDoctorIds },
      })
      .select("name speciality fees");

    console.log(availableDoctors.length);

    res.json({
      success: true,
      availableDoctors,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailablity,
  getListDoctor,
  loginDoctor,
  getDoctorAppointments,
  markAppointmentCompleted,
  cancelAppointment,
  doctorDashboard,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAvailability,
  unlockAccount,
  changePassword,
};
