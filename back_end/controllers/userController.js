import userModel from "../models/userModel.js";
import validator from 'validator'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendMail } from '../utils/sendMail.js';
import { OAuth2Client } from "google-auth-library";
import { generateMedicalReport } from '../utils/createPdf.js';
import resultModel from "../models/resultModel.js";
import walletModel from "../models/walletModel.js";
import {validateFile} from "../utils/validateImage.js";
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //  Kiểm tra dữ liệu đầu vào
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Vui lòng nhập email hợp lệ" });
    }

    //  Kiểm tra độ mạnh mật khẩu
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!strongPasswordRegex.test(password)) {
      return res.json({
        success: false,
        message:
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      });
    }

    // Kiểm tra email trùng
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Người dùng đã tồn tại" });
    }

    //  Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP hết hạn sau 10 phút
        await sendMail(
          email,
          'Đăng ký tài khoản của bạn',
          ` Mã OTP để đăng ký tài khoản của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
          `<p>Mã OTP để đăng ký tài khoản của bạn là: <strong>${otp}</strong></p>
           <p>Mã này có hiệu lực trong 10 phút.</p>`
        );

    //  Lưu user mới
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      otpActive: otp,
      otpExpire: otpExpiry
    });

    await newUser.save();

    res.json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    console.error("Register error:", error);
    res.json({ success: false, message: "Lỗi máy chủ: " + error.message });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email })
      .select("+isLocked +countFailed +unlockToken +lastFailedAt +isActive");

    if (!user) {
      return res.json({ success: false, message: "User không tồn tại" });
    }

    if (user.isLocked) {
      return res.json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng kiểm tra email để mở khóa."
      });
    }

    // Kiểm tra TIME WINDOW 2 phút
    const now = Date.now();
    if (user.lastFailedAt) {
      const diff = now - new Date(user.lastFailedAt).getTime(); // ms

      if (diff > 2 * 60 * 1000) {
        // quá 2 phút → reset số lần sai
        user.countFailed = 0;
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // SAI MẬT KHẨU
    if (!isMatch) {

      user.countFailed += 1;
      user.lastFailedAt = new Date();

      if (user.countFailed >= 5) {
        user.isLocked = true;

        const unlockToken = jwt.sign(
          { id: user._id, purpose: "unlock_only" },
          process.env.JWT_SECRET
        );

        user.unlockToken = unlockToken;

        const unlockUrl = `${process.env.FRONTEND_URL}/unlock-account?token=${unlockToken}`;

        await sendMail(
          user.email,
          'Tài khoản của bạn đã bị khóa',
          null,
          `
          Tài khoản của bạn đã bị khóa do nhập sai quá 5 lần trong vòng 2 phút.<br>
          Nhấn vào link để mở khóa: <a href="${unlockUrl}">${unlockUrl}</a>
          `
        );
      }

      await user.save();
      return res.json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // ĐÚNG MẬT KHẨU
    if (isMatch) {
      if(!user.isActive){
        return res.json({ success: false, message: "Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên." });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      user.countFailed = 0;
      user.isLocked = false;
      user.unlockToken = null;
      user.lastFailedAt = null;

      await user.save();

      return res.json({ success: true, token });
    }

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if(!email || !otp ){
      return res.json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }
    
    const user = await userModel.findOne({ email }).select('+otpActive + otpExpire');
    
    if (!user) {
      return res.json({ success: false, message: "User không tồn tại" });
    }
    
    // Kiểm tra OTP có hợp lệ không
    if(!user.otpActive || !user.otpExpire){
      return res.json({ success: false, message: "Không tìm thấy mã OTP. Vui lòng thử đăng nhập lại." });
    }
    
    // Kiểm tra OTP hết hạn
    if(new Date() > user.otpExpire){
      return res.json({ success: false, message: "Mã OTP đã hết hạn. Vui lòng thử đăng nhập lại." });
    }
    
    // Kiểm tra OTP đúng không
    if(user.otpActive !== otp){
      return res.json({ success: false, message: "Mã OTP không chính xác" });
    }

    user.isActive = true;
    user.otpActive = null;
    user.otpExpire = null;
    await user.save();
    res.json({ success: true, message: "Xác thực OTP thành công. Tài khoản đã được kích hoạt." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const unlockAccount = async (req, res) => {
    try {
        const { token } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Chặn token nếu không phải loại unlock
        if (decoded.purpose !== "unlock_only") {
            return res.json({
                success: false,
                message: "Token không hợp lệ hoặc không có quyền mở khóa."
            });
        }

        const user = await userModel.findById(decoded.id)
            .select("+isLocked +countFailed +unlockToken");

        if (!user || user.unlockToken !== token) {
            return res.json({
                success: false,
                message: "Token không hợp lệ."
            });
        }

        // Mở khóa
        user.isLocked = false;
        user.countFailed = 0;
        user.unlockToken = null;
        await user.save();

        return res.json({
            success: true,
            message: "Tài khoản đã được mở khóa."
        });

    } catch (err) {
        return res.json({
            success: false,
            message: "Token hết hạn hoặc không hợp lệ."
        });
    }
};
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
      return res.json({ success: false, message: "Dữ liệu bị thiếu" });
    }
    if (imageFile) {
      //  Validate file image
      const validationResult = await validateFile(imageFile);
      if (!validationResult.valid) {  
        return res.json({ success: false, message: `File không hợp lệ: ${validationResult.reason}` });
      }
      // Giới hạn dung lượng 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        return res.json({ success: false, message: "File quá lớn (tối đa 5MB)" });
      }
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
    // check ví 
    const walletData = await walletModel.findOne({ docId: docId });
    if (!walletData || walletData.status === 'inactive' || walletData.balance < docData.fees * 0.1) {
      return res.json({ success: false, message: 'Không thể đặt lịch bác sỹ này.Vui lòng chuyển sang bác sỹ khác' });
    }
    // check trùng lịch 
    const checkAppointment = await appointmentModel.findOne({
      userId,
      slotDate,
      slotTime,
      cancelled: { $ne: 'true' }
    });
    if (checkAppointment) {
      res.json({ success: false, message: 'Bạn đã đặt lịch hẹn vào thời gian này' });
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
const downloadResult = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // 1. Tìm lịch hẹn
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      res.json({ success: false, message: "Không tìm thấy lịch hẹn" })
      return;
    }

    // 2. Kiểm tra đã hoàn thành chưa
    if (!appointment.isCompleted) {
      return res.json({ success: false, message: "Lịch hẹn chưa hoàn thành, chưa có kết quả" });
    }

    // 3. Sinh PDF từ diagnosis & prescription
    const pdfBuffer = await generateMedicalReport(
      appointment.diagnosis || "Chưa có chẩn đoán",
      appointment.prescription || []
    );

    // 4. Trả về file PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ket-qua-kham-${appointmentId}.pdf`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Lỗi download-result:", error);
    return res.json({ success: false, message: "Lỗi server khi tải kết quả" });
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
const logout=async (req, res) => {
  try {
    // For JWT, logout is typically handled on the client side by deleting the token.
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
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
const googleLoginUser = async (req, res) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const { credential } = req.body;

    // verify token từ google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    // tìm user theo email
    let user = await userModel.findOne({ email });

    if (!user) {
      // nếu chưa có thì tạo mới
      user = await userModel.create({
        name,
        email,
        // lưu sub làm password giả (không dùng thật sự cho login thường)
        password: sub,
      });
    }

    // tạo JWT token của hệ thống bạn
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Google login failed" });
  }
};
const googleSignUpUser = async (req, res) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const { credential } = req.body;

    // verify token từ google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    // tìm user theo email
    let user = await userModel.findOne({ email });

    if (!user) {
      // nếu chưa có thì tạo mới
      user = await userModel.create({
        name,
        email,
        password: sub,
      });
    }
    else {
      return res.json({ success: false, message: "Email đã được đăng ký, vui lòng kiểm tra lại!" });
    }
    res.json({ success: true, message: "Đăng ký thành công, vui lòng đăng nhập" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Google login failed" });
  }
};
const managerPatient = async (req, res) => {
  try {
    const results = await resultModel.find({});
    const listUserId = [...new Set(results.map(result => result.userId))];
    const users = await userModel.find({ _id: { $in: listUserId } }).select('-password');
    const appointment = await appointmentModel.find({ userId: { $in: listUserId } });
    const managerPatients = users.map(user => {
      const userResults = results.filter(result => result.userId.toString() === user._id.toString());
      const userAppointments = appointment.filter(app => app.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        results: userResults,
        appointments: userAppointments
      };
    });
    res.json({ success: true, managerPatients });
  }
  catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}
const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      return res.json({ success: false, message: "User không tồn tại" });
      }
      if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: "Mật khẩu mới và xác nhận mật khẩu không khớp" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.json({ success: false, message: "Mật khẩu cũ không đúng" });
      }
      // Kiểm tra độ mạnh mật khẩu mới
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        return res.json({
          success: false,
          message:
            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
        });
      }
      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      await sendMail(
        user.email,
        'Đổi mật khẩu thành công',
        null,
        `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2d9cdb;">Mật khẩu của bạn đã được thay đổi</h2>
              <p>Xin chào <strong>${user.name}</strong>,</p>  
              <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công.</p>
              <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức để bảo mật tài khoản.</p>
              <p style="margin-top: 20px;">Trân trọng,<br/> <em>HealthCare Booking</em></p>
              </div>
            `
      );
      res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
      console.error("Change password error:", error);
      res.json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
  };
export {
  registerUser, loginUser, getProfile, updateProfile, bookAppointment
  , listAppointment, cancelAppointment, updatePaidAppointment, getListUser, googleLoginUser, downloadResult, 
  googleSignUpUser, managerPatient, unlockAccount, changePassword,verifyLoginOtp,logout,
};