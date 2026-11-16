const PRICE_DEFAULTS = {
  trial: "price_1UcE1fFhnOoFBQrwd8cVFFG9",
  trialRegular: "price_1UcE1fFhnOoFBQrwOqISK7d5",
  monthly: "price_1UcE1gFhnOoFBQrw2EFjpFps",
  monthlyRegular: "price_1UcE1gFhnOoFBQrwrhZ3SrfE",
  annual: "price_1UcE1hFhnOoFBQrwdPReAMdZ",
  annualRegular: "price_1UcE1iFhnOoFBQrw9OsvEnuh",
  foia: "price_1UcE1iFhnOoFBQrwKX1zsL4K",
  foia5: "price_1UcE1jFhnOoFBQrwgRAVQyAN",
};

function read(env, key, fallback = "") {
  const value = env[key];
  if (value == null || String(value).trim() === "") return fallback;
  return String(value).trim();
}

export function config(env = process.env) {
  const databaseUrl = read(env, "DATABASE_URL");
  const production = env.NODE_ENV === "production";
  const secret = read(env, "SESSION_SECRET");
  return {
    env: env.NODE_ENV || "development",
    production,
    databaseUrl,
    sessionSecret: secret,
    stripeSecretKey: read(env, "STRIPE_SECRET_KEY"),
    stripeWebhookSecret: read(env, "STRIPE_WEBHOOK_SECRET"),
    appUrl: read(env, "APP_URL").replace(/\/$/, ""),
    marketingUrl: read(env, "MARKETING_URL", "https://statewatchpro.com").replace(/\/$/, ""),
    cookieSecure: read(env, "COOKIE_SECURE") === "true",
    memory: production ? false : read(env, "SWP_MEMORY") === "1" || !databaseUrl,
    rateLimitMax: Number(read(env, "RATE_LIMIT_MAX", "10")) || 10,
    rateLimitWindowMs: Number(read(env, "RATE_LIMIT_WINDOW_MS", String(15 * 60 * 1000))) || 15 * 60 * 1000,
    prices: {
      trial: read(env, "STRIPE_PRICE_TRIAL", PRICE_DEFAULTS.trial),
      trialRegular: read(env, "STRIPE_PRICE_TRIAL_REGULAR", PRICE_DEFAULTS.trialRegular),
      monthly: read(env, "STRIPE_PRICE_MONTHLY", PRICE_DEFAULTS.monthly),
      monthlyRegular: read(env, "STRIPE_PRICE_MONTHLY_REGULAR", PRICE_DEFAULTS.monthlyRegular),
      annual: read(env, "STRIPE_PRICE_ANNUAL", PRICE_DEFAULTS.annual),
      annualRegular: read(env, "STRIPE_PRICE_ANNUAL_REGULAR", PRICE_DEFAULTS.annualRegular),
      foia: read(env, "STRIPE_PRICE_FOIA", PRICE_DEFAULTS.foia),
      foia5: read(env, "STRIPE_PRICE_FOIA_5PACK", PRICE_DEFAULTS.foia5),
    },
    smtp: {
      host: read(env, "SMTP_HOST"),
      port: Number(read(env, "SMTP_PORT", "587")) || 587,
      user: read(env, "SMTP_USER"),
      pass: env.SMTP_PASS || "",
      from: read(env, "SMTP_FROM", "StateWatchPro <hello@statewatchpro.com>"),
    },
  };
}

export function publicOrigin(req, cfg) {
  if (cfg.appUrl) return cfg.appUrl;
  return `${req.protocol}://${req.get("host")}`;
}
