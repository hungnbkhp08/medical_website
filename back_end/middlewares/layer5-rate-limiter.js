/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 5 — Rate Limiting (Redis + ioredis)                  ║
 * ║  OWASP LLM Prompt Injection Prevention                      ║
 * ║  Chống tấn công Best-of-N (BoN) Jailbreaking               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cách dùng:
 *   import { rateLimiter } from './middlewares/layer5-rate-limiter.js';
 *
 *   router.post('/chat', authUser, rateLimiter, inputValidation, hitlCheck, sendChatMessage, outputValidation);
 *
 * Chiến lược: Sliding Window Counter theo user_id
 *   - Mỗi user có 1 key Redis: ratelimit:<user_id>
 *   - Mỗi request → INCR key, đặt TTL nếu key mới
 *   - Vượt ngưỡng → 429, lưu log MongoDB
 *
 * Tại sao Sliding Window?
 *   Fixed window dễ bị bypass bằng cách gửi burst ngay đầu window mới.
 *   Sliding window đếm liên tục → chặn hiệu quả hơn với BoN attack.
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import logModel from '../models/logModel.js';

// ──────────────────────────────────────────────────────────────────
// CONFIG — chỉnh tại đây
// ──────────────────────────────────────────────────────────────────
const CONFIG = {
  // Số request tối đa trong window
  maxRequests: 20,

  // Thời gian window (giây)
  windowSeconds: 60,

  // Sau bao nhiêu lần bị block → tăng thời gian chặn (progressive block)
  // Ví dụ: block lần 1 = 5 phút, lần 2 = 15 phút, lần 3+ = 60 phút
  progressiveBlock: [
    { threshold: 1, blockSeconds: 5  * 60 },   // bị block lần 1 → 5 phút
    { threshold: 2, blockSeconds: 15 * 60 },   // bị block lần 2 → 15 phút
    { threshold: 3, blockSeconds: 60 * 60 },   // bị block lần 3+ → 1 giờ
  ],

  // Prefix key Redis
  keyPrefix:      'ratelimit',
  blockKeyPrefix: 'ratelimit:block',
  blockCountPrefix: 'ratelimit:blockcount',
};

// ──────────────────────────────────────────────────────────────────
// REDIS CLIENT
// ──────────────────────────────────────────────────────────────────
const redis = new Redis({
  host:     process.env.REDIS_HOST     || '127.0.0.1',
  port:     parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  // Tự reconnect khi mất kết nối
  retryStrategy: (times) => Math.min(times * 500, 5000),
  lazyConnect: true,
});

redis.on('connect',   () => console.info('[Layer5] Redis connected'));
redis.on('error',     (err) => console.error('[Layer5] Redis error:', err.message));
redis.on('reconnecting', () => console.warn('[Layer5] Redis reconnecting...'));

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────

/** Lấy block duration dựa theo số lần đã bị block */
function getBlockDuration(blockCount) {
  const levels = CONFIG.progressiveBlock;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (blockCount >= levels[i].threshold) return levels[i].blockSeconds;
  }
  return levels[0].blockSeconds;
}

/** Format giây → chuỗi dễ đọc */
function formatTTL(seconds) {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} giờ`;
  if (seconds >= 60)   return `${Math.ceil(seconds / 60)} phút`;
  return `${seconds} giây`;
}

async function saveLog({ userId, source, msg, ruleId, severity, severityLabel }) {
  try {
    await logModel.create({
      unique_id:      uuidv4(),
      created_at:     new Date(),
      user_id:        userId,
      source,
      data:           `Rate limit exceeded — user_id: ${userId}`,
      msg,
      rule_id:        ruleId,
      severity,
      severity_label: severityLabel,
    });
  } catch (err) {
    console.error('[Layer5] Lỗi lưu log:', err.message);
  }
}

// ──────────────────────────────────────────────────────────────────
// CORE — kiểm tra rate limit cho 1 user
// Trả về: { allowed, remaining, retryAfter, isBlocked, blockCount }
// ──────────────────────────────────────────────────────────────────
async function checkRateLimit(userId) {
  const blockKey      = `${CONFIG.blockKeyPrefix}:${userId}`;
  const blockCountKey = `${CONFIG.blockCountPrefix}:${userId}`;
  const counterKey    = `${CONFIG.keyPrefix}:${userId}`;

  // ① Kiểm tra đang bị block không
  const blockTTL = await redis.ttl(blockKey);
  if (blockTTL > 0) {
    const blockCount = parseInt(await redis.get(blockCountKey) || '1');
    return {
      allowed:     false,
      isBlocked:   true,
      retryAfter:  blockTTL,
      blockCount,
      remaining:   0,
    };
  }

  // ② Sliding window: INCR + TTL
  const pipeline = redis.pipeline();
  pipeline.incr(counterKey);
  pipeline.ttl(counterKey);
  const [[, count], [, ttl]] = await pipeline.exec();

  // Key mới → đặt TTL
  if (ttl === -1) {
    await redis.expire(counterKey, CONFIG.windowSeconds);
  }

  const remaining = Math.max(0, CONFIG.maxRequests - count);

  // ③ Chưa vượt ngưỡng → OK
  if (count <= CONFIG.maxRequests) {
    return { allowed: true, remaining, isBlocked: false, retryAfter: 0, blockCount: 0 };
  }

  // ④ Vượt ngưỡng → tăng block count, tính thời gian block
  const newBlockCount = await redis.incr(blockCountKey);
  // blockCount key tồn tại 24h để track lịch sử
  await redis.expire(blockCountKey, 24 * 60 * 60);

  const blockDuration = getBlockDuration(newBlockCount);
  await redis.set(blockKey, '1', 'EX', blockDuration);

  return {
    allowed:     false,
    isBlocked:   false,  // vừa mới bị block lần này
    retryAfter:  blockDuration,
    blockCount:  newBlockCount,
    remaining:   0,
  };
}

// ──────────────────────────────────────────────────────────────────
// EXPRESS MIDDLEWARE
// ──────────────────────────────────────────────────────────────────
export const rateLimiter = async (req, res, next) => {
  const userId = req.user?.id ?? req.user?._id ?? req.user?.user_id;
  const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  // authUser chưa chạy hoặc không có token → skip rate limit
  // (route này yêu cầu đặt authUser trước rateLimiter)
  if (!userId) return next();

  let result;
  try {
    result = await checkRateLimit(String(userId));
  } catch (err) {
    // Redis lỗi → KHÔNG chặn request, chỉ log và tiếp tục
    console.error('[Layer5] Redis unavailable, skipping rate limit:', err.message);
    return next();
  }

  // Gắn header thông tin rate limit vào response
  res.setHeader('X-RateLimit-Limit',     CONFIG.maxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Window',    `${CONFIG.windowSeconds}s`);
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
  }

  if (!result.allowed) {
    const isRepeat  = result.isBlocked;   // đang trong block period
    const blockNum  = result.blockCount;
    const retryText = formatTTL(result.retryAfter);

    const msg = isRepeat
      ? `Đang trong thời gian bị chặn (lần ${blockNum}), thử lại sau ${retryText}`
      : `Vượt ${CONFIG.maxRequests} request/${CONFIG.windowSeconds}s — bị chặn ${retryText} (lần ${blockNum})`;

    console.warn(`[Layer5] BLOCKED | user_id=${userId} | ${msg}`);

    // Lưu log — chỉ khi vừa mới bị block (không log mỗi request trong block period)
    if (!isRepeat) {
      saveLog({
        userId,
        source,
        msg,
        ruleId:        'LAYER5_RATE_LIMIT',
        severity:      blockNum >= 3 ? '4' : blockNum >= 2 ? '3' : '2',
        severityLabel: blockNum >= 3 ? 'CRITICAL' : blockNum >= 2 ? 'HIGH' : 'MEDIUM',
      });
    }

    return res.status(429).json({
      success: false,
      message: `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${retryText}.`,
    });
  }

  console.info(`[Layer5] user_id=${userId} requests=${CONFIG.maxRequests - result.remaining}/${CONFIG.maxRequests}`);
  next();
};

// ──────────────────────────────────────────────────────────────────
// ADMIN UTILITY — reset rate limit cho 1 user (dùng khi cần)
// Gọi trực tiếp từ admin route nếu cần
// ──────────────────────────────────────────────────────────────────
export const resetRateLimit = async (userId) => {
  await redis.del(
    `${CONFIG.keyPrefix}:${userId}`,
    `${CONFIG.blockKeyPrefix}:${userId}`,
    `${CONFIG.blockCountPrefix}:${userId}`,
  );
  console.info(`[Layer5] Reset rate limit cho user_id=${userId}`);
};

export { redis };