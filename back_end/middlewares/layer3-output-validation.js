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
 *   router.post('/chat', authUser, inputValidation, hitlCheck, sendChatMessage, outputValidation);
 *
 * Middleware này (chỉ kiểm tra OUTPUT, không check intent):
 *   ✅ Quét rò rỉ system prompt / API key / token (LEAK_PATTERNS)
 *   ✅ Heuristic checks (Base64 decode, mixed scripts, obfuscation)
 *   ✅ Lưu log MongoDB nếu vi phạm
 *   ✅ Nếu an toàn → trả về client
 *
 * Lưu ý: Intent = 'prompt_injection' đã được chặn ở các layer trước.
 * Layer 3 chỉ scan output content thuần túy.
 */

import { v4 as uuidv4 } from 'uuid';
import logModel from '../models/logModel.js';
import { PassThrough } from 'stream';
import userModel from '../models/userModel.js';
import axios from 'axios';
import { getClientIP } from '../utils/getClientIP.js';

// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
const CONFIG = {
  maxOutputLength: 5_000,
  enableLeakDetection: true,
  enableHeuristics: true,
  enableBase64Check: true,
  enableMixedScriptCheck: true,
  maxSpecialCharRatio: 0.3,   // tỷ lệ ký tự đặc biệt tối đa (30%)
  minLengthForRatioCheck: 200, // chỉ check ratio khi text >= 200 ký tự
};

// ──────────────────────────────────────────────────────────────────
// LEAK PATTERNS — dấu hiệu output bị nhiễm
// ──────────────────────────────────────────────────────────────────
const LEAK_PATTERNS = [
  // ── System prompt lộ ra ──────────────────────────────────────────
  /quy\s+tắc\s+bắt\s+buộc/i,
  /instructions?\s*:\s*\d+\./i,
  /system\s+instructions?\s*:/i,
  /dấu\s+hiệu\s+prompt\s+injection/i,
  /vai\s+trò\s*[&:]/i,

  // ── A. Credential & Authentication ───────────────────────────────
  /(?:Authorization|auth)[\s:]*Bearer\s+[a-zA-Z0-9\-_\.]{10,}/i,
  /(?:x-api-key|api[_\-]?key)[\s:]*['"]?[a-zA-Z0-9\-_]{10,}['"]?/i,
  /Basic\s+[a-zA-Z0-9+/]{20,}={0,2}/i,
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i,
  /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/i,
  /(mongodb|mysql|postgres|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/i,
  /AKIA[0-9A-Z]{16}/,
  /(google|azure|heroku|stripe)[_\-]?key\s*[:=]\s*\S{8,}/i,
  /bearer\s+[a-zA-Z0-9\-_\.]{20,}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /password\s*[:=]\s*\S{4,}/i,
  /secret\s*[:=]\s*\S{8,}/i,
  /token\s*[:=]\s*[a-zA-Z0-9\-_\.]{20,}/i,

  // ── B. Prompt Injection / Role Override ──────────────────────────
  /\bDAN\s+mode\b/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /developer\s+mode\s+(enabled|activated)/i,
  /ignore\s+(all\s+)?(previous|prior)/i,
  /override\s+(your\s+)?(rules?|instructions?)/i,
  /forget\s+[\s\S]*you\s+are\s+(now\s+)?/i,
  /\[INST\][\s\S]+?\[\/INST\]/i,
  /```system[\s\S]+?```/i,
  /<<[a-z_]+>>:[\s\S]+?<<\/[a-z_]+>>/is,
  /<(?:system|role)>\s*[^<]+/i,
  /"role"\s*:\s*"(?:system|admin)"/i,
  /i\s+am\s+now\s+dan/i,
  /as\s+dan[,\s]/i,
  /do\s+anything\s+now\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b/i,

  // ── C. System Prompt Leak ─────────────────────────────────────────
  /(?:here'?s?\s+)?(?:your\s+)?(?:system\s+)?(?:instruct)?prompt/i,
  /(?:show|print|reveal|dump)(?:ing)?\s+(?:me\s+)?(?:your\s+)?prompt/i,
  /bạn\s+(là|đóng\s+vai)/i,
  /vai\s+trò\s*(của\s+)?(bạn|tôi|AI)/i,
  /(quy\s+tắc|luật|rules?)\s*:?\s*\d+/i,
  /###\s*(instruction|system|prompt)/i,
  /(tài\s*khoản|username|mật\s*khẩu|password).*admin/i,
  /admin\s*[\/\-:]\s*(admin|12345|password|admin123)/i,

  // ── D. Encoding / Obfuscation ────────────────────────────────────
  /(?:0x)?[0-9a-fA-F]{40,}/,

  // ── F. Dify / Internal Reference ─────────────────────────────────
  /convers?ation[_\s]?id\s*[:=]\s*[a-f0-9-]{20,}/i,
  /dify[_\-]?(app|dataset)[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i,
  /dify\s+(error|exception)\s*:\s*\w+/i,
  /(?:api\.dify|v1\/chat)\/[^/\s]+/i,
  /dataset[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i,
];

// ──────────────────────────────────────────────────────────────────
// HEURISTIC CHECKS — phát hiện obfuscation & encoding
// ──────────────────────────────────────────────────────────────────
function heuristicCheck(text) {
  const reasons = [];
  let score = 0;

  // 1. Script tag
  if (/<script[\s\S]+?<\/script>/gi.test(text)) {
    reasons.push('Script tag phát hiện');
    score += 3;
  }

  // 2. Data URI (base64 embedded in data URL)
  if (/data:[^;]+;base64,[A-Za-z0-9+/]{50,}/gi.test(text)) {
    reasons.push('Data URI base64 phát hiện');
    score += 3;
  }

  // 3. Long consecutive special chars
  if (/(?:[^\w\sÀ-ỳ])\{20,\}/.test(text)) {
    reasons.push('Dãy ký tự đặc biệt dài bất thường');
    score += 2;
  }

  // 4. URL-encoded payload
  if (/%[0-9a-fA-F]{2}{5,}/.test(text)) {
    reasons.push('URL-encoded payload phát hiện');
    score += 3;
  }

  // 5. Unicode escape sequence
  if (/\\u[0-9a-fA-F]{4}{3,}/.test(text)) {
    reasons.push('Unicode escape sequence phát hiện');
    score += 3;
  }

  // 6. Mixed scripts (Latin + Cyrillic)
  if (/[Ѐ-ӿа-я]/.test(text) && /[a-zA-Z]/.test(text)) {
    reasons.push('Mixed Latin/Cyrillic script');
    score += 2;
  }

  // 7. Mixed scripts (Latin + CJK)
  if (/[一-鿿぀-ゟ゠-ヿ]/.test(text) && /[a-zA-Z]/.test(text)) {
    reasons.push('Mixed Latin/CJK script');
    score += 2;
  }

  // 8. Base64 decode check — decode and scan keywords
  if (CONFIG.enableBase64Check) {
    const b64 = text.match(/[A-Za-z0-9+/]{32,}={0,2}/g) || [];
    for (const candidate of b64) {
      try {
        const decoded = Buffer.from(candidate, 'base64').toString('utf8');
        const lower = decoded.toLowerCase();
        const keywords = ['ignore', 'bypass', 'system', 'instructions', 'override', 'password', 'secret', 'token', 'api', 'admin', 'credential'];
        if (keywords.some(k => lower.includes(k))) {
          reasons.push(`Base64 chứa từ khóa nguy hiểm: "${decoded.slice(0, 50)}"`);
          score += 3;
          break;
        }
      } catch (_) {}
    }
  }

  // 9. Excessive special character ratio
  if (CONFIG.enableMixedScriptCheck && text.length >= CONFIG.minLengthForRatioCheck) {
    const specialCount = (text.match(/[^\w\sÀ-ỳ]/g) || []).length;
    const ratio = specialCount / text.length;
    if (ratio > CONFIG.maxSpecialCharRatio) {
      reasons.push(`Tỷ lệ ký tự đặc biệt cao (${Math.round(ratio * 100)}% > ${CONFIG.maxSpecialCharRatio * 100}%)`);
      score += 2;
    }
  }

  return { score, reasons };
}

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

  // Normalize Unicode để phát hiện homoglyph attacks (NFKC)
  const normalized = text.normalize('NFKC');

  if (text.length > CONFIG.maxOutputLength) {
    reasons.push(`Output vượt ${CONFIG.maxOutputLength} ký tự (${text.length})`);
    score += 1;
  }

  if (CONFIG.enableLeakDetection) {
    // Scan trên text gốc (giữ nguyên encoding để phát hiện obfuscation)
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(text)) {
        reasons.push(`Rò rỉ: /${pattern.source.slice(0, 55)}/`);
        score += 3;
      }
    }
  }

  if (CONFIG.enableHeuristics) {
    const { score: hScore, reasons: hReasons } = heuristicCheck(normalized);
    score += hScore;
    reasons.push(...hReasons);
  }

  return { isViolation: score >= 2, risk: scoreToRisk(score), score, reasons };
}

async function saveLog({ userId, clientInfo, data, msg, ruleId, risk }) {
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
      source:         clientInfo?.ip ?? 'unknown',
      isProxied:      clientInfo?.isProxied ?? false,
      ipSpoofed:      clientInfo?.spoofed ?? false,
      remoteAddr:     clientInfo?.remoteAddress ?? null,
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
  const clientInfo = getClientIP(req);
  const source = clientInfo.ip;

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

              const answerChunk = data.answer || data.data?.text || '';
              accumulatedAnswer += answerChunk;
            } catch (e) {
              // Bỏ qua lỗi parse dở dang
            }
          }
        }

        // 2. Quét leak
        const { isViolation, risk, reasons } = analyzeOutput(accumulatedAnswer);
        if (isViolation) {
          console.warn(`[Layer3] BLOCKED output | user_id=${userId} | ${reasons.join(' | ')}`);
          await saveLog({
            userId,
            clientInfo,
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

  // --- Hỗ trợ Blocking ---
  const answer = difyData?.answer ?? '';
  console.info(`[Layer3] user_id=${userId} answer_length=${answer.length}`);

  // ① Quét output leak
  const { isViolation, risk, reasons } = analyzeOutput(answer);
  if (isViolation) {
    console.warn(`[Layer3] BLOCKED output | user_id=${userId} | ${reasons.join(' | ')}`);
    saveLog({
      userId,
      clientInfo,
      data:   answer.slice(0, 500),
      msg:    reasons.join(' | '),
      ruleId: 'LAYER3_OUTPUT_LEAK',
      risk,
    });
    await deleteConversation(res.locals.conversationId, userId);
    return res.status(400).json({ success: false, message: 'Không thể cung cấp thông tin này.' });
  }

  // ② An toàn → trả về client
  return res.json({ success: true, data: difyData });
};