import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { appRoot } from "./paths.js";
import { createPool } from "./pg.js";

export async function migrate(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL is required to migrate.");
  const pool = createPool(connectionString);
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(867530901)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const dir = path.join(appRoot, "migrations");
    const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      const seen = await client.query("SELECT id FROM schema_migrations WHERE id = $1", [file]);
      if (seen.rowCount > 0) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(867530901)").catch(() => undefined);
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  const url = (process.env.DATABASE_URL || "").trim();
  migrate(url).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
