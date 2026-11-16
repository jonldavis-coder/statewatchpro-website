import { createHash, randomBytes } from "node:crypto";

export function newId(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
