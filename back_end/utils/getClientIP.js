/**
 * Lấy IP client một cách an toàn nhất có thể.
 * @param {import('express').Request} req
 * @returns {{ ip: string, source: string, isProxied: boolean, spoofed: boolean, remoteAddress: string }}
 */
export function getClientIP(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];

  const remoteAddress = req.socket?.remoteAddress
    ?? req.connection?.remoteAddress
    ?? 'unknown';

  let ip;
  let source;
  let isProxied = false;

  if (cfConnectingIP) {
    ip = cfConnectingIP;
    source = 'CF-Connecting-IP';
    isProxied = true;
  } else if (xRealIP) {
    ip = xRealIP;
    source = 'X-Real-IP';
    isProxied = true;
  } else if (xForwardedFor) {
    const firstIP = xForwardedFor.split(',')[0].trim();
    ip = firstIP;
    source = 'X-Forwarded-For';
    isProxied = true;
  } else {
    ip = remoteAddress;
    source = 'remoteAddress';
    isProxied = false;
  }

  // Phát hiện spoof: client tự set header proxy nhưng không qua proxy thật
  const spoofed = (xForwardedFor !== undefined || xRealIP !== undefined)
    && !isProxied;

  return {
    ip,
    source,
    isProxied,
    spoofed,
    remoteAddress,
    rawHeaders: {
      'x-forwarded-for': xForwardedFor,
      'x-real-ip': xRealIP,
      'cf-connecting-ip': cfConnectingIP,
    },
  };
}