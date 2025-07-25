import jwt from 'jsonwebtoken';

const anyAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const dToken = req.headers.dtoken;

    if (!token && !dToken) {
      return res.json({ success: false, message: "Thiếu token (user hoặc doctor)" });
    }

    let decoded;
    let role;

    if (dToken) {
      decoded = jwt.verify(dToken, process.env.JWT_SECRET);
      role = 'doctor';
    } else if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      role = 'patient';
    }

    req.user = {
      id: decoded.id,
      role: role,
    };

    if (!req.user.role) {
      return res.json({ success: false, message: "Thiếu role người dùng (vui lòng gửi trong body hoặc token)" });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi xác thực token:", error.message);
    res.json({ success: false, message: "Token không hợp lệ" });
  }
};

export default anyAuth;
