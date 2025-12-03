import { fileTypeFromFile } from "file-type";
import path from "path";
const validateFile = async (file) => {
    // MIME thật từ nội dung file (phát hiện bằng file-type)
    const detected = await fileTypeFromFile(file.path);
    const realMime = detected?.mime || "unknown/unknown";

    // MIME trình duyệt gửi lên (client-side)
    const clientMime = file.mimetype || "unknown/unknown";

    // Đuôi file từ tên ban đầu
    const originalName = file.originalname;
    const clientExt = path.extname(originalName).toLowerCase();

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    // 1) MIME thật phải hợp lệ
    if (!allowedMime.includes(realMime)) {
        return { valid: false, reason: `Sai loại file` };
    }

    // 2) MIME client gửi lên phải hợp lệ (tăng bảo mật)
    if (!allowedMime.includes(clientMime)) {
        return { valid: false, reason: `Sai loại file` };
    }

    // 3) Đuôi file phải hợp lệ
    if (!allowedExt.includes(clientExt)) {
        return { valid: false, reason: `Sai đuôi file` };
    }
    if (realMime !== clientMime) {
        return { valid: false, reason: "MIME thật và MIME client không trùng khớp" };
    }

    return { valid: true };
};
export { validateFile };