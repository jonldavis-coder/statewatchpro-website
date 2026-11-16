import { createMemoryDb } from "./memory.js";
import { createPostgresDb } from "./postgres.js";

export async function openDatabase(cfg) {
  if (cfg.production && !cfg.databaseUrl) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (cfg.memory) return createMemoryDb();
  if (!cfg.databaseUrl) throw new Error("DATABASE_URL is required.");
  return createPostgresDb(cfg.databaseUrl);
}
