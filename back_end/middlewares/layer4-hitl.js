/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 4 — Human-in-the-Loop (HITL)                        ║
 * ║  OWASP LLM Prompt Injection Prevention                      ║
 * ║  Stack: Express.js + Dify API                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Dùng collection `logs` sẵn có, thêm các field:
 *   rule_id  = 'LAYER4_HITL'
 *   msg      = lý do bị giữ lại
 *   data     = query gốc
 *   + field mở rộng: status, reviewed_by, reviewed_at, review_note,
 *                    dify_response, conversation_id, dify_user
 *
 * Gắn vào route:
 *   router.post('/chat', authUser, inputValidation, hitlCheck, sendChatMessage, outputValidation);
 *   router.get('/admin/hitl/queue',        authAdmin, getQueue);
 *   router.post('/admin/hitl/:id/approve', authAdmin, approveRequest);
 *   router.post('/admin/hitl/:id/reject',  authAdmin, rejectRequest);
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logModel from '../models/logModel.js';
import userModel from '../models/userModel.js';
// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
const CONFIG = {
  hitlThreshold: 2, // score >= ngưỡng này → giữ lại
};

// ──────────────────────────────────────────────────────────────────
// RISK KEYWORDS — vùng xám, chưa chắc độc hại
// (Layer 1 đã chặn các pattern rõ ràng rồi)
// ──────────────────────────────────────────────────────────────────
const RISK_KEYWORDS = [
  { word: 'password',   score: 2, reason: 'Hỏi về password' },
  { word: 'token',      score: 1, reason: 'Đề cập token' },
  { word: 'api',        score: 1, reason: 'Đề cập API' },
  { word: 'admin',      score: 2, reason: 'Đề cập admin' },
  { word: 'secret',     score: 2, reason: 'Đề cập secret' },
  { word: 'credential', score: 2, reason: 'Đề cập credential' },
  { word: 'hack',       score: 3, reason: 'Đề cập hack' },
  { word: 'exploit',    score: 3, reason: 'Đề cập exploit' },
];

const RISK_PHRASES = [
  { phrase: 'xóa dữ liệu',        score: 3, reason: 'Yêu cầu xóa dữ liệu' },
  { phrase: 'tất cả bệnh nhân',   score: 2, reason: 'Yêu cầu dữ liệu hàng loạt' },
  { phrase: 'danh sách user',     score: 2, reason: 'Yêu cầu danh sách user' },
  { phrase: 'toàn bộ dữ liệu',   score: 3, reason: 'Yêu cầu toàn bộ dữ liệu' },
  { phrase: 'thông tin cá nhân',  score: 1, reason: 'Hỏi thông tin cá nhân người khác' },
  { phrase: 'không giới hạn',     score: 2, reason: 'Yêu cầu bỏ giới hạn' },
  { phrase: 'xem hồ sơ người',    score: 2, reason: 'Truy cập hồ sơ người khác' },
];

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────
function scoreToRisk(score) {
  if (score >= 6) return { label: 'CRITICAL', level: '4' };
  if (score >= 4) return { label: 'HIGH',     level: '3' };
  if (score >= 3) return { label: 'MEDIUM',   level: '2' };
  return              { label: 'LOW',      level: '1' };
}

function assessRisk(query) {
  const lower = query.toLowerCase();
  const reasons = [];
  let score = 0;

  for (const { word, score: s, reason } of RISK_KEYWORDS) {
    if (lower.includes(word)) { reasons.push(reason); score += s; }
  }
  for (const { phrase, score: s, reason } of RISK_PHRASES) {
    if (lower.includes(phrase)) { reasons.push(reason); score += s; }
  }

  return { score, risk: scoreToRisk(score), reasons };
}

// ──────────────────────────────────────────────────────────────────
// MIDDLEWARE — hitlCheck
// ──────────────────────────────────────────────────────────────────
export const hitlCheck = async (req, res, next) => {
  const { query, user = 'web-user', userId } = req.body;
  const userIdForLog = req.user?.id ?? req.user?._id ?? req.user?.user_id ?? userId ?? 'anonymous';
  const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  const { score, risk, reasons } = assessRisk(query);

  console.info(`[Layer4] user_id=${userIdForLog} risk=${risk.label} score=${score}`);

  // Dưới ngưỡng → bình thường
  if (score < CONFIG.hitlThreshold) return next();

  // Lấy conversationId từ DB user
  let conversation_id = '';
  if (userId) {
    try {
      const dbUser = await userModel.findById(userId).select('conversationId');
      if (dbUser && dbUser.conversationId) {
        conversation_id = dbUser.conversationId;
      }
    } catch (e) {
      console.error('[Layer4] Lỗi lấy conversationId:', e.message);
    }
  }

  // Vượt ngưỡng → lưu vào logs, trả 202
  console.warn(`[Layer4] QUEUED | user_id=${userIdForLog} | ${reasons.join(' | ')}`);

  try {
    await logModel.create({
      unique_id:      uuidv4(),
      created_at:     new Date(),
      user_id:        userIdForLog,
      source,
      data:           query,
      msg:            reasons.join(' | '),
      rule_id:        'LAYER4_HITL',
      severity:       risk.level,
      severity_label: risk.label,
      // Field mở rộng cho HITL
      status:         'pending',
      conversation_id,
      dify_user:      user,
    });
  } catch (err) {
    console.error('[Layer4] Lỗi lưu log:', err.message);
  }

  // Update isActiveChat to 1 for the user if applicable
  if (userId) {
    try {
      await userModel.findByIdAndUpdate(userId, { isActiveChat: 1 });
    } catch (e) {
      console.error('[Layer4] Lỗi cập nhật isActiveChat:', e.message);
    }
  }

  return res.status(202).json({
    success: false,
    message: 'Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ phản hồi sớm nhất có thể.',
  });
};

// ──────────────────────────────────────────────────────────────────
// ADMIN — getQueue
// GET /admin/hitl/queue?status=pending&page=1&limit=20
// ──────────────────────────────────────────────────────────────────
export const getQueue = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const filter = { rule_id: 'LAYER4_HITL' };
    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      logModel.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit))
        .select('-dify_response'), // ẩn response khi list
      logModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page:       Number(page),
          limit:      Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────────
// ADMIN — approveRequest
// POST /admin/hitl/:id/approve
// Body: { note: "lý do" }
// → Tự gọi lại Dify, lưu kết quả vào log
// ──────────────────────────────────────────────────────────────────
export const approveRequest = async (req, res) => {
  try {
    const { unique_id, note = '' } = req.body;

    const item = await logModel.findOne({ unique_id, rule_id: 'LAYER4_HITL' });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy request.' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request đã ${item.status}.` });
    }

    const adminId = req.user?.id ?? req.user?._id ?? 'admin';

    // Lấy conversationId từ DB user (nếu user_id là userId hợp lệ)
    let conversationId = item.conversation_id || '';
    if (!conversationId && item.user_id) {
      try {
        const dbUser = await userModel.findById(item.user_id).select('conversationId');
        if (dbUser && dbUser.conversationId) {
          conversationId = dbUser.conversationId;
        }
      } catch (e) {
        console.error('[Layer4] Lỗi lấy conversationId từ user:', e.message);
      }
    }

    let difyResponse = null;
    try {
      const requestData = {
        inputs:        {},
        query:         item.data,
        response_mode: 'blocking',
        user:          item.user_id || item.dify_user,
      };
      if (conversationId) requestData.conversation_id = conversationId;

      const response = await axios.post(
        'https://api.dify.ai/v1/chat-messages',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${process.env.DIFY_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      difyResponse = response.data;

      // Lưu conversationId mới vào DB user nếu là conversation mới
      const newConversationId = difyResponse?.conversation_id;
      if (newConversationId && item.user_id && newConversationId !== conversationId) {
        await userModel.findByIdAndUpdate(item.user_id, { conversationId: newConversationId });
      }
    } catch (err) {
      console.error('[Layer4] Lỗi gọi Dify khi approve:', err.message);
    }

    await logModel.updateOne(
      { unique_id },
      {
        status:        'approved',
        reviewed_by:   adminId,
        reviewed_at:   new Date(),
        review_note:   note,
        dify_response: difyResponse,
      }
    );

    // Update isActiveChat to 0
    if (item.user_id) {
      try {
        await userModel.findByIdAndUpdate(item.user_id, { isActiveChat: 0 });
      } catch (e) {
        console.error('[Layer4] Lỗi cập nhật isActiveChat khi approve:', e.message);
      }
    }

    return res.json({ success: true, message: 'Đã approve.', data: difyResponse });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { unique_id, note = '' } = req.body;

    const item = await logModel.findOne({ unique_id, rule_id: 'LAYER4_HITL' });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy request.' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request đã ${item.status}.` });
    }

    const adminId = req.user?.id ?? req.user?._id ?? 'admin';

    await logModel.updateOne(
      { unique_id },
      {
        status:      'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date(),
        review_note: note,
      }
    );

    // Update isActiveChat to 2
    if (item.user_id) {
      try {
        await userModel.findByIdAndUpdate(item.user_id, { isActiveChat: 2 });
      } catch (e) {
        console.error('[Layer4] Lỗi cập nhật isActiveChat khi reject:', e.message);
      }
    }

    return res.json({ success: true, message: 'Đã reject.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};