/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 3 — Output Validation Middleware                     ║
 * ║  OWASP LLM Prompt Injection Prevention                      ║
 * ║  Stack: Express.js + Dify API                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cách dùng:
 *   import { outputValidation } from './middlewares/layer3-output-validation.js';
 *
 *   router.post('/chat', authUser, inputValidation, sendChatMessage, outputValidation);
 *
 * Middleware này:
 *   ✅ Đọc res.locals.difyAnswer (do sendChatMessage ghi vào)
 *   ✅ Kiểm tra intent = prompt_injection từ Dify (Layer 2)
 *   ✅ Quét rò rỉ system prompt / API key / token
 *   ✅ Lưu log MongoDB nếu vi phạm
 *   ✅ Nếu an toàn → res.json trả về client
 */

import { v4 as uuidv4 } from 'uuid';
import logModel from '../models/logModel.js';
import { PassThrough } from 'stream';
import userModel from '../models/userModel.js';
import axios from 'axios';

// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
const CONFIG = {
  maxOutputLength: 5_000,
  enableLeakDetection: true,
  enableIntentCheck: true,
};

// ──────────────────────────────────────────────────────────────────
// LEAK PATTERNS — dấu hiệu output bị nhiễm
// ──────────────────────────────────────────────────────────────────
const LEAK_PATTERNS = [
  // System prompt lộ ra
  /quy\s+tắc\s+bắt\s+buộc/i,
  /instructions?\s*:\s*\d+\./i,
  /system\s+instructions?\s*:/i,
  /dấu\s+hiệu\s+prompt\s+injection/i,
  /vai\s+trò\s*[&:]/i,

  // API key / token / password
  /bearer\s+[a-zA-Z0-9\-_\.]{20,}/i,
  /api[_\-\s]?key\s*[:=]\s*\S{10,}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /password\s*[:=]\s*\S{4,}/i,
  /secret\s*[:=]\s*\S{8,}/i,
  /token\s*[:=]\s*[a-zA-Z0-9\-_\.]{20,}/i,

  // LLM bị thao túng
  /developer\s+mode\s+(enabled|activated)/i,
  /i\s+am\s+now\s+dan/i,
  /as\s+dan[,\s]/i,
];

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────
function scoreToRisk(score) {
  if (score >= 6) return { label: 'CRITICAL', level: '4' };
  if (score >= 4) return { label: 'HIGH',     level: '3' };
  if (score >= 2) return { label: 'MEDIUM',   level: '2' };
  return              { label: 'LOW',      level: '1' };
}

function analyzeOutput(text) {
  const reasons = [];
  let score = 0;

  if (text.length > CONFIG.maxOutputLength) {
    reasons.push(`Output vượt ${CONFIG.maxOutputLength} ký tự (${text.length})`);
    score += 1;
  }

  if (CONFIG.enableLeakDetection) {
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(text)) {
        reasons.push(`Rò rỉ: /${pattern.source.slice(0, 55)}/`);
        score += 3;
      }
    }
  }

  return { isViolation: score >= 2, risk: scoreToRisk(score), score, reasons };
}

function checkDifyIntent(answer) {
  if (!CONFIG.enableIntentCheck) return null;
  try {
    const parsed = JSON.parse(answer);
    if (parsed?.intent === 'prompt_injection') {
      return {
        isViolation: true,
        risk: { label: 'HIGH', level: '3' },
        reasons: ['Dify phát hiện intent = prompt_injection'],
      };
    }
    return { isViolation: false };
  } catch (_) {
    return null; // không phải JSON → bỏ qua
  }
}

async function saveLog({ userId, source, data, msg, ruleId, risk }) {
  try {
    await logModel.create({
      unique_id:      uuidv4(),
      created_at:     new Date(),
      user_id:        userId,
      data,
      msg,
      rule_id:        ruleId,
      severity:       risk.level,
      severity_label: risk.label,
      source,
    });
  } catch (err) {
    console.error('[Layer3] Lỗi lưu log:', err.message);
  }
}

async function deleteConversation(conversationId, userId) {
  if (!conversationId || !userId) return;
  try {
    const response = await axios.delete(
      `https://api.dify.ai/v1/conversations/${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          user: userId.toString()
        }
      }
    );
    console.info(`[Layer3] Deleted conversation ${conversationId}:`, response.data.result);
    await userModel.findByIdAndUpdate(userId, { conversationId: '' });
  } catch (err) {
    console.error(`[Layer3] Lỗi xóa conversation ${conversationId}:`, err?.response?.data || err.message);
  }
}

// ──────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────────────────────────
export const outputValidation = async (req, res) => {
  const difyStream = res.locals.difyStream;
  const difyData   = res.locals.difyData;
  const userId     = res.locals.userId || req.body.userId;
  const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  // --- Hỗ trợ Streaming ---
  if (difyStream) {
    let conversationId = res.locals.conversationId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let accumulatedAnswer = '';
    let isStreamClosed = false;
    let buffer = '';

    difyStream.on('data', async (chunk) => {
      if (isStreamClosed) return;

      try {
        const str = chunk.toString();
        buffer += str;
        
        let lines = buffer.split('\n');
        // Giữ lại phần tử cuối cùng (có thể là dòng chưa hoàn chỉnh)
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataPayload = trimmed.slice(6).trim();
            if (!dataPayload) continue;

            try {
              const data = JSON.parse(dataPayload);
              
              // 1. Lưu conversationId vào DB nếu là conversation mới
              if (data.conversation_id && data.conversation_id !== conversationId) {
                conversationId = data.conversation_id;
                if (userId) {
                  await userModel.findByIdAndUpdate(userId, { conversationId });
                }
              }
              
              // Kiểm tra intent từ Dify
              if (data.intent === 'prompt_injection') {
                console.warn(`[Layer3] BLOCKED intent | user_id=${userId}`);
                await saveLog({
                  userId,
                  source,
                  data: req.body.query,
                  msg: 'Dify phát hiện intent = prompt_injection',
                  ruleId: 'LAYER3_INTENT_INJECTION',
                  risk: { label: 'HIGH', level: '3' },
                });
                await deleteConversation(conversationId, userId);
                res.write(`data: ${JSON.stringify({ event: 'error', status: 400, code: 'prompt_injection', message: 'Yêu cầu không hợp lệ.' })}\n\n`);
                isStreamClosed = true;
                difyStream.destroy();
                res.end();
                return;
              }

              const answerChunk = data.answer || data.data?.text || '';
              accumulatedAnswer += answerChunk;
            } catch (e) {
              // Bỏ qua lỗi parse dở dang
            }
          }
        }

        // 3. Quét leak
        const { isViolation, risk, reasons } = analyzeOutput(accumulatedAnswer);
        if (isViolation) {
          console.warn(`[Layer3] BLOCKED output | user_id=${userId} | ${reasons.join(' | ')}`);
          await saveLog({
            userId,
            source,
            data: accumulatedAnswer.slice(0, 500),
            msg: reasons.join(' | '),
            ruleId: 'LAYER3_OUTPUT_LEAK',
            risk,
          });
          await deleteConversation(conversationId, userId);
          res.write(`data: ${JSON.stringify({ event: 'error', status: 400, code: 'output_leak', message: 'Không thể cung cấp thông tin này.' })}\n\n`);
          isStreamClosed = true;
          difyStream.destroy();
          res.end();
          return;
        }

        // Nếu không có vi phạm ở chunk này, trả về cho client
        res.write(chunk);
      } catch (err) {
        console.error("Error in streaming outputValidation:", err);
      }
    });

    difyStream.on('end', () => {
      if (!isStreamClosed) {
        res.end();
      }
    });

    difyStream.on('error', (err) => {
      if (!isStreamClosed) {
        console.error("Dify stream error:", err.message);
        res.end();
      }
    });

    return;
  }

  // --- Hỗ trợ Blocking (Giữ nguyên gốc) ---
  const answer = difyData?.answer ?? '';
  console.info(`[Layer3] user_id=${userId} answer_length=${answer.length}`);

  // ① Kiểm tra intent từ Dify
  const intentCheck = checkDifyIntent(answer);
  if (intentCheck?.isViolation) {
    console.warn(`[Layer3] BLOCKED intent | user_id=${userId}`);
    saveLog({
      userId,
      source,
      data:   req.body.query,
      msg:    intentCheck.reasons.join(' | '),
      ruleId: 'LAYER3_INTENT_INJECTION',
      risk:   intentCheck.risk,
    });
    await deleteConversation(res.locals.conversationId, userId);
    return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ.' });
  }

  // ② Quét output leak
  const { isViolation, risk, reasons } = analyzeOutput(answer);
  if (isViolation) {
    console.warn(`[Layer3] BLOCKED output | user_id=${userId} | ${reasons.join(' | ')}`);
    saveLog({
      userId,
      source,
      data:   answer.slice(0, 500),
      msg:    reasons.join(' | '),
      ruleId: 'LAYER3_OUTPUT_LEAK',
      risk,
    });
    await deleteConversation(res.locals.conversationId, userId);
    return res.status(400).json({ success: false, message: 'Không thể cung cấp thông tin này.' });
  }

  // ③ An toàn → trả về client
  return res.json({ success: true, data: difyData });
};