import { HttpError } from "./errors.js";

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return "";
  return email;
}

export function cleanText(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > max) return "";
  return text;
}

export function cleanMultiline(value, max) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text || text.length > max) return "";
  return text;
}

export function requireAccountFields({ name, email, organization, password }) {
  const cleanName = cleanText(name, 80);
  const cleanOrg = cleanText(organization, 160);
  const cleanEmail = normalizeEmail(email);
  const secret = String(password || "");
  if (!cleanName) throw new HttpError(400, "Enter your name.");
  if (!cleanOrg) throw new HttpError(400, "Enter your organization.");
  if (!cleanEmail) throw new HttpError(400, "Enter a valid email.");
  if (secret.length < 8 || secret.length > 200) throw new HttpError(400, "Password must be 8 to 200 characters.");
  return { name: cleanName, organization: cleanOrg, email: cleanEmail, password: secret };
}

export function safeNext(value) {
  const next = String(value || "");
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "";
  return next;
}
