# BÁO CÁO PHÂN TÍCH HỆ THỐNG BẢO MẬT ĐA TẦNG
## Phòng chống Prompt Injection cho Ứng dụng Y tế
### Stack: Express.js + MongoDB + Redis + Dify API
### Ngày: 2026-06-17

---

## MỤC LỤC

1. [Tóm tắt điều hành](#1-tóm-tắt-điều-hành)
2. [Kiến trúc tổng quan](#2-kiến-trúc-tổng-quan)
3. [Layer 1 — Input Validation & Sanitization](#3-layer-1--input-validation--sanitization)
4. [Layer 3 — Output Validation](#4-layer-3--output-validation)
5. [Layer 4 — Human-in-the-Loop (HITL)](#5-layer-4--human-in-the-loop-hitl)
6. [Layer 5 — Rate Limiting](#6-layer-5--rate-limiting)
7. [Nhận dạng Client & IP Logging](#7-nhận-dạng-client--ip-logging)
8. [Mô hình dữ liệu Log](#8-mô-hình-dữ-liệu-log)
9. [Ma trận phủ threat](#9-ma-trận-phủ-threat)
10. [Hạn chế & Khuyến nghị](#10-hạn-chế--khuyến-nghị)
11. [Kết luận](#11-kết-luận)

---

## 1. Tóm tắt điều hành

Báo cáo này phân tích chi tiết hệ thống bảo mật **5 tầng** được triển khai trong ứng dụng web y tế, tập trung vào việc phòng chống **Prompt Injection** — một trong những mối đe dọa nghiêm trọng nhất khi tích hợp LLM (Dify API) vào ứng dụng xử lý thông tin nhạy cảm.

### Điểm nổi bật

| Thành phần | Đặc điểm |
|---|---|
| **Layer 1** | 7 categories, 180+ regex patterns, fuzzy match, encoding detection |
| **Layer 3** | 50+ leak patterns, 9 heuristic checks, streaming support |
| **Layer 4** | HITL queue, admin review workflow, Dify re-call |
| **Layer 5** | Sliding window, progressive block, Redis-backed |
| **IP Logging** | 4 nguồn ưu tiên, spoof detection, full trace |

### Luồng xử lý request

```
Client Request
     │
     ▼
┌─────────────┐
│  Layer 5    │ ◄── Rate Limiting (Redis Sliding Window)
│  Rate Limit │
└──────┬──────┘
       │ allowed
       ▼
┌─────────────┐
│  Layer 1    │ ◄── Input Validation (180+ patterns)
│  Input      │     + Sanitization
│  Validation │     + Log to MongoDB
└──────┬──────┘
       │ safe
       ▼
┌─────────────┐
│  Layer 4    │ ◄── HITL Risk Scoring (vùng xám)
│  HITL       │     + Queue for review
│  Check      │     + Admin approval
└──────┬──────┘
       │ pass / approved
       ▼
┌─────────────┐
│  Dify API   │ ◄── LLM Inference
│  Chat       │
└──────┬──────┘
       │ response
       ▼
┌─────────────┐
│  Layer 3    │ ◄── Output Validation (leak detection)
│  Output     │     + Heuristic checks
│  Validation │     + Log to MongoDB
└─────────────┘
       │ safe
       ▼
   Client
```

---

## 2. Kiến trúc tổng quan

### 2.1 Vị trí trong request lifecycle

```
authUser → rateLimiter → inputValidation → hitlCheck → sendChatMessage → outputValidation
```

Middleware `authUser` (JWT) chạy **trước** tất cả các layer bảo mật để đảm bảo user đã được xác thực trước khi kiểm tra bảo mật. Layer 5 (rate limiter) chạy **đầu tiên** để loại bỏ request spam sớm nhất.

### 2.2 Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Web Server | Express.js | Middleware pipeline |
| Database | MongoDB (Mongoose) | Audit logging, user data |
| Cache | Redis (ioredis) | Rate limit counters |
| LLM | Dify API | Chatbot inference |
| Auth | JWT | User identification |

### 2.3 Mục tiêu bảo mật

Hệ thống được thiết kế theo nguyên tắc **defense in depth** — không có tầng nào đủ một mình, nhưng khi kết hợp lại tạo thành rào cản đa lớp:

1. **Ngăn chặn** (Prevention): Layer 1 chặn prompt injection rõ ràng ở đầu vào
2. **Phát hiện** (Detection): Layer 3 phát hiện rò rỉ thông tin nhạy cảm ở đầu ra
3. **Kiểm soát** (Control): Layer 4 giữ lại request nghi vấn để admin xem xét
4. **Hạn chế** (Restrict): Layer 5 ngăn chặn tấn công brute-force / DoS

---

## 3. Layer 1 — Input Validation & Sanitization

**File:** `back_end/middlewares/layer1-input-validation.js`
**Chức năng:** Phân tích và loại bỏ input độc hại trước khi gửi đến LLM

### 3.1 Bảy danh mục patterns

| # | Danh mục | Ví dụ | Trọng số |
|---|---|---|---|
| 1 | Prompt Injection / Jailbreak | `ignore all previous instructions`, `you are now DAN` | 3 |
| 2 | XSS / HTML Injection | `<script>`, `onerror=`, `javascript:` | 3 |
| 3 | NoSQL Injection | `$ne`, `$where`, `$regex` | 3 |
| 4 | Command Injection | `; ls`, `$(whoami)`, `` `cat` `` | 4 |
| 5 | Template Injection | `{{}}`, `<%= %>`, `${}` | 3 |
| 6 | Path Traversal / LFI | `../`, `phar://`, `etc/passwd` | 2 |
| 7 | SQL Injection | `' or 1=1`, `UNION SELECT`, `DROP TABLE` | 3 |

Layer 1 có **180+ regex patterns** bao phủ đầy đủ các kỹ thuật tấn công phổ biến nhất. Mỗi pattern match cộng trọng số riêng — command injection nặng nhất (4) vì có thể dẫn đến RCE.

### 3.2 Các kỹ thuật phát hiện nâng cao

**Typoglycemia Detection** — phát hiện obfuscation bằng cách hoán vị chữ cái:
- Input: `i g n o r e` → nhận diện ≈ `ignore` → score +2

**Encoding Detection** — phát hiện Base64 và Hex obfuscation:
- Tìm chuỗi Base64 → decode → scan từ khóa nguy hiểm
- Phát hiện chuỗi Hex bất thường (40+ ký tự)
- Phát hiện ký tự Unicode vô hình (U+200B → U+FEFF)

**Spaced Letter Obfuscation** — phát hiện `i g n o r e` style:
- Normalize khoảng trắng, so sánh với keyword list

**HTML Sanitization:**
```javascript
// Loại bỏ tất cả HTML tags và javascript: scheme
clean = clean.replace(/<[^>]+>/g, '');
clean = clean.replace(/javascript:/gi, '');
```

### 3.3 Cơ chế scoring

```
isMalicious = (score >= 2)
```

| Mức độ | Score | Label | Hành động |
|---|---|---|---|
| LOW | 1 | LOW | Cho qua |
| MEDIUM | 2–3 | MEDIUM | Chặn, log |
| HIGH | 4–5 | HIGH | Chặn, log |
| CRITICAL | ≥6 | CRITICAL | Chặn, log |

### 3.4 Xử lý khi phát hiện

```
① Console.warn với chi tiết pattern match
② Log không đồng bộ vào MongoDB (không block response)
③ Trả 400 cho client (không tiết lộ pattern match — debug chỉ khi DEV)
④ Sanitized query được gắn lại vào req.body để các middleware sau dùng
```

### 3.5 Điểm mạnh

- **Phủ rộng:** 180+ patterns bao phủ prompt injection, XSS, NoSQL, command, template, path, SQL injection
- **Đa tầng phát hiện:** Regex + fuzzy + encoding + spaced letters — không thể bypass bằng 1 kỹ thuật obfuscation duy nhất
- **Non-blocking logging:** Async write không ảnh hưởng latency
- **Normalization NFKC:** Chống homoglyph attacks (ví dụ: `ɑ` vs `a`)

### 3.6 Điểm yếu tiềm ẩn

- **Whitelist-based tốt hơn:** Regex match pattern độc hại, nhưng whitelist approach an toàn hơn cho input nghiêm ngặt
- **False positive risk:** Patterns như `password` có thể chặn câu hỏi hợp lệ của bệnh nhân hỏi về "password" tài khoản
- **No rate limit awareness:** Layer 1 không có state — không biết user đã fail bao nhiêu lần

---

## 4. Layer 3 — Output Validation

**File:** `back_end/middlewares/layer3-output-validation.js`
**Chức năng:** Quét output từ Dify API trước khi trả về client

### 4.1 Hai chế độ hỗ trợ

| Chế độ | Mô tả | Xử lý |
|---|---|---|
| **Streaming** | SSE response từ Dify | Tích lũy chunks, scan liên tục, block nếu phát hiện leak |
| **Blocking** | Full response từ Dify | Scan toàn bộ, block nếu phát hiện leak |

### 4.2 Bốn nhóm Leak Patterns

| Nhóm | Patterns | Ví dụ | Trọng số |
|---|---|---|---|
| A. Credential & Auth | 12 | Bearer token, API key, JWT, DB connection string | 3 |
| B. Prompt Injection | 13 | DAN mode, override rules, jailbreak | 3 |
| C. System Prompt Leak | 10 | "here's your system prompt", role override | 3 |
| D. Encoding / Obfuscation | 1 | Long hex strings | 3 |

**Tổng: 50+ patterns** nhắm vào các dấu hiệu output bị nhiễm độc.

### 4.3 Chín heuristic checks

| # | Check | Mô tả | Score |
|---|---|---|---|
| 1 | Script tag | `<script>...</script>` | +3 |
| 2 | Data URI base64 | `data:...;base64,...` | +3 |
| 3 | Long special chars | `20+` ký tự đặc biệt liên tiếp | +2 |
| 4 | URL-encoded payload | `%[0-9a-fA-F]{2}` x5 trở lên | +3 |
| 5 | Unicode escape | `\\uXXXX` x3 trở lên | +3 |
| 6 | Mixed Latin/Cyrillic | Ký tự Cyrillic (Ѐ-ӿ) + Latin | +2 |
| 7 | Mixed Latin/CJK | Ký tự CJK (一-鿿) + Latin | +2 |
| 8 | Base64 keyword scan | Decode Base64 → scan keywords | +3 |
| 9 | Special char ratio | Tỷ lệ special chars > 30% | +2 |

### 4.4 Hành vi khi phát hiện leak

**Streaming mode:**
```
① Gửi error event qua SSE: { event: 'error', status: 400, code: 'output_leak' }
② Destroy Dify stream
③ Xóa conversation trên Dify API
④ Log đầy đủ vào MongoDB
⑤ End response
```

**Blocking mode:**
```
① Log đầy đủ vào MongoDB
② Xóa conversation trên Dify API
③ Trả 400: "Không thể cung cấp thông tin này."
```

### 4.5 Điểm mạnh

- **Streaming-aware:** Không chỉ scan cuối cùng mà tích lũy và scan liên tục — phát hiện leak sớm, không phải đợi stream kết thúc
- **Conversation cleanup:** Khi phát hiện leak, xóa conversation trên Dify để ngăn LLM tiếp tục poisoned context
- **NFKC normalization:** Chống homoglyph attacks trong output

### 4.6 Điểm yếu tiềm ẩn

- **Token consumption:** Leak phát hiện SAU khi Dify đã consume token — không ngăn được chi phí
- **False negative risk:** LLM có thể leak thông tin theo cách không match bất kỳ pattern nào (semantic leak)
- **Blocking mode scan:** Scan toàn bộ string trước khi trả — output rất lớn có thể gây chậm

---

## 5. Layer 4 — Human-in-the-Loop (HITL)

**File:** `back_end/middlewares/layer4-hitl.js`
**Chức năng:** Giữ lại request nghi vấn ở "vùng xám" để admin xem xét thủ công

### 5.1 Vùng xám — Risk Scoring

Layer 4 xử lý request mà Layer 1 đã cho qua nhưng vẫn có nguy cơ. Không dùng regex mà dùng **keyword scoring** với ngưỡng `hitlThreshold = 2`:

**Risk Keywords:**

| Từ khóa | Score | Lý do |
|---|---|---|
| password | 2 | Hỏi về password |
| token | 1 | Đề cập token |
| api | 1 | Đề cập API |
| admin | 2 | Đề cập admin |
| secret | 2 | Đề cập secret |
| credential | 2 | Đề cập credential |
| hack | 3 | Đề cập hack |
| exploit | 3 | Đề cập exploit |

**Risk Phrases:**

| Cụm từ | Score | Lý do |
|---|---|---|
| xóa dữ liệu | 3 | Yêu cầu xóa dữ liệu |
| tất cả bệnh nhân | 2 | Yêu cầu dữ liệu hàng loạt |
| danh sách user | 2 | Yêu cầu danh sách user |
| toàn bộ dữ liệu | 3 | Yêu cầu toàn bộ dữ liệu |
| thông tin cá nhân | 1 | Hỏi thông tin cá nhân người khác |
| không giới hạn | 2 | Yêu cầu bỏ giới hạn |
| xem hồ sơ người | 2 | Truy cập hồ sơ người khác |

**Mức độ:**

| Score | Label | Hành động |
|---|---|---|
| 0–1 | LOW | Cho qua |
| 2–5 | MEDIUM–HIGH | HITL queue |
| ≥6 | CRITICAL | HITL queue |

### 5.2 Admin Review Workflow

```
Request queued (202 Accepted)
         │
         ▼
┌──────────────────┐
│  Admin Dashboard │ ◄── /admin/hitl/queue
│  Xem danh sách   │     GET /admin/hitl/queue
└────────┬─────────┘
         │
    User chọn 1 request
         │
         ├──▶ Approve ──► Gọi lại Dify API
         │              Lưu response vào log
         │              Trả kết quả cho user
         │
         └──▶ Reject ──► Lưu ghi chú
                        Không trả gì cho user
```

### 5.3 Các endpoint admin

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/hitl/queue` | Lấy danh sách pending requests (pagination) |
| POST | `/admin/hitl/:id/approve` | Approve + gọi lại Dify + trả response |
| POST | `/admin/hitl/:id/reject` | Reject + ghi chú |

### 5.4 Điểm mạnh

- **Semantic understanding:** Không chỉ pattern matching mà nhắm vào ý định (intent) — "xóa dữ liệu" không match regex nhưng rõ ràng đáng ngờ
- **Human judgment:** Admin có context đầy đủ để phân biệt false positive (bệnh nhân hỏi về dữ liệu của mình) vs. true attack
- **Conversation recovery:** Approve → gọi lại Dify với cùng query, trả kết quả cho user

### 5.5 Điểm yếu tiềm ẩn

- **Latency:** Request bị giữ lại → user không nhận response ngay
- **Admin bottleneck:** Nếu queue tích lũy, admin có thể không theo kịp
- **Dify re-call cost:** Mỗi approve gọi lại Dify → tốn token + credit
- **No auto-escalation:** Score ≥ 6 vẫn chỉ queue, không auto-block

---

## 6. Layer 5 — Rate Limiting

**File:** `back_end/middlewares/layer5-rate-limiter.js`
**Chức năng:** Ngăn chặn tấn công brute-force và Best-of-N (BoN) Jailbreaking

### 6.1 Chiến lược: Sliding Window Counter

```
Tại sao Sliding Window?
  Fixed window: attack có thể gửi burst ngay đầu window mới → bypass
  Sliding window: đếm liên tục theo thời gian thực → không bypass được
```

```
Redis Keys:
  ratelimit:<user_id>          — counter + TTL
  ratelimit:block:<user_id>    — block flag + TTL
  ratelimit:blockcount:<user_id> — số lần bị block (24h TTL)
```

### 6.2 Cấu hình

```javascript
maxRequests:     20    // request tối đa / window
windowSeconds:   60    // window = 60 giây
progressiveBlock: [
  { threshold: 1, blockSeconds: 5  * 60 },  // block lần 1 → 5 phút
  { threshold: 2, blockSeconds: 15 * 60 },  // block lần 2 → 15 phút
  { threshold: 3, blockSeconds: 60 * 60 },  // block lần 3+ → 1 giờ
]
```

### 6.3 Luồng xử lý

```
Request đến
    │
    ├──▶ Kiểm tra block key (TTL > 0) ──▶ Đang block ──▶ 429 + Retry-After
    │
    └──▶ Chưa block
           │
           ├──▶ INCR counter + TTL
           │
           ├──▶ Counter ≤ 20 ──▶ next() + headers X-RateLimit-*
           │
           └──▶ Counter > 20
                  │
                  ├──▶ INCR block count
                  ├──▶ SET block key (TTL = progressive duration)
                  ├──▶ Log to MongoDB (chỉ lần đầu)
                  └──▶ 429 + thông báo
```

### 6.4 Headers trả về

```
X-RateLimit-Limit:     20
X-RateLimit-Remaining: <số request còn lại>
X-RateLimit-Window:    60s
Retry-After:           <giây>  (khi bị block)
```

### 6.5 Điểm mạnh

- **Progressive penalty:** Lần vi phạm đầu chỉ 5 phút, lần 3 trở lên là 1 giờ — không ban permanent ban ngay
- **Graceful degradation:** Redis lỗi → không chặn request, chỉ log lỗi
- **Redis pipeline:** INCR + TTL trong 1 round-trip → low latency
- **BoN resistant:** 20 request/window đủ thấp để ngăn brute-force attack trên LLM

### 6.6 Điểm yếu tiềm ẩn

- **Per-user, not per-IP:** Rate limit theo `user_id` từ JWT, không phải IP — attacker có nhiều tài khoản có thể bypass
- **No global threshold:** Không có giới hạn tổng cho toàn bộ hệ thống
- **Lazy connect Redis:** Khởi tạo kết nối lazy → request đầu tiên có thể chậm

---

## 7. Nhận dạng Client & IP Logging

**File:** `back_end/utils/getClientIP.js`
**Chức năng:** Lấy IP client an toàn, phát hiện spoofing

### 7.1 Thứ tự ưu tiên nguồn IP

```
① CF-Connecting-IP   ← Cloudflare (đáng tin nhất)
② X-Real-IP          ← Proxy/Nginx (đáng tin)
③ X-Forwarded-For    ← Proxy/Nginx (có thể spoof nếu proxy không sanitize)
④ remoteAddress      ← TCP socket (không spoof được — nhưng là IP của proxy)
```

### 7.2 Spoof Detection

```javascript
const spoofed = (xForwardedFor !== undefined || xRealIP !== undefined)
  && !isProxied;
```

**Logic:** Nếu client tự gửi header proxy (X-Forwarded-For, X-Real-IP) mà không qua proxy thật → đáng ngờ → `spoofed = true`

### 7.3 Return object

```javascript
{
  ip,              // IP thực (ưu tiên trusted headers)
  source,          // Nguồn: 'CF-Connecting-IP', 'X-Real-IP', 'X-Forwarded-For', 'remoteAddress'
  isProxied,       // Có qua proxy không
  spoofed,         // Phát hiện dấu hiệu spoof
  remoteAddress,   // IP kết nối TCP gốc (luôn log để trace)
  rawHeaders: {    // Headers thô để debug
    'x-forwarded-for': ...,
    'x-real-ip': ...,
    'cf-connecting-ip': ...,
  }
}
```

### 7.4 Cấu hình Nginx khuyến nghị

```nginx
# Cách 1: Unset header từ client
proxy_set_header X-Forwarded-For "";

# Sau đó nginx set lại với IP thật
proxy_set_header X-Forwarded-For $remote_addr;

# Cách 2: Dùng map để override
map $http_x_forwarded_for $real_x_forwarded_for {
    default     $remote_addr;
    ""          $remote_addr;
}
proxy_set_header X-Forwarded-For $real_x_forwarded_for;
```

### 7.5 Lưu ý quan trọng

> **Không có cách nào chống IP spoof 100% ở tầng application.**

| Tầng | Rủi ro | Biện pháp |
|---|---|---|
| TCP | IP spoofing có thể xảy ra nhưng packet không ACK về IP giả | Không áp dụng ở tầng app |
| HTTP | Header spoof hoàn toàn có thể | Proxy đáng tin chặn |
| Application | Không thể verify IP thật nếu header bị client set | Trust proxy, log remoteAddress |

---

## 8. Mô hình dữ liệu Log

**File:** `back_end/models/logModel.js`
**Collection:** `logs`

### 8.1 Schema

```javascript
{
  unique_id:      String,   // UUID v4 — không dùng _id để tránh expose MongoDB internals
  created_at:     Date,     // Timestamp
  user_id:        String,   // User ID từ JWT

  // ── Content ──────────────────────────────────────────
  data:           String,   // Query gốc (input) hoặc output (output)
  msg:            String,   // Lý do bị log (pattern match, reason)

  // ── Classification ───────────────────────────────────
  rule_id:        String,   // LAYER1_PROMPT_INJECTION | LAYER3_OUTPUT_LEAK | LAYER4_HITL | LAYER5_RATE_LIMIT
  severity:       String,   // '1' (LOW) → '4' (CRITICAL)
  severity_label: String,   // LOW | MEDIUM | HIGH | CRITICAL

  // ── IP & Client Info ──────────────────────────────────
  source:         String,   // IP client (đã sanitize)
  isProxied:      Boolean,  // Qua proxy không
  ipSpoofed:      Boolean,  // Phát hiện spoof
  remoteAddr:     String,   // IP TCP gốc (để trace)

  // ── Layer 4 HITL Extension ────────────────────────────
  status:         String,   // pending | approved | rejected
  conversation_id:String,
  dify_user:      String,
  reviewed_by:    String,   // admin user_id
  reviewed_at:    Date,
  review_note:    String,
  dify_response:  Mixed,
}
```

### 8.2 Indexing strategy

```javascript
// Compound index cho HITL queue
{ rule_id: 1, status: 1, created_at: -1 }

// Index cho query theo user
{ user_id: 1, created_at: -1 }

// Index cho security search
{ source: 1, created_at: -1 }
```

### 8.3 Audit trail properties

- `unique_id` không dùng `_id` → tránh expose MongoDB ObjectID trong API response
- `created_at` lưu đầy đủ timestamp → phục vụ forensic analysis
- `ipSpoofed` flag → có thể query để tìm attacker IP patterns
- `remoteAddr` luôn log → trace ngược kể cả khi header bị spoof

---

## 9. Ma trận phủ threat

| Threat | Layer 1 | Layer 3 | Layer 4 | Layer 5 |
|---|---|---|---|---|
| **Prompt Injection (regex)** | ✅ | ✅ | — | — |
| **Prompt Injection (semantic)** | — | — | ✅ | — |
| **Jailbreak / DAN mode** | ✅ | ✅ | ✅ | — |
| **XSS / HTML Injection** | ✅ | ✅ | — | — |
| **NoSQL Injection** | ✅ | — | — | — |
| **Command Injection** | ✅ | — | — | — |
| **SQL Injection** | ✅ | — | — | — |
| **Template Injection** | ✅ | — | — | — |
| **Path Traversal** | ✅ | — | — | — |
| **Credential Leak (output)** | — | ✅ | — | — |
| **System Prompt Leak (output)** | — | ✅ | — | — |
| **Data exfiltration (semantic)** | — | — | ✅ | — |
| **BoN Jailbreaking** | — | — | — | ✅ |
| **Brute-force attack** | — | — | — | ✅ |
| **DoS / Spam** | — | — | — | ✅ |
| **IP Spoofing** | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

> ⚠️ = Phát hiện được, không ngăn chặn được hoàn toàn ở tầng app

---

## 10. Hạn chế & Khuyến nghị

### 10.1 Hạn chế hiện tại

| # | Hạn chế | Tác động |
|---|---|---|
| 1 | Layer 1 dùng regex blacklist, không phải whitelist | Có thể bypass bằng novel techniques |
| 2 | Output leak chỉ phát hiện được khi đã consume token | Không tiết kiệm credit |
| 3 | Rate limit theo user_id, không phải IP | Multi-account attack có thể bypass |
| 4 | Không có global rate limit | Tổng thể hệ thống có thể bị overwhelm |
| 5 | Không có automatic threat intelligence | Cần manual update patterns |
| 6 | Không mã hóa log data | Sensitive data trong MongoDB plaintext |

### 10.2 Khuyến nghị cải thiện

**Ngắn hạn:**

1. **Whitelist Input** — Giới hạn input chỉ cho phép các ký tự/patterns hợp lệ cho domain y tế, reject tất cả còn lại
2. **Early Exit on Token Limit** — Layer 3 nên kiểm tra accumulated length trước khi call Dify tiếp
3. **Dual Rate Limit** — Thêm rate limit theo IP ngoài user_id
4. **Pattern Auto-Update** — Cơ chế update patterns từ external threat feed
5. **Log Encryption** — Mã hóa các trường nhạy cảm trong log (user query, IP)

**Dài hạn:**

1. **ML-based Anomaly Detection** — Dùng ML model để phát hiện semantic prompt injection thay vì keyword/regex
2. **WAF Integration** — Tích hợp Cloudflare WAF với ruleset chuyên dụng cho LLM apps
3. **Audit Dashboard** — Trang admin xem real-time threats, trends, top attackers
4. **Webhook Alerts** — Gửi alert qua webhook khi severity = CRITICAL
5. **Red Team Testing** — Regular penetration testing với focus vào LLM attack vectors

### 10.3 Cấu hình Production Checklist

```
□ Nginx set X-Forwarded-For với $remote_addr (không trust client header)
□ Cloudflare WAF rules enable
□ Redis authentication enable
□ MongoDB authentication + TLS
□ Rate limit threshold phù hợp với usage pattern thực tế
□ Log retention policy (xóa log cũ sau X ngày)
□ IP spoofed → auto-flag tài khoản để review
□ CRITICAL logs → trigger alert cho security team
```

---

## 11. Kết luận

Hệ thống bảo mật 5 tầng được triển khai với chiến lược **defense in depth**, phủ rộng từ input validation (Layer 1) → semantic risk scoring (Layer 4) → output scanning (Layer 3) → rate limiting (Layer 5). Mỗi tầng giải quyết một góc độ khác nhau của vấn đề Prompt Injection và các mối đe dọa liên quan.

### Điểm mạnh tổng thể

- **Đa tầng:** 5 layer không overlap, bổ trợ lẫn nhau
- **Phủ rộng attack surface:** 7 danh mục patterns input, 4 nhóm output leak, 2 loại risk scoring
- **Observable:** Đầy đủ logging, IP tracking, spoof detection
- **Non-blocking:** Lỗi DB/Redis không làm crash request

### Rủi ro cần theo dõi

- **Semantic attacks** vẫn là thách thức lớn nhất — regex và keyword matching không đủ cho novel techniques
- **IP spoofing** không thể ngăn chặn hoàn toàn ở tầng application — cần infrastructure-level protection
- **False positive** có thể ảnh hưởng trải nghiệm người dùng hợp lệ

### Recommendation tổng

> Triển khai hệ thống này như **lớp bảo vệ nền tảng**, đồng thời đầu tư vào **WAF (Cloudflare)** và **continuous red team testing** để phát hiện gaps. Không nên coi bất kỳ layer nào là đủ một mình.

---

## Phụ lục A — File cấu trúc

```
back_end/
├── middlewares/
│   ├── layer1-input-validation.js     # Input regex + sanitization
│   ├── layer3-output-validation.js     # Output leak detection
│   ├── layer4-hitl.js                  # HITL queue + admin APIs
│   └── layer5-rate-limiter.js          # Redis rate limiting
├── models/
│   └── logModel.js                     # Audit log schema
├── utils/
│   └── getClientIP.js                  # IP extraction helper
└── docs/
    ├── IP_LOGGING_GUIDE.md             # IP logging guide
    └── SECURITY_LAYER_REPORT.md         # This report
```

## Phụ lục B — Cấu hình Nginx đầy đủ

```nginx
# /etc/nginx/conf.d/medical-website.conf

server {
    listen 443 ssl http2;
    server_name medical.example.com;

    # ── Security Headers ──────────────────────────────────
    add_header X-Frame-Options        "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection       "1; mode=block" always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

    # ── Proxy Settings ────────────────────────────────────
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        # Không trust X-Forwarded-For từ client
        proxy_set_header   X-Forwarded-For "";
        proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

*Báo cáo được tạo: 2026-06-17*
*Framework bảo mật: OWASP LLM Top 10 + Defense in Depth*