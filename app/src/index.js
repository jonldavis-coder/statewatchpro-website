import { createApp } from "./app.js";
import { config } from "./config.js";
import { migrate } from "./migrate.js";

const cfg = config();
if (!cfg.sessionSecret || cfg.sessionSecret.length < 16) {
  console.error("SESSION_SECRET must be at least 16 characters.");
  process.exit(1);
}
if (cfg.databaseUrl && !cfg.memory) {
  await migrate(cfg.databaseUrl);
}
const app = await createApp({ config: cfg });
const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`StateWatchPro member app listening on 0.0.0.0:${port}`);
});
