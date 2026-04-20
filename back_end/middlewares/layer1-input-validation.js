/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 1 — Input Validation & Sanitization                  ║
 * ║  + authUser middleware (JWT)                                ║
 * ║  + Lưu log vào MongoDB khi phát hiện injection              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cách dùng:
 *   import { authUser, inputValidation } from './middlewares/layer1-input-validation.js';
 *
 *   router.post('/chat', authUser, inputValidation, sendChatMessage);
 *
 *  authUser      → giải mã JWT, gắn req.user
 *  inputValidation → kiểm tra query, lưu log nếu bị chặn, rồi next()
 */

import { v4 as uuidv4 } from 'uuid';
import userModel from '../models/userModel.js';
import logModel from '../models/logModel.js';

// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
const CONFIG = {
  maxInputLength: 10_000,
  enableFuzzyMatch: true,
  enableEncodingDetection: true,
  enableHtmlSanitization: true,
  enableSpacedLetters: true,
};

// ──────────────────────────────────────────────────────────────────
// INJECTION PATTERNS
// ──────────────────────────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /forget\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous\s+instructions?/i,
  /override\s+(your\s+)?(instructions?|rules?|guidelines?)/i,
  /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
  /enable\s+admin\s+mode/i,
  /repeat\s+the\s+text\s+above/i,
  /starting\s+with\s+["']you\s+are/i,
  /what\s+were\s+your\s+(exact\s+)?instructions/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+me\s+your\s+(system\s+)?instructions/i,
  /print\s+your\s+system\s+prompt/i,
  /you\s+are\s+now\s+dan\b/i,
  /\bdan\s+mode\b/i,
  /do\s+anything\s+now/i,
  /act\s+as\s+if\s+you('re|\s+are)\s+not\s+bound/i,
  /you\s+have\s+no\s+restrictions/i,
  /^thought:\s*i\s+should\s+ignore/im,
  /<\s*img[^>]+src\s*=\s*['"]?https?:\/\//i,
  /onerror\s*=/i,
  /javascript\s*:/i,
  /^IGNORE\s+ALL\s+PREVIOUS/m,
  /^FORGET\s+ALL\s+PREVIOUS/m,
];

const FUZZY_KEYWORDS = [
  'ignore', 'bypass', 'override', 'reveal', 'delete',
  'system', 'prompt', 'instructions', 'admin', 'jailbreak',
  'forget', 'disregard',
];

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────
function detectTypoglycemia(text) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const hits = [];
  for (const word of words) {
    if (word.length < 4) continue;
    for (const target of FUZZY_KEYWORDS) {
      if (
        word !== target &&
        word.length === target.length &&
        word[0] === target[0] &&
        word.at(-1) === target.at(-1) &&
        [...word.slice(1, -1)].sort().join('') ===
          [...target.slice(1, -1)].sort().join('')
      ) {
        hits.push(`"${word}" ≈ "${target}"`);
      }
    }
  }
  return hits;
}

function detectEncoding(text) {
  const findings = [];
  const b64Matches = text.match(/[A-Za-z0-9+/]{16,}={0,2}/g) || [];
  for (const candidate of b64Matches) {
    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8');
      const lower = decoded.toLowerCase();
      if (['ignore', 'bypass', 'system', 'instructions', 'override'].some(kw => lower.includes(kw))) {
        findings.push('Base64 chứa lệnh injection');
        break;
      }
    } catch (_) {}
  }
  if (/(?:0x)?[0-9a-fA-F]{40,}/.test(text)) findings.push('Chuỗi Hex bất thường');
  if (/[\u200b-\u200f\u2028\u2029\ufeff]/.test(text)) findings.push('Ký tự Unicode vô hình');
  return findings;
}

function detectSpacedLetters(text) {
  const collapsed = text.replace(/(?<!\w)(\w) (?=(\w ))/g, '$1').replace(/ /g, '');
  return FUZZY_KEYWORDS.some(kw => collapsed.toLowerCase().includes(kw));
}

function scoreToRisk(score) {
  if (score >= 6) return { label: 'CRITICAL', level: '4' };
  if (score >= 4) return { label: 'HIGH',     level: '3' };
  if (score >= 2) return { label: 'MEDIUM',   level: '2' };
  return              { label: 'LOW',      level: '1' };
}

function sanitizeInput(text) {
  let clean = text
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/(.)\1{4,}/g, '$1')
    .trim();
  if (CONFIG.enableHtmlSanitization) {
    clean = clean.replace(/<[^>]+>/g, '');
    clean = clean.replace(/javascript:/gi, '');
  }
  return clean.slice(0, CONFIG.maxInputLength);
}

function analyzeInput(text) {
  const reasons = [];
  let score = 0;

  if (text.length > CONFIG.maxInputLength) {
    reasons.push(`Vượt giới hạn ${CONFIG.maxInputLength} ký tự`);
    score += 1;
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`Pattern: /${pattern.source.slice(0, 60)}/`);
      score += 3;
    }
  }
  if (CONFIG.enableFuzzyMatch) {
    const hits = detectTypoglycemia(text);
    if (hits.length) { reasons.push(`Typoglycemia: ${hits.join(', ')}`); score += 2; }
  }
  if (CONFIG.enableEncodingDetection) {
    const hits = detectEncoding(text);
    if (hits.length) { reasons.push(`Encoding ẩn: ${hits.join(', ')}`); score += 2; }
  }
  if (CONFIG.enableHtmlSanitization && /<[^>]+>|javascript:/i.test(text)) {
    reasons.push('HTML / JS injection'); score += 2;
  }
  if (CONFIG.enableSpacedLetters && detectSpacedLetters(text)) {
    reasons.push('Spaced-letter obfuscation'); score += 2;
  }

  const risk = scoreToRisk(score);
  return { isMalicious: score >= 2, risk, score, reasons };
}

// ──────────────────────────────────────────────────────────────────
// LƯU LOG VÀO MONGODB
// ──────────────────────────────────────────────────────────────────
async function saveLog({ userId, query, reasons, risk, source }) {
  try {
    await logModel.create({
      unique_id:      uuidv4(),
      created_at:     new Date(),
      user_id:        userId,
      data:           query,
      msg:            reasons.join(' | '),
      rule_id:        'LAYER1_PROMPT_INJECTION',
      severity:       risk.level,
      severity_label: risk.label,
      source:         source,
    });
  } catch (err) {
    // Lỗi DB không được làm crash request
    console.error('[Layer1] Lỗi lưu log:', err.message);
  }
}

// ──────────────────────────────────────────────────────────────────
// MIDDLEWARE 1 — authUser (JWT)

// ──────────────────────────────────────────────────────────────────
// MIDDLEWARE 2 — inputValidation
// Đọc req.body.query, phân tích, lưu log nếu bị chặn
// ──────────────────────────────────────────────────────────────────
export const inputValidation = async (req, res, next) => {
  const { query } = req.body;

  // Lấy user_id từ JWT payload (authUser đã gắn vào req.body.userId)
  // Nếu route không yêu cầu auth thì fallback về 'anonymous'
  const { userId } = req.body;
  let userIdForLog = 'anonymous';

  if (userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }
    userIdForLog = userId;
  }

  // Source: IP của client
  const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  // Thiếu query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Trường "query" là bắt buộc và phải là chuỗi ký tự.',
    });
  }

  const { isMalicious, risk, score, reasons } = analyzeInput(query);

  console.info(`[Layer1] user_id=${userIdForLog} ip=${source} risk=${risk.label} score=${score}`);

  if (isMalicious) {
    console.warn(`[Layer1] BLOCKED | user_id=${userIdForLog} | ${reasons.join(' | ')}`);

    // Lưu log bất đồng bộ — không await để không delay response
    saveLog({ userId: userIdForLog, query, reasons, risk, source });

    return res.status(400).json({
      success: false,
      message: 'Yêu cầu không hợp lệ.',
      // Xóa dòng debug khi lên production
      debug: { risk: risk.label, score, reasons },
    });
  }

  // An toàn → sanitize, tiếp tục
  req.body.query = sanitizeInput(query);
  next();
};