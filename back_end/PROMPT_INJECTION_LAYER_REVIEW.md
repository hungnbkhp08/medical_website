# Prompt Injection Defense Layers — Security Review

**Ngày review:** 2026-06-15
**Backend stack:** Node.js + Express + Dify API + MongoDB + Redis
**Các file được review:**
- `middlewares/layer1-input-validation.js`
- `middlewares/layer3-output-validation.js`
- `middlewares/layer4-hitl.js`
- `middlewares/layer5-rate-limiter.js`
- `controllers/chatbotController.js`
- `controllers/chatbotSecController.js`
- `controllers/chatController.js`
- `routes/chatbotRoute.js`

---

## Tổng quan kiến trúc

| Layer | Tên | Chức năng |
|-------|-----|-----------|
| Layer 1 | Input Validation | JWT auth + pattern matching + sanitize + typoglycemia detection |
| Layer 2 | _(thiếu)_ | — |
| Layer 3 | Output Validation | Dify intent check + leak detection + streaming |
| Layer 4 | HITL | Human-in-the-loop cho queries nghi vấn |
| Layer 5 | Rate Limiter | Sliding window với Redis + progressive block |

Route `/chat` chính:
```js
router.post('/chat', authUser, rateLimiter, inputValidation, hitlCheck, sendChatMessage, outputValidation);
```

---

## Điểm TỐT

### ✅ Layer 1 — Input Validation
- Regex pattern đủ phong phú cho prompt injection phổ biến (ignore previous, developer mode, DAN, etc.)
- Typoglycemia detection (đảo chữ cái giữa từ)
- Base64 + Hex detection
- Invisible Unicode detection (U+200B–U+200F, etc.)
- HTML/JS sanitization (`<script>`, `javascript:`)
- Normalize NFKC trước khi phân tích
- Lưu log vào MongoDB khi block
- Risk scoring có 4 mức (LOW → CRITICAL)

### ✅ Layer 3 — Output Validation
- Streaming support tốt: tích lũy answer, kiểm tra leak sau khi stream xong
- Kiểm tra `intent === 'prompt_injection'` từ Dify
- Xóa conversation trên Dify khi phát hiện vi phạm
- Header đầy đủ cho SSE (`Content-Type`, `Cache-Control`, `Connection`)

### ✅ Layer 4 — HITL
- Admin queue với approve/reject workflow
- Khi approve → gọi lại Dify với `response_mode: 'blocking'` (an toàn hơn streaming)
- Lưu `dify_response` sau khi approve để audit
- Phân trang cho queue

### ✅ Layer 5 — Rate Limiter
- Sliding window counter (tránh burst attack tốt hơn fixed window)
- Progressive block: 5 phút → 15 phút → 1 giờ
- Redis pipeline cho atomic operations (INCR + TTL)
- Fallback graceful: Redis lỗi → skip không block request
- Header `X-RateLimit-*` + `Retry-After`
- Admin utility `resetRateLimit`

### ✅ Auth chain
- `authUser` (JWT) ghi đè `req.body.userId = decoded.id` — đảm bảo dùng user từ token, không từ client

---

## Điểm CẦN CẢI THIỆN

### 1. CRITICAL: Không có Layer 2 (Context/Session Isolation)

**Vấn đề:** Không có middleware/phương thức nào cô lập system prompt hoặc ngăn context bleeding giữa các user/conversation.

**Hậu quả:** Một user có thể ảnh hưởng đến context của user khác thông qua shared Dify conversation hoặc prompt pollution.

**Đề xuất:** Thêm Layer 2 để đảm bảo:
- Mỗi user chỉ truy cập conversation của chính mình
- System prompt không bị ghi đè từ user input
- Có thể dùng Dify dataset/app-level isolation

---

### 2. CRITICAL: `/chat-sec` không qua BẤT KỲ security layer nào

**File:** [routes/chatbotRoute.js:22](routes/chatbotRoute.js#L22)

```js
router.post('/chat-sec', rateLimiter, sendChatSecMessage); // KHÔNG có authUser, KHÔNG có inputValidation, KHÔNG có hitlCheck, KHÔNG có outputValidation
router.get('/chat-sec/messages', getChatSecMessages); // KHÔNG có auth
```

**Vấn đề:** Endpoint này không có JWT authentication, không có input validation, không có HITL, không có output validation. Bất kỳ ai cũng có thể gọi, và output từ Dify SEC được pipe thẳng ra client mà không kiểm tra.

**Đề xuất:** Thêm các layer bảo vệ tương tự `/chat`:
```js
router.post('/chat-sec', authUser, rateLimiter, inputValidation, hitlCheck, sendChatSecMessage, outputValidation);
router.get('/chat-sec/messages', authUser, getChatSecMessages);
```

---

### 3. CRITICAL: `/diagnoses` endpoint không có authentication

**File:** [routes/chatbotRoute.js:24](routes/chatbotRoute.js#L24)

```js
router.get('/diagnoses', getDiagnosesByConversationId);
```

**File:** [controllers/chatbotController.js:108](controllers/chatbotController.js#L108)

```js
const conversationId = req.query.conversationId || req.body.conversationId;
```

**Vấn đề:** Endpoint này cho phép truy cập danh sách chẩn đoán bệnh nhân dựa trên `conversationId` mà không xác thực người dùng. Bất kỳ ai đoán được conversationId đều có thể lấy thông tin y tế nhạy cảm (bypass điều 29 Luật An ninh mạng / GDPR).

**Đề xuất:** Thêm authUser + kiểm tra conversationId thuộc về user đang đăng nhập:
```js
router.get('/diagnoses', authUser, getDiagnosesByConversationId);

// Trong controller: verify conversationId belongs to authenticated user
const user = await userModel.findById(req.body.userId);
if (user.conversationId !== conversationId) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
}
```

---

### 4. HIGH: Leak patterns trong Layer 3 còn thiếu

**File:** [middlewares/layer3-output-validation.js:39-63](middlewares/layer3-output-validation.js#L39-L63)

**Vấn đề:** Danh sách `LEAK_PATTERNS` chỉ có ~15 pattern, thiếu nhiều dạng rò rỉ phổ biến.

#### 4.1. Patterns hiện tại (cần giữ)

```js
// ✅ System prompt lộ ra (giữ)
  /quy\s+tắc\s+bắt\s+buộc/i,
  /instructions?\s*:\s*\d+\./i,
  /system\s+instructions?\s*:/i,

// ✅ API key / token / password (giữ)
  /bearer\s+[a-zA-Z0-9\-_\.]{20,}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /password\s*[:=]\s*\S{4,}/i,

// ✅ LLM bị thao túng (giữ)
  /developer\s+mode\s+(enabled|activated)/i,
  /i\s+am\s+now\s+dan/i,
```

#### 4.2. Patterns THIẾU — cần thêm

**A. Credential & Authentication**

| Pattern | Regex | Điểm |
|---------|-------|------|
| Authorization header | `/(?:Authorization\|auth)[\s:]*Bearer\s+[a-zA-Z0-9\-_\.]{10,}/i` | +3 |
| API key header | `/(?:x-api-key\|api.?key)[\s:]*['"]?[a-zA-Z0-9\-_]{10,}['"]?/i` | +3 |
| Basic auth | `/Basic\s+[a-zA-Z0-9+/]{20,}={0,2}/i` | +3 |
| JWT token | `/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i` | +3 |
| Private key / SSH key | `/-----BEGIN\s+(RSA\|DSA\|EC\|OPENSSH\|PGP)\s+PRIVATE\s+KEY-----/i` | +3 |
| Connection string (DB) | `/(mongodb\|mysql\|postgres\|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/i` | +3 |
| AWS credentials | `/AKIA[0-9A-Z]{16}/` | +3 |
| Cloud API key | `/(google\|azure\|heroku\|stripe)[_\-]?key\s*[:=]\s*\S{8,}/i` | +3 |

**B. Prompt Injection / Role Override**

| Pattern | Regex | Điểm |
|---------|-------|------|
| DAN / jailbreak | `/\bDAN\s+mode\b/i` | +3 |
| Role assignment | `/you\s+are\s+now\s+(a\s+)?/i` | +3 |
| Developer mode | `/developer\s+mode/i` | +3 |
| Ignore all previous | `/ignore\s+(all\s+)?(previous\|prior)/i` | +3 |
| Override instructions | `/override\s+(your\s+)?(rules?\|instructions?)/i` | +3 |
| New identity | `/forget\s+.*\nyou\s+are\s+(now\s+)?/is` | +3 |
| Llama instruction tags | `/\[INST\][\s\S]+?\[\/INST\]/i` | +3 |
| System delimiter block | `/```system[\s\S]+?```/i` | +3 |
| Custom delimiters | `/<<[a-z_]+>>:[\s\S]+?<<\/[a-z_]+>>/is` | +3 |
| XML/JSON role tag | `/<(?:system\|role)>\s*[^<]+/i` | +2 |
| JSON role override | `/"role"\s*:\s*"(?:system\|admin)"/i` | +3 |

**C. System Prompt Leak**

| Pattern | Regex | Điểm |
|---------|-------|------|
| Explicit prompt leak request | `/(?:here'?s?\s+)?(?:your\s+)?(?:system\s+)?(?:instruct)?prompt/i` | +2 |
| Reveal prompt | `/(?:show\|print\|reveal\|dump)(?:ing)?\s+(?:me\s+)?(?:your\s+)?prompt/i` | +3 |
| Exact instruction match | `/bạn\s+(là|đóng\s Vai)/i` | +2 |
| Vietnamese system instruction | `/vai\s+trò\s*(của\s+)?(bạn|tôi|AI)/i` | +2 |
| Prompt content leak | `/nào\s+tôi\s+(sẽ|là)\s+(giúp|trả\s+lời)/i` | +1 |
| Rule extraction | /(quy\s+tắc|luật|rules?)\s*:?\s*\d+/i | +2 |
| Boundary indicator | `/###\s*(instruction|system|prompt)/i` | +2 |

**D. Encoding / Obfuscation**

| Pattern | Regex | Điểm |
|---------|-------|------|
| Base64 content (decoded check) | `[A-Za-z0-9+/]{32,}={0,2}` → decode & check keywords | +3 |
| URL-encoded | `/%[0-9a-fA-F]{2}{5,}/` | +3 |
| Hex-encoded | `/(?:0x)?[0-9a-fA-F]{40,}/` | +2 |
| Unicode escape | `/\\u[0-9a-fA-F]{4}{3,}/` | +3 |
| Unicode homoglyph | `[Ѐ-ӿа-я]` → check for mixed scripts | +2 |

**E. Medical / Sensitive Data Leak**

| Pattern | Regex | Điểm |
|---------|-------|------|
| Patient info pattern | `/bệnh\s*nhân\s*:?\s*[\w\s]{2,30}\|mã\s*bệnh\s*nhân/i` | +2 |
| Medical record number | `/mã\s*(bệnh\s*án|bệnh\s*nhân)\s*[:=]\s*[A-Z0-9]{6,}/i` | +3 |
| Internal medical instruction | `/chẩn\s*đoán\s*(?:internal|nội\s*bộ)/i` | +2 |
| Prescription leak | `/đơn\s*thuốc\s*:[\s\S]{10,50}/i` | +2 |
| HIPAA-like data | `/(?:ssn|social\s+security)\s*[:=]\s*\d{3}-\d{2}-\d{4}/i` | +3 |

**F. Dify / Internal Reference**

| Pattern | Regex | Điểm |
|---------|-------|------|
| Conversation ID | `/convers?ation[_\s]?id\s*[:=]\s*[a-f0-9-]{20,}/i` | +2 |
| App/Dataset ID | `/dify[_\-]?(app|dataset)[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i` | +2 |
| Internal error leak | `/dify\s+(error|exception)\s*:\s*\w+/i` | +2 |
| API endpoint disclosure | `/(?:api\.dify|v1\/chat)\/[^/\s]+/i` | +2 |
| Dataset reference | `/dataset[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i` | +2 |

**G. Heuristic-Based Detection (ngoài regex)**

| Heuristic | Logic | Điểm |
|-----------|-------|------|
| Script tag | `/<script[\s\S]+?<\/script>/gi` → strip → still has content | +3 |
| Data URI | `/data:[^;]+;base64,[A-Za-z0-9+/]{50,}/gi` | +3 |
| Excessive special chars | Tỷ lệ `[^a-zA-Z0-9À-ỳ\s]` > 30% trong 200+ ký tự | +2 |
| Mixed scripts | Text chứa ≥3 unicode ranges khác nhau (Latin + Cyrillic + CJK) | +2 |
| Long consecutive special | `/[^\w\s]{20,}/` | +2 |

#### 4.3. Đề xuất implementation

```js
const LEAK_PATTERNS = [
  // A. Credential & Authentication
  /(?:Authorization|auth)[\s:]*Bearer\s+[a-zA-Z0-9\-_\.]{10,}/i,
  /(?:x-api-key|api.?key)[\s:]*['"]?[a-zA-Z0-9\-_]{10,}['"]?/i,
  /Basic\s+[a-zA-Z0-9+/]{20,}={0,2}/i,
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i,
  /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/i,
  /(mongodb|mysql|postgres|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/i,
  /AKIA[0-9A-Z]{16}/,
  /(google|azure|heroku|stripe)[_\-]?key\s*[:=]\s*\S{8,}/i,

  // B. Prompt Injection / Role Override
  /\bDAN\s+mode\b/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /developer\s+mode/i,
  /ignore\s+(all\s+)?(previous|prior)/i,
  /override\s+(your\s+)?(rules?|instructions?)/i,
  /forget\s+.*\nyou\s+are\s+(now\s+)?/is,
  /\[INST\][\s\S]+?\[\/INST\]/i,
  /```system[\s\S]+?```/i,
  /<<[a-z_]+>>:[\s\S]+?<<\/[a-z_]+>>/is,
  /<(?:system|role)>\s*[^<]+/i,
  /"role"\s*:\s*"(?:system|admin)"/i,

  // C. System Prompt Leak
  /(?:here'?s?\s+)?(?:your\s+)?(?:system\s+)?(?:instruct)?prompt/i,
  /(?:show|print|reveal|dump)(?:ing)?\s+(?:me\s+)?(?:your\s+)?prompt/i,
  /bạn\s+(là|đóng\s+vai)/i,
  /vai\s+trò\s*(của\s+)?(bạn|tôi|AI)/i,
  /(quy\s+tắc|luật|rules?)\s*:?\s*\d+/i,
  /###\s*(instruction|system|prompt)/i,

  // F. Dify / Internal Reference
  /convers?ation[_\s]?id\s*[:=]\s*[a-f0-9-]{20,}/i,
  /dify[_\-]?(app|dataset)[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i,
  /dify\s+(error|exception)\s*:\s*\w+/i,
  /(?:api\.dify|v1\/chat)\/[^/\s]+/i,
  /dataset[_\s]?id\s*[:=]\s*[a-z0-9]{10,}/i,
];

// Heuristic checks (thêm vào analyzeOutput)
function heuristicCheck(text) {
  const reasons = [], score = 0;

  // Script tag
  if (/<script[\s\S]+?<\/script>/gi.test(text)) {
    reasons.push('Script tag phát hiện'); score += 3;
  }
  // Base64 decode check
  const b64 = text.match(/[A-Za-z0-9+/]{32,}={0,2}/g) || [];
  for (const candidate of b64) {
    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8');
      const lower = decoded.toLowerCase();
      if (['ignore', 'bypass', 'system', 'instructions', 'override', 'password', 'secret', 'token'].some(k => lower.includes(k))) {
        reasons.push('Base64 chứa credential/injection'); score += 3; break;
      }
    } catch (_) {}
  }
  // Mixed scripts
  const hasLatin = /[a-zA-Z]/.test(text);
  const hasCyrillic = /[Ѐ-ӿа-я]/.test(text);
  const hasCJK = /[一-鿿぀-ゟ゠-ヿ]/.test(text);
  if (hasLatin && hasCyrillic) { reasons.push('Mixed Latin/Cyrillic script'); score += 2; }
  if (hasLatin && hasCJK) { reasons.push('Mixed Latin/CJK script'); score += 2; }
  // Excessive special chars
  const specialRatio = (text.match(/[^\w\sÀ-ỳ]/g) || []).length / text.length;
  if (specialRatio > 0.3 && text.length > 200) {
    reasons.push('Tỷ lệ ký tự đặc biệt cao (>30%)'); score += 2;
  }
  return { score, reasons };
}
```

**Điều quan trọng:** Ngoài regex, Layer 3 cần chạy `analyzeOutput` với text đã được `normalize('NFKC')` (giống Layer 1) trước khi check patterns, để phát hiện Unicode normalization attacks. Điểm threshold để block nên là ≥ 2 (giữ nguyên) nhưng scoring cho từng category nên được phân tách rõ ràng.

---

### 5. HIGH: `sendChatMessage` chỉ kiểm tra `userId` tồn tại, không verify quyền truy cập conversation

**File:** [controllers/chatbotController.js:58-65](controllers/chatbotController.js#L58-L65)

```js
if (userId) {
    const dbUser = await userModel.findById(userId).select('conversationId');
    if (dbUser && dbUser.conversationId) {
        conversationId = dbUser.conversationId;
    }
}
```

**Vấn đề:** Nếu Dify trả về `conversation_id` mới (mà không phải của user này), hệ thống vẫn lưu vào DB user mà không xác minh. Nên kiểm tra `conversation_id` mới có hợp lệ với app/dataset của ứng dụng không.

**Đề xuất:** Khi nhận `conversation_id` mới từ Dify, verify nó có trong danh sách conversation hợp lệ của user trước khi lưu.

---

### 6. HIGH: `chatbotSecController` lưu `CON_ID` vào file `.env`

**File:** [controllers/chatbotSecController.js:8-37](controllers/chatbotSecController.js#L8-L37)

```js
const updateEnvConId = (newConId) => {
    // Ghi vào .env
    fs.writeFileSync(envPath, envContent, 'utf8');
    process.env.CON_ID = newConId;
};
```

**Vấn đề:**
- Ghi file trên disk trong request handler → I/O blocking, race condition nếu nhiều request
- Trong môi trường multi-instance/container, mỗi instance ghi `.env` riêng
- Không có transactional safety
- Permission issue nếu process không có quyền ghi

**Đề xuất:** Lưu `CON_ID` vào MongoDB (collection riêng hoặc collection config) thay vì file `.env`.

---

### 7. MEDIUM: `detectSpacedLetters` trong Layer 1 có bug logic

**File:** [middlewares/layer1-input-validation.js:109-112](middlewares/layer1-input-validation.js#L109-L112)

```js
function detectSpacedLetters(text) {
  const collapsed = text.replace(/(?<!\w)(\w) (?=(\w ))/g, '$1').replace(/ /g, '');
  return FUZZY_KEYWORDS.some(kw => collapsed.toLowerCase().includes(kw));
}
```

**Vấn đề:** Regex `(?<!\w)(\w) (?=(\w ))` rất khắt khe — yêu cầu pattern `x y z` (3 từ liên tiếp) với khoảng trắng. Nếu user gõ `i g n o r e` (2 ký tự 1 space), regex này không match. Logic collapse không đúng.

**Đề xuất:** Thay bằng cách đơn giản hơn:
```js
function detectSpacedLetters(text) {
  const collapsed = text.replace(/\s+/g, '').toLowerCase();
  return FUZZY_KEYWORDS.some(kw => collapsed.includes(kw));
}
```
Nhưng lưu ý: điều này có thể gây false positive cho từ thường như "h e a l t h" (health có thể là bình thường trong y tế). Cân nhắc xem có nên bắt spaced letters hay không, vì nó rất dễ false positive trong ngữ cảnh y tế ("t h a n n h i ệ u", "b ệ n h", etc.).

---

### 8. MEDIUM: Layer 4 HITL threshold quá thấp, gây false positive trong ngữ cảnh y tế

**File:** [middlewares/layer4-hitl.js:29-31](middlewares/layer4-hitl.js#L29-L31)

```js
const CONFIG = {
  hitlThreshold: 2, // score >= ngưỡng này → giữ lại
};
```

**Vấn đề:** Trong ngữ cảnh y tế, các từ như `password` (mật khẩu tài khoản), `token` (token xác thực), `admin` (quản trị viên), `information` (thông tin bệnh nhân) xuất hiện rất thường xuyên. Threshold = 2 có nghĩa:
- Hỏi "cho tôi mật khẩu đăng nhập" → score = 2 → QUEUED
- Hỏi "thông tin cá nhân của tôi" → score = 1 → đi qua

→ Nhiều query hợp lệ bị giữ lại, gây UX tồi.

**Đề xuất:** Tăng threshold lên 3–4, hoặc điều chỉnh scoring cho context y tế:
```js
{ word: 'thông tin cá nhân',  score: 1, reason: 'Hỏi thông tin cá nhân' }, // giảm từ 2
{ word: 'token',              score: 0, reason: 'Đề cập token' }, // bỏ hoặc giảm — thường dùng trong medical context
```

---

### 9. MEDIUM: Nhiều endpoint thiếu output validation

**File:** [routes/chatbotRoute.js:26-28](routes/chatbotRoute.js#L26-L28)

```js
router.get('/form/human_input/:form_token', getHumanInputForm);
router.post('/form/human_input/:form_token', submitHumanInputForm);
router.get('/workflow/:task_id/events', getWorkflowEvents);
```

**Vấn đề:** Các endpoint này trả dữ liệu từ Dify ra client mà không qua Layer 3 output validation. User input từ `submitHumanInputForm` (form data) cũng không qua Layer 1 input validation.

**Đề xuất:** Thêm auth + validation cho các endpoint này tùy theo mức độ nhạy cảm.

---

### 10. MEDIUM: Layer 3 leak check chỉ chạy sau khi stream END

**File:** [middlewares/layer3-output-validation.js:230-248](middlewares/layer3-output-validation.js#L230-L248)

```js
// Phân tích leak CẢ STREAM trước khi block
const { isViolation, risk, reasons } = analyzeOutput(accumulatedAnswer);
if (isViolation) {
    // ...
    difyStream.destroy();
    res.end();
    return;
}
```

**Vấn đề:** Leaks được phát hiện sau khi stream kết thúc. Nếu Dify trả về 1 triệu ký tự leak rò rỉ, client nhận toàn bộ trước khi bị block. Đặc biệt nguy hiểm nếu output chứa credential/token thực sự.

**Đề xuất:** Kiểm tra leak theo từng chunk trong streaming:
```js
// Sau mỗi chunk, check accumulatedAnswer (hoặc check theo rolling window)
// Nếu phát hiện leak → destroy stream + gửi error event → res.end()
```

---

### 11. MEDIUM: File upload không được validate trong input

**File:** [controllers/chatbotController.js:56](controllers/chatbotController.js#L56) và [routes/chatbotRoute.js](routes/chatbotRoute.js)

```js
const { query, user = "web-user", files = [], userId } = req.body;
```

**Vấn đề:** Mảng `files` được forward thẳng đến Dify mà không validate:
- File type không kiểm tra (có thể upload malicious file)
- File size không giới hạn (DoS attack)
- Filename không sanitize (path traversal)

**Đề xuất:** Thêm validation cho files:
```js
const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const maxSize = 10 * 1024 * 1024; // 10MB

// Kiểm tra từng file
for (const file of files) {
    if (!validTypes.includes(file.type)) throw new Error('File type not allowed');
    if (file.size > maxSize) throw new Error('File too large');
}
```

---

### 12. LOW: Không có IP-based rate limiting

**File:** [middlewares/layer5-rate-limiter.js](middlewares/layer5-rate-limiter.js)

**Vấn đề:** Rate limit chỉ theo `userId`. Attacker có thể bypass bằng cách dùng nhiều tài khoản từ cùng 1 IP.

**Đề xuất:** Thêm rate limit theo IP làm layer thứ 2:
```js
const ipKey = `ratelimit:ip:${ip}`;
const ipCount = await redis.incr(ipKey);
// Giới hạn IP: 50 req/phút
if (ipCount > 50) return res.status(429).json({ ... });
```

---

### 13. LOW: Layer 1 — thiếu một số pattern quan trọng

**File:** [middlewares/layer1-input-validation.js:35-59](middlewares/layer1-input-validation.js#L35-L59)

**Thiếu pattern:**
```js
/\bcurl\s+.+dify/i,                    // Gọi API trực tiếp
/\b(wget|fetch|axios)\s+.+\.ai/i,     // HTTP request đến Dify
/\bawait\s+fetch\s*\(/i,               // Client-side fetch
/\[INST\].*\[\/INST\]/is,              // Llama instruction tag
/<<.*>>\s*:\s*[\s\S]+<<\/.*>>/is,     // Custom delimiters
/```system[\s\S]+?```/i,               // Markdown system block
/\bsudo\s+/i,                          // Privilege escalation
```

---

## Bảng tổng hợp

| # | Mức độ | Vấn đề | File |
|---|--------|--------|------|
| 1 | CRITICAL | Thiếu Layer 2 — Context Isolation | — |
| 2 | CRITICAL | `/chat-sec` không có auth & security layers | chatbotRoute.js:22 |
| 3 | CRITICAL | `/diagnoses` không có auth — lộ dữ liệu y tế | chatbotRoute.js:24 |
| 4 | HIGH | Leak patterns Layer 3 thiếu nhiều | layer3-output-validation.js:39 |
| 5 | HIGH | Không verify conversation_id từ Dify | chatbotController.js:196 |
| 6 | HIGH | CON_ID ghi vào .env file — multi-instance issue | chatbotSecController.js:8 |
| 7 | MEDIUM | `detectSpacedLetters` bug logic | layer1-input-validation.js:109 |
| 8 | MEDIUM | HITL threshold quá thấp → false positive | layer4-hitl.js:29 |
| 9 | MEDIUM | Endpoint `/form/*`, `/workflow/*` thiếu validation | chatbotRoute.js:26-28 |
| 10 | MEDIUM | Leak check chỉ sau khi stream END | layer3-output-validation.js:230 |
| 11 | MEDIUM | File upload không validate type/size | chatbotController.js:56 |
| 12 | LOW | Không có IP-based rate limit | layer5-rate-limiter.js |
| 13 | LOW | Layer 1 thiếu vài pattern | layer1-input-validation.js:35 |

---

## Kết luận

Các layer hiện tại đã có nền tảng tốt cho prompt injection defense, đặc biệt là Layer 1 (input), Layer 4 (HITL), và Layer 5 (rate limit). Tuy nhiên, **3 vấn đề CRITICAL** cần ưu tiên sửa ngay:

1. **Thiếu Layer 2** — cần context/session isolation
2. **`/chat-sec` không có bảo vệ** — bất kỳ ai cũng truy cập được
3. **`/diagnoses` không auth** — rò rỉ dữ liệu y tế nhạy cảm

Đây là compliance risk nghiêm trọng (Luật An ninh mạng Việt Nam 2015, GDPR Article 9 cho dữ liệu sức khỏe).