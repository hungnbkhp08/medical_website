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
import { getClientIP } from '../utils/getClientIP.js';

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
// ──────────────────────────────────────────────────────────────────
// INJECTION PATTERNS
// ──────────────────────────────────────────────────────────────────
// Được chia theo category để dễ maintain
// Score weight quy ước: prompt injection = 3, XSS = 3, code/command = 4, nosql = 3, template = 3, path = 2
// Các pattern này match trong analyzeInput → score += 3

const INJECTION_PATTERNS = [

  // ══════════════════════════════════════════════════════
  // 1. PROMPT INJECTION — jailbreak & instruction override
  // ══════════════════════════════════════════════════════
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
  /^IGNORE\s+ALL\s+PREVIOUS/m,
  /^FORGET\s+ALL\s+PREVIOUS/m,

  // DAN / jailbreak variants
  /you\s+are\s+a\s+different\s+AI/i,
  /ignore\s+(all\s+)?of\s+the\s+above/i,
  /ignore\s+(all\s+)?prior\s+(directives?|orders?|commands?)/i,
  /set\s+system\s+(prompt|instructions)\s+to/i,
  /new\s+system\s+prompt/i,
  /\bjailbreak\b/i,
  /unlock\s+developer\s+mode/i,
  /bypass\s+(your\s+)?(safety|content\s+policy|restrictions?)/i,
  /new\s+instructions?:\s*/i,
  /new\s+system\s+instruction/i,
  /forget\s+(all\s+)?your\s+rules/i,
  /you\s+can\s+(now\s+)?(do|ignore|bypass|override)/i,
  /\bGOD\s+MODE\b/i,
  /superman\s+mode/i,
  /grandma's\s+cookie\s+recipe/i,
  /preceding\s+conversation\s+(was|is)\s+in\s+(a\s+)?jailbreak/i,

  // Role-play / hypothetical framing
  /pretend\s+you\s+are\s+(not\s+)?bound/i,
  /act\s+as\s+(if\s+)?(you|ai)/i,
  /assume\s+(the\s+role\s+of|you\s+are)/i,
  /simulate\s+((a|an)\s+)?(uncensored|unrestricted)/i,
  /roleplay\s+(as\s+)?(without|lacking)\s+(restrictions?|rules)/i,
  /in\s+(a|hypothetical|imaginary)\s+scenario/i,
  /if\s+you\s+(were\s+to|could)\s+ignore/i,
  /hypothetically\s+(ignore|bypass|override)/i,
  /translate\s+the\s+(above|following)\s+(text|instructions)/i,

  // Instruction embedding
  /<\/?(system|instructions?)\s*>?/i,
  /<\?xml/i,
  /\[\s*inst(ruction)?s?\s*\](?!\s*\]=)/i,

  // Null-byte / control char injection
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/,
  /%00/,
  /\\x00/,
  /\\u0000/,

  // ══════════════════════════════════════════════════════
  // 2. XSS / HTML INJECTION
  // ══════════════════════════════════════════════════════
  /<\s*script[^>]*>/i,
  /<\/\s*script\s*>/i,
  /<\s*iframe[^>]*>/i,
  /<\s*svg[^>]*>/i,
  /<\s*body[^>]*onload/i,
  /<\s*img[^>]+src\s*=\s*['"]?https?:\/\//i,
  /<\s*img[^>]+onerror/i,
  /<\s*a[^>]+href\s*=\s*['"]?javascript:/i,
  /<\s*input[^>]+onfocus/i,
  /<\s*input[^>]+onblur/i,
  /<\s*input[^>]+onchange/i,
  /<\s*button[^>]+onclick/i,
  /<\s*embed[^>]+src/i,
  /<\s*object[^>]*>/i,
  /<\s*link[^>]+href\s*=\s*['"]?javascript:/i,
  /<\s*style[^>]*>@import/i,
  /<\s*style[^>]*>expression\s*\(/i,
  /<\s*meta[^>]+http-equiv\s*=\s*['"]?refresh/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /onblur\s*=/i,
  /onchange\s*=/i,
  /onsubmit\s*=/i,
  /onkeydown\s*=/i,
  /onkeyup\s*=/i,
  /onkeypress\s*=/i,
  /onfocus\s*=/i,
  /onresize\s*=/i,
  /ondblclick\s*=/i,
  /oncontextmenu\s*=/i,
  /javascript\s*:/i,
  /data:text\/html/i,
  /data:[^;]+;base64/i,
  /vbscript\s*:/i,
  /livescript\s*:/i,
  /<image[^>]+src/i,
  /<\s*math[^>]*>.*href/i,
  /<\s*base[^>]+href/i,

  // Encoded XSS
  /%3C(script|%2Fscript|%2F)/i,
  /&#(?:60|x3[ce]);?/i,
  /&lt;(script|iframe|svg|img)/i,
  /\\u003C/s,
  /\\x3C/,

  // ══════════════════════════════════════════════════════
  // 3. NoSQL INJECTION (MongoDB)
  // ══════════════════════════════════════════════════════
  /"\$\w+"\s*:\s*[\[\{]/,
  /\$\w+\s*:\s*["']?\$/,
  /\$\bne\b/,
  /\$\bgt\b/,
  /\$\blt\b/,
  /\$\bgte\b/,
  /\$\blte\b/,
  /\$\bor\b/,
  /\$\band\b/,
  /\$\bwhere\b/,
  /\$\bexists\b/,
  /\$\bregex\b/,
  /\$\bmod\b/,
  /\$\btype\b\s*:/,
  /\$\bin\b\s*\(/,
  /\$\bnin\b\s*\(/,
  /\$\btext\b\s*:/,
  /\$\bexpr\b/,
  /\$\bjsonSchema\b/,
  /\$\bor\s*\$\bor/,
  /\$\bexists\s*:\s*true/i,
  /\$\btype\s*:\s*["']?(string|number|array|object|bool)/i,
  /"\$geoWithin"/i,
  /"\$geoIntersects"/i,
  /"\$near"/i,
  /\$\bcomment\b/,

  // ══════════════════════════════════════════════════════
  // 4. COMMAND INJECTION
  // ══════════════════════════════════════════════════════
  /;\s*(ls|cat|id|whoami|pwd|uname|ifconfig|netstat|curl|wget|nc|bash|sh|rm|mkdir|chmod|chown|touch|echo|cd|dir)/i,
  /&&\s*(ls|cat|id|whoami|pwd|uname|ifconfig|curl|wget|nc|bash|sh|rm|mkdir)/i,
  /\|\s*(ls|cat|id|whoami|pwd|uname|curl|wget|nc|bash|sh|rm)/i,
  /\$\([^)]+\)/,
  /`[^`]+`/,
  /\$\{[^}]+\}/,
  /\$\w+\s*\(/,
  /\x60[^\x60]+\x60/,
  /\$\{IFS\}/,
  /\$HOME/,
  /\$PATH/,
  /eval\s*\(/,
  /exec\s*\(/,
  /passthru\s*\(/i,
  /shell_exec\s*\(/i,
  /system\s*\(/i,
  /\bexec\s*\(/i,
  /proc_open\s*\(/i,
  /popen\s*\(/i,
  /com\.executecommand/i,

  // ══════════════════════════════════════════════════════
  // 5. TEMPLATE / EXPRESSION INJECTION
  // ══════════════════════════════════════════════════════
  /\{\{[^}]+\}\}/,
  /\{#[^}]+#\}/,
  /<%[^%]+%>/,
  /\$\{[^}]+\}/,
  /\{\{[\s\S]*?\{\{/,
  /\{\{\s*constructor\s*\(/i,
  /\{\{.*\|\s*safe\s*\}\}/i,
  /\{\{.*\|\s*raw\s*\}\}/i,
  /\{\{.*\}\}\s*\{\{/,
  /\{\%\s*[^%]+\s*\%\}/,
  /\{\{\{[\s\S]*?\}\}\}/,
  /<%=\s*[^%]+%>/,
  /<\?=[^?]+\?>/,
  /\{\{range\s+[\s\S]*?\}\}/i,
  /\{\{with\s+[\s\S]*?\}\}/i,
  /\$ENCRYPT\$/i,
  /\$DECRYPT\$/i,
  /\{\{[\s\S]*?\}\}.*\{\{/,

  // ══════════════════════════════════════════════════════
  // 6. PATH TRAVERSAL / LFI / RFI
  // ══════════════════════════════════════════════════════
  /\.\.\\|\.\.\//,
  /\.\.\\|\.\.\//i,
  /%2e%2e%2f|%2e%2e\//i,
  /%252e%252e%252f|%252e%252e\//i,
  /\.\.%2f|%2e%2e%5c/i,
  /etc\/(passwd|shadow|hosts|issue|group)/i,
  /c:\\windows|c:\\boot/i,
  /file:\/\//i,
  /phar:\/\//i,
  /zip:\/\//i,
  /data:\/\//i,
  /expect:\/\//i,
  /ftp:\/\//i,

  // ══════════════════════════════════════════════════════
  // 7. SQL INJECTION
  // ══════════════════════════════════════════════════════
  /('\s*or\s*'?\d+['"]?\s*=\s*['"]?\d+)/i,
  /('\s*or\s*'\s*1\s*=\s*1)/i,
  /('\s*or\s*1\s*=\s*1)/i,
  /('\s*or\s*'['"\s]*\?=)/i,
  /(\bor\b\s+\d+\s*=\s*\d+)/i,
  /(\band\b\s+\d+\s*=\s*\d+)/i,
  /('\s*;\s*drop\s+table)/i,
  /('\s*;\s*delete\s+from)/i,
  /('\s*;\s*update\s+\w+\s+set)/i,
  /(\bunion\b\s+(all\s+)?select\b)/i,
  /(\bunion\b\s+(all\s+)?select\s+\d+)/i,
  /(\bselect\b\s+\*\s+from\b)/i,
  /\bexec\s*\(\s*@/i,
  /\bexecute\s*\(\s*@/i,
  /\bsp_executesql\b/i,
  /\bxp_cmdshell\b/i,
  /\bopenquery\b/i,
  /\bopendatasource\b/i,
  /load_file\s*\(/i,
  /into\s+(out|dump)file/i,
  /sleep\s*\(\s*\d+\s*\)/i,
  /\bwaitfor\s+delay\b/i,
  /\bbenchmark\s*\(/i,
  /\bconcat\s*\(/i,
  /\bchar\s*\(\s*\d+/i,
  /0x[0-9a-f]{6,}/i,
  /'\s*=\s*'/,
  /'\s*<\s*'/,
  /'\s*>\s*'/,
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
async function saveLog({ userId, query, reasons, risk, clientInfo }) {
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
      source:         clientInfo?.ip ?? 'unknown',
      isProxied:      clientInfo?.isProxied ?? false,
      ipSpoofed:      clientInfo?.spoofed ?? false,
      remoteAddr:     clientInfo?.remoteAddress ?? null,
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

  // Lấy IP client bằng helper an toàn
  const clientInfo = getClientIP(req);
  const { ip: source, isProxied, spoofed, remoteAddress } = clientInfo;

  // Thiếu query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Trường "query" là bắt buộc và phải là chuỗi ký tự.',
    });
  }

  const { isMalicious, risk, score, reasons } = analyzeInput(query);

  console.info(`[Layer1] user_id=${userIdForLog} ip=${source} source=${clientInfo.source} proxied=${isProxied} spoofed=${spoofed} risk=${risk.label} score=${score}`);

  if (isMalicious) {
    console.warn(`[Layer1] BLOCKED | user_id=${userIdForLog} | ${reasons.join(' | ')}`);

    // Lưu log bất đồng bộ — không await để không delay response
    saveLog({ userId: userIdForLog, query, reasons, risk, clientInfo });

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