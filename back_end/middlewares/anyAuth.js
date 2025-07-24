import jwt from 'jsonwebtoken';

const anyAuth = async (req, res, next) => {
  try {
    const token = req.headers.token || req.headers.dtoken;
    if (!token) {
      return res.json({ success: false, message: "Thiếu token (user hoặc doctor)" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán thông tin vào req.user — nếu thiếu role thì lấy từ body hoặc query
    req.user = {
      id: decoded.id,
      role: decoded.role || req.body?.role || req.query?.role,
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
