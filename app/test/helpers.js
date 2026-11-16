import { once } from "node:events";
import { config } from "../src/config.js";
import { createMemoryDb } from "../src/db/memory.js";
import { createApp } from "../src/app.js";

export function testConfig(overrides = {}) {
  return config({
    NODE_ENV: "test",
    SESSION_SECRET: "test-session-secret-0123456789",
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret_value",
    MARKETING_URL: "https://statewatchpro.com",
    RATE_LIMIT_MAX: "100",
    ...overrides,
  });
}

export async function boot(options = {}) {
  const db = options.db || createMemoryDb();
  const sent = [];
  const mailer = options.mailer || {
    async send(message) {
      sent.push(message);
      return { delivered: "test" };
    },
  };
  const cfg = options.config || testConfig();
  const app = await createApp({ config: cfg, db, mailer, now: options.now });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  return {
    db,
    sent,
    cfg,
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

export function absorb(jar, response) {
  const list = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const line of list) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    if (/Max-Age=0/i.test(line)) delete jar[name];
    else jar[name] = decodeURIComponent(pair.slice(eq + 1));
  }
  return jar;
}

export function cookieHeader(jar) {
  return Object.entries(jar).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("; ");
}

let ipCount = 1;
export function nextIp() {
  ipCount += 1;
  return `198.51.100.${ipCount % 200}`;
}

export async function request(base, path, { method = "GET", jar = {}, form, ip, headers = {} } = {}) {
  const init = {
    method,
    headers: { ...headers, "x-forwarded-for": ip || nextIp() },
    redirect: "manual",
  };
  if (Object.keys(jar).length) init.headers.cookie = cookieHeader(jar);
  if (form) {
    init.headers["content-type"] = "application/x-www-form-urlencoded";
    init.body = new URLSearchParams(form);
  }
  const response = await fetch(`${base}${path}`, init);
  absorb(jar, response);
  return response;
}

export function csrfFrom(html) {
  const match = String(html).match(/name="csrf" value="([^"]+)"/);
  if (!match) throw new Error("CSRF token not found");
  return match[1];
}

export async function signup(base, fields, ip) {
  const jar = {};
  const page = await request(base, "/signup", { jar, ip });
  const html = await page.text();
  const response = await request(base, "/signup", {
    method: "POST",
    jar,
    ip,
    form: { csrf: csrfFrom(html), ...fields },
  });
  return { jar, response, html };
}
