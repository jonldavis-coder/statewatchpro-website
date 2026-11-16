import pg from "pg";

export function sslFor(connectionString) {
  if (!connectionString) return false;
  if (/localhost|127\.0\.0\.1/.test(connectionString)) return false;
  if (connectionString.includes(".internal")) return false;
  if (/sslmode=disable/.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

export function createPool(connectionString) {
  return new pg.Pool({
    connectionString,
    ssl: sslFor(connectionString),
    max: 10,
  });
}
