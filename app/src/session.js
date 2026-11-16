import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "swp_session";
export const CSRF_COOKIE = "swp_csrf";
const IDLE_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_MS = 14 * 24 * 60 * 60 * 1000;

function sign(body, secret) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function timingSafeEqualString(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function readSession(token, secret, now = Date.now()) {
  if (!token || !secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqualString(sig, sign(body, secret))) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
  if (!payload.csrf || payload.exp <= now) return null;
  if (typeof payload.act !== "number" || now - payload.act > IDLE_MS) return null;
  return payload;
}

export function createSessionToken(userId, secret, now = Date.now()) {
  return signSession({
    sub: userId,
    exp: now + ABSOLUTE_MS,
    act: now,
    csrf: randomBytes(24).toString("hex"),
  }, secret);
}

export function touchSession(payload, secret, now = Date.now()) {
  if (now - payload.act < 60 * 1000) return "";
  return signSession({ ...payload, act: now }, secret);
}

export function newCsrf() {
  return randomBytes(24).toString("hex");
}

export function readCookie(header, name) {
  if (!header) return "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) {
      try {
        return decodeURIComponent(trimmed.slice(eq + 1));
      } catch {
        return "";
      }
    }
  }
  return "";
}

export function cookieSecure(req, cfg) {
  if (cfg.cookieSecure) return true;
  return req.secure === true;
}

export function setCookie(res, name, value, { maxAge, httpOnly = true, secure = false } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"];
  if (maxAge != null) parts.push(`Max-Age=${Math.floor(maxAge)}`);
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

export function clearCookie(res, name, secure) {
  const parts = [`${name}=`, "Path=/", "Max-Age=0", "SameSite=Lax", "HttpOnly"];
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

export function csrfOk(req, session) {
  const sent = String(req.body?.csrf || req.get("x-csrf-token") || "");
  if (session) return timingSafeEqualString(sent, session.csrf);
  return timingSafeEqualString(sent, readCookie(req.get("cookie"), CSRF_COOKIE));
}
