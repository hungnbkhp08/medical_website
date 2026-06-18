# IP Logging — Hướng dẫn bảo mật

## 1. Vấn đề

Client có thể gửi header `X-Forwarded-For` tự đặt để giả mạo IP:

```
X-Forwarded-For: 1.2.3.4
```

Code hiện tại lấy IP bằng:

```javascript
const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
  ?? req.socket?.remoteAddress
  ?? 'unknown';
```

| Nguồn | Spoof được? | Ghi chú |
|---|---|---|
| `X-Forwarded-For` | **Có** — client tự gửi | Header do client kiểm soát hoàn toàn |
| `X-Real-IP` | **Có** — client tự gửi | Tương tự XFF |
| `req.socket.remoteAddress` | **Không** | IP kết nối TCP trực tiếp. Khi có proxy, đây là IP của proxy |

---

## 2. Cấu hình Nginx (khuyến nghị)

Thêm vào block `http` hoặc `server`:

```nginx
# Loại bỏ X-Forwarded-For từ client trước khi nginx xử lý
# nginx sẽ tự thêm IP thật của client vào X-Forwarded-For
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```

Nếu muốn chặn triệt để hơn ở tầng nginx (client không thể gửi header):

```nginx
# Cách 1: Unset header từ client
proxy_set_header X-Forwarded-For "";
proxy_set_header X-Forwarded-For $remote_addr;  # nginx set lại

# Cách 2: Dùng map để override
http {
    map $http_x_forwarded_for $real_x_forwarded_for {
        default     $remote_addr;
        ""          $remote_addr;
    }
}

# Sau đó dùng:
proxy_set_header X-Forwarded-For $real_x_forwarded_for;
```

**Nếu dùng Cloudflare / Load Balancer / CDN:**
- Cloudflare thêm header `CF-Connecting-IP` — đáng tin hơn vì Cloudflare không forward request với header giả
- ALB (AWS), Nginx, HAProxy đều có cách tương tự để đảm bảo header không bị client override

---

## 3. Cấu hình Node.js (backend)

### 3.1 Tạo helper function

Tạo file `back_end/utils/getClientIP.js`:

```javascript
/**
 * Lấy IP client một cách an toàn nhất có thể.
 * @param {import('express').Request} req
 * @returns {{ ip: string, source: string, isProxied: boolean, spoofed: boolean }}
 */
export function getClientIP(req) {
  // 1. Các header do proxy đáng tin cậy set (server-side)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP       = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare

  // 2. IP kết nối trực tiếp (không spoof được)
  const remoteAddress = req.socket?.remoteAddress
    ?? req.connection?.remoteAddress
    ?? 'unknown';

  // 3. Quyết định IP nào dùng
  let ip;
  let source;
  let isProxied = false;

  if (cfConnectingIP) {
    ip      = cfConnectingIP;
    source  = 'CF-Connecting-IP';
    isProxied = true;
  } else if (xRealIP) {
    ip      = xRealIP;
    source  = 'X-Real-IP';
    isProxied = true;
  } else if (xForwardedFor) {
    // Lấy IP đầu tiên trong chuỗi proxy chain
    const firstIP = xForwardedFor.split(',')[0].trim();
    ip      = firstIP;
    source  = 'X-Forwarded-For';
    isProxied = true;
  } else {
    // Không có proxy → dùng remoteAddress
    ip      = remoteAddress;
    source  = 'remoteAddress';
    isProxied = false;
  }

  // 4. Phát hiện dấu hiệu spoof
  // Nếu X-Forwarded-For khác remoteAddress (trong môi trường có proxy),
  // đó là bình thường. Nhưng nếu cả 2 header proxy đều bị client set
  // mà không qua proxy thật → đáng ngờ.
  const spoofed = (xForwardedFor !== undefined || xRealIP !== undefined)
    && !isProxied;

  return {
    ip,
    source,
    isProxied,
    spoofed,
    remoteAddress, // luôn log thêm để trace
    rawHeaders: {
      'x-forwarded-for': xForwardedFor,
      'x-real-ip':       xRealIP,
      'cf-connecting-ip': cfConnectingIP,
    },
  };
}
```

### 3.2 Cập nhật các middleware

Thay thế cách lấy IP cũ ở mỗi layer:

```javascript
// TRƯỚC (dễ bị spoof)
const source = req.headers['x-forwarded-for']?.split(',')[0].trim()
  ?? req.socket?.remoteAddress
  ?? 'unknown';

// SAU (dùng helper)
import { getClientIP } from '../utils/getClientIP.js';

const { ip, source, isProxied, spoofed, remoteAddress } = getClientIP(req);

// Log đầy đủ để trace
console.info(`[Layer1] user_id=${userIdForLog} ip=${ip} source=${source} proxied=${isProxied} spoofed=${spoofed}`);
```

### 3.3 Cập nhật log model

Thêm các field vào schema để lưu đầy đủ:

```javascript
// Trong logModel schema, thêm field:
source:      String,  // nguồn lấy IP: 'X-Forwarded-For', 'X-Real-IP', 'remoteAddress', 'CF-Connecting-IP'
isProxied:   Boolean, // có qua proxy không
ipSpoofed:   Boolean, // phát hiện dấu hiệu spoof
remoteAddr:  String,  // IP kết nối trực tiếp (không spoof được)

// Khi ghi log:
await logModel.create({
  // ... existing fields
  source:     clientInfo.source,
  isProxied:  clientInfo.isProxied,
  ipSpoofed:  clientInfo.spoofed,
  remoteAddr: clientInfo.remoteAddress,
});
```

---

## 4. Bảng so sánh các header

| Header | Ai set? | Đáng tin? | Môi trường |
|---|---|---|---|
| `remoteAddress` | Hệ thống (TCP) | ✅ Tuyệt đối | Không proxy |
| `X-Real-IP` | Proxy/server | ✅ Nếu proxy đáng tin | Có nginx/proxy |
| `X-Forwarded-For` | Proxy/server (đúng) / Client (giả) | ⚠️ Tuỳ proxy | Proxy đáng tin |
| `CF-Connecting-IP` | Cloudflare | ✅ Rất đáng tin | Dùng Cloudflare |
| `True-Client-IP` | CDN/proxy | ✅ Nếu CDN đáng tin | Akamai, Cloudflare |

---

## 5. Các middleware cần cập nhật

- [ ] [layer1-input-validation.js](back_end/middlewares/layer1-input-validation.js) — line 442
- [ ] [layer3-output-validation.js](back_end/middlewares/layer3-output-validation.js) — line 274
- [ ] [layer4-hitl.js](back_end/middlewares/layer4-hitl.js) — line 89
- [ ] [layer5-rate-limiter.js](back_end/middlewares/layer5-rate-limiter.js) — line 167

---

## 6. Lưu ý quan trọng

**Không có cách nào chống IP spoof 100% ở tầng application.**

- Ở tầng **TCP**: IP spoofing có thể xảy ra nhưng packet không thể ACK về IP giả (cần man-in-the-middle hoặc kẻ tấn công cùng segment mạng)
- Ở tầng **HTTP**: Header spoof hoàn toàn có thể → đây là lý do cần nginx/proxy đáng tin làm proxy xử lý

**Best practice thực tế:**
1. Proxy (nginx/Cloudflare/CDN) chặn client gửi IP header giả
2. Proxy set header IP thật của client
3. Backend chỉ tin header từ proxy đã trust
4. Luôn log cả `remoteAddress` để trace ngược khi cần

**Tuy nhiên**, đối với mục đích log gốc (audit trail) thì:
- `remoteAddress` của nginx/proxy server → không hữu ích lắm
- Proxy-set `X-Forwarded-For` → hữu ích nhất, miễn là proxy đáng tin
- Phát hiện spoof → hữu ích cho security monitoring (flag tài khoản đáng ngờ)