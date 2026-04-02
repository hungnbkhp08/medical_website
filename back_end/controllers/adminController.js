import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import logModel from "../models/logModel.js";
import { sendMail } from "../utils/sendMail.js";
import fs from "fs";
import path from "path";
import {validateFile} from "../utils/validateImage.js";

// File lưu trữ trạng thái admin
const ADMIN_LOCK_FILE = path.join(process.cwd(), "admin_lock.json");

// Đọc trạng thái admin từ file
const getAdminLockStatus = () => {
  try {
    if (fs.existsSync(ADMIN_LOCK_FILE)) {
      const data = fs.readFileSync(ADMIN_LOCK_FILE, "utf8");
      return JSON.parse(data);
    }
    return { isLocked: false, countFailed: 0, unlockToken: null };
  } catch (error) {
    console.error("Error reading admin lock file:", error);
    return { isLocked: false, countFailed: 0, unlockToken: null };
  }
};

// Lưu trạng thái admin vào file
const saveAdminLockStatus = (status) => {
  try {
    fs.writeFileSync(ADMIN_LOCK_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error("Error saving admin lock file:", error);
  }
};
// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      image,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;
    // checking data
    if (
      !name ||
      !email ||
      !password ||
      !imageFile ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({
        success: false,
        message: "Please fill all the fields",
      });
    }
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh",
      });
    }
    if (imageFile) {
      const validationResult = await validateFile(imageFile);
      if (!validationResult.valid) {
        return res.json({success: false, message: `File không hợp lệ: ${validationResult.reason}`,});
      }
      // Giới hạn dung lượng 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        return res.json({
          success: false,
          message: "File quá lớn (tối đa 5MB)",
        });
      }
    }
    // hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //uploading image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
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
  } catch (error) {
    console.error("Error in addDoctor:", error);
    res.json({ success: false, message: error.message });
  }
};
// API admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra trạng thái khóa
    const adminStatus = getAdminLockStatus();

    if (adminStatus.isLocked) {
      return res.json({
        success: false,
        message:
          "Tài khoản admin đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng kiểm tra email để mở khóa.",
        locked: true,
      });
    }
     const now = Date.now();
    if (adminStatus.lastFailedAt) {
      const diff = now - new Date(adminStatus.lastFailedAt).getTime(); // ms

      if (diff > 2 * 60 * 1000) {
        // quá 2 phút → reset số lần sai
        adminStatus.countFailed = 0;
      }
    }

    // Kiểm tra thông tin đăng nhập
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Đăng nhập thành công - Reset lại countFailed
      saveAdminLockStatus({
        isLocked: false,
        countFailed: 0,
        unlockToken: null,
        lastFailedAt: null,
      });

      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    } else {
      // Sai mật khẩu - Tăng countFailed
      adminStatus.countFailed += 1;
      adminStatus.lastFailedAt = new Date();
      if (adminStatus.countFailed >= 5) {
        // Khóa tài khoản và tạo unlock token
        const unlockToken = jwt.sign(
          { email: process.env.ADMIN_EMAIL, type: "admin" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        adminStatus.isLocked = true;
        adminStatus.unlockToken = unlockToken;
        saveAdminLockStatus(adminStatus);

        // Tạo link mở khóa
        const unlockUrl = `${process.env.FRONTEND_URL_ADMIN}/unlock-account-admin?token=${unlockToken}`;

        // Gửi email cho admin
       await sendMail(
            process.env.ADMIN_EMAIL,
          'Tài khoản của bạn đã bị khóa',
          null,
          `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;"> Tài khoản bị khóa</h1>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                                Xin chào <strong>ADMIN</strong>,
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

        return res.json({
          success: false,
          message:
            "Tài khoản admin đã bị khóa do nhập sai mật khẩu 5 lần. Vui lòng kiểm tra email để mở khóa.",
          locked: true,
        });
      }

      // Lưu số lần thất bại
      saveAdminLockStatus(adminStatus);

      const remainingAttempts = 5 - adminStatus.countFailed;
      return res.json({
        success: false,
        message: `Email hoặc mật khẩu không đúng. Còn ${remainingAttempts} lần thử.`,
        remainingAttempts,
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
// API get all doctor
const allDoctor = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
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
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Cập nhật trạng thái bị hủy của lịch hẹn
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // Giải phóng slot của bác sĩ
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    if (doctorData) {
      let slots_booked = doctorData.slots_booked;

      // Xóa slotTime khỏi danh sách đã đặt trong ngày slotDate
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (e) => e !== slotTime
      );

      // Cập nhật lại dữ liệu bác sĩ
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    }
    const userData = await userModel
      .findById(appointmentData.userId)
      .select("-password");
    await sendMail(
      userData.email,
      "Hủy lịch khám thành công",
      `Xin chào ${userData.name},\n\nLịch khám của bạn vào ngày ${slotDate} lúc ${slotTime} đã được hủy bởi hệ thống.\n\nTrân trọng!`
    );

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});
    // chỉ lấy lịch hẹn đã hoàn thành
    const completedAppointments = appointments.filter(
      (appt) => appt.isCompleted
    );

    // tính bệnh nhân có nhiều lịch hẹn nhất
    const countMap = {};
    for (const appt of completedAppointments) {
      const userId = appt.userId?.toString();
      if (!userId) continue;
      countMap[userId] = (countMap[userId] || 0) + 1;
    }
    const topUsers = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([userId, count]) => ({ userId, count }));

    const userIds = topUsers.map((u) => u.userId);
    const patient = await userModel.find({ _id: { $in: userIds } });

    const patientsMostAppointments = patient.map((user) => {
      const found = topUsers.find((u) => u.userId === user._id.toString());
      return {
        user,
        count: found?.count || 0,
      };
    });

    // tính bác sĩ có nhiều lịch hẹn nhất
    const docCountMap = {};
    for (const appt of completedAppointments) {
      const docId = appt.docId?.toString();
      if (!docId) continue;
      docCountMap[docId] = (docCountMap[docId] || 0) + 1;
    }
    const topDocs = Object.entries(docCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([docId, count]) => ({ docId, count }));

    const docIds = topDocs.map((d) => d.docId);
    const doc = await doctorModel.find({ _id: { $in: docIds } });

    const doctorMostAppointments = doc.map((doctor) => {
      const found = topDocs.find((d) => d.docId === doctor._id.toString());
      return {
        doctor,
        count: found?.count || 0,
      };
    });
    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
      totalEarnings: appointments.reduce(
        (total, appointment) =>
          total + (appointment.isCompleted ? appointment.amount || 0 : 0),
        0
      ),
      patientsMostAppointments: patientsMostAppointments,
      doctorMostAppointments: doctorMostAppointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
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
      fees,
    });
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    await doctorModel.findByIdAndDelete(docId);
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API mở khóa tài khoản admin
const unlockAdminAccount = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ success: false, message: "Token không hợp lệ" });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "admin") {
      return res.json({ success: false, message: "Token không hợp lệ" });
    }

    // Kiểm tra trạng thái khóa
    const adminStatus = getAdminLockStatus();

    if (!adminStatus.isLocked) {
      return res.json({ success: false, message: "Tài khoản không bị khóa" });
    }

    if (adminStatus.unlockToken !== token) {
      return res.json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Mở khóa tài khoản
    saveAdminLockStatus({ isLocked: false, countFailed: 0, unlockToken: null });

    res.json({ success: true, message: "Mở khóa tài khoản thành công" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.json({
        success: false,
        message: "Link mở khóa đã hết hạn",
        expired: true,
      });
    }
    console.error(error);
    res.json({ success: false, message: "Token không hợp lệ" });
  }
};

// API gửi lại link mở khóa cho admin
const resendAdminUnlockLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return res.json({ success: false, message: "Email không hợp lệ" });
    }

    const adminStatus = getAdminLockStatus();

    if (!adminStatus.isLocked) {
      return res.json({ success: false, message: "Tài khoản không bị khóa" });
    }

    // Tạo token mới
    const unlockToken = jwt.sign(
      { email: process.env.ADMIN_EMAIL, type: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    adminStatus.unlockToken = unlockToken;
    saveAdminLockStatus(adminStatus);

    const unlockUrl = `${process.env.FRONTEND_URL_ADMIN}/unlock-account?token=${unlockToken}`;

    const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #5f6FFF; text-align: center;">🔓 Gửi lại link mở khóa tài khoản Admin</h2>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Xin chào <strong>Admin</strong>,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Bạn đã yêu cầu gửi lại link mở khóa tài khoản. Vui lòng nhấn nút bên dưới để mở khóa:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${unlockUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 40px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-size: 16px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            🔓 Mở khóa tài khoản
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Hoặc copy link sau vào trình duyệt:
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px;">
                        ${unlockUrl}
                    </p>
                    <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
                        ⚠️ Link này chỉ có hiệu lực trong <strong>1 giờ</strong>.
                    </p>
                </div>
                <p style="text-align: center; color: white; font-size: 12px; margin-top: 20px;">
                    © 2024 Medical Website. All rights reserved.
                </p>
            </div>
        `;

    await sendMail(
      process.env.ADMIN_EMAIL,
      "🔓 Link mở khóa tài khoản Admin mới",
      emailHtml
    );

    res.json({
      success: true,
      message: "Link mở khóa đã được gửi lại đến email admin",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const logs = await logModel.find({}).sort({ created_at: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctor,
  appointmentsAdmin,
  cancelAppointment,
  adminDashboard,
  updateDoctorProfile,
  deleteDoctor,
  unlockAdminAccount,
  resendAdminUnlockLink,
  getLogs,
};
