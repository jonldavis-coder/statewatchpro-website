import assert from "node:assert/strict";
import test from "node:test";
import { boot, csrfFrom, nextIp, request, signup, testConfig } from "./helpers.js";

const person = {
  name: "Ada Example",
  email: "ada@example.com",
  organization: "Example Office",
  password: "correct-horse",
};

test("sign up, sign in, sign out, and reject a missing CSRF token", async () => {
  const app = await boot();
  try {
    const ip = nextIp();
    const created = await signup(app.url, person, ip);
    assert.equal(created.response.status, 303);
    assert.equal(created.response.headers.get("location"), "/pricing");
    const cookies = created.response.headers.getSetCookie().join("\n");
    assert.match(cookies, /swp_session=/);
    assert.match(cookies, /HttpOnly/);
    assert.match(cookies, /SameSite=Lax/);
    const payload = JSON.parse(Buffer.from(created.jar.swp_session.split(".")[0], "base64url").toString());
    assert.equal(typeof payload.sub, "string");
    assert.equal(payload.csrf.length > 10, true);
    assert.equal(JSON.stringify(payload).includes("correct-horse"), false);

    const stored = await app.db.findUserByEmail(person.email);
    assert.match(stored.passwordHash, /^\$2[aby]\$/);
    assert.equal(stored.name, "Ada Example");
    assert.equal(stored.organization, "Example Office");
    assert.equal(stored.role, "owner");

    const dup = await signup(app.url, person, nextIp());
    assert.equal(dup.response.status, 400);
    assert.match(await dup.response.text(), /already exists/);

    const short = await signup(app.url, { ...person, email: "short@example.com", password: "short" }, nextIp());
    assert.equal(short.response.status, 400);
    assert.match(await short.response.text(), /8 to 200/);

    const loggedOut = await request(app.url, "/logout", { method: "POST", jar: created.jar, ip, form: { csrf: payload.csrf } });
    assert.equal(loggedOut.status, 303);
    assert.equal(created.jar.swp_session, undefined);

    const loginPage = await request(app.url, "/login", { jar: created.jar, ip });
    const loginHtml = await loginPage.text();
    const bad = await request(app.url, "/login", {
      method: "POST",
      jar: created.jar,
      ip,
      form: { email: person.email, password: "wrong-password", csrf: csrfFrom(loginHtml) },
    });
    assert.equal(bad.status, 400);

    const again = await request(app.url, "/login", { jar: created.jar, ip });
    const good = await request(app.url, "/login", {
      method: "POST",
      jar: created.jar,
      ip,
      form: { email: person.email, password: person.password, csrf: csrfFrom(await again.text()) },
    });
    assert.equal(good.status, 303);
    assert.equal(good.headers.get("location"), "/pricing");

    const noCsrf = await request(app.url, "/login", {
      method: "POST",
      jar: {},
      ip: nextIp(),
      form: { email: person.email, password: person.password },
    });
    assert.equal(noCsrf.status, 403);

    const health = await request(app.url, "/healthz");
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    const home = await request(app.url, "/login");
    assert.match(home.headers.get("content-security-policy"), /default-src 'self'/);
  } finally {
    await app.close();
  }
});

test("password reset link works once and an expired token does not", async () => {
  const app = await boot();
  try {
    const ip = nextIp();
    const created = await signup(app.url, { ...person, email: "reset@example.com" }, ip);
    const session = JSON.parse(Buffer.from(created.jar.swp_session.split(".")[0], "base64url").toString());
    await request(app.url, "/logout", { method: "POST", jar: created.jar, ip, form: { csrf: session.csrf } });

    const forgotPage = await request(app.url, "/forgot", { jar: created.jar, ip });
    const forgot = await request(app.url, "/forgot", {
      method: "POST",
      jar: created.jar,
      ip,
      form: { csrf: csrfFrom(await forgotPage.text()), email: "reset@example.com" },
    });
    assert.equal(forgot.status, 200);
    assert.match(await forgot.text(), /reset link is on its way/);
    assert.equal(app.sent.length, 1);
    const link = app.sent[0].text.match(/https?:\/\/\S+/)[0];
    const token = new URL(link).searchParams.get("token");
    assert.ok(token);

    const resetPage = await request(app.url, `/reset?token=${encodeURIComponent(token)}`, { jar: created.jar, ip });
    const resetHtml = await resetPage.text();
    const reset = await request(app.url, "/reset", {
      method: "POST",
      jar: created.jar,
      ip,
      form: { csrf: csrfFrom(resetHtml), token, password: "new-password-9" },
    });
    assert.equal(reset.status, 303);

    const reused = await request(app.url, "/reset", {
      method: "POST",
      jar: {},
      ip,
      form: { csrf: csrfFrom(resetHtml), token, password: "another-password" },
    });
    assert.equal(reused.status, 403);

    const fresh = {};
    const page = await request(app.url, "/reset?token=nope", { jar: fresh, ip: nextIp() });
    const stale = await request(app.url, "/reset", {
      method: "POST",
      jar: fresh,
      ip: nextIp(),
      form: { csrf: csrfFrom(await page.text()), token, password: "another-password" },
    });
    assert.equal(stale.status, 400);
    assert.match(await stale.text(), /invalid or expired/);

    const loginJar = {};
    const loginIp = nextIp();
    const loginPage = await request(app.url, "/login", { jar: loginJar, ip: loginIp });
    const oldPassword = await request(app.url, "/login", {
      method: "POST",
      jar: loginJar,
      ip: loginIp,
      form: { csrf: csrfFrom(await loginPage.text()), email: "reset@example.com", password: person.password },
    });
    assert.equal(oldPassword.status, 400);
    const loginPage2 = await request(app.url, "/login", { jar: loginJar, ip: loginIp });
    const newPassword = await request(app.url, "/login", {
      method: "POST",
      jar: loginJar,
      ip: loginIp,
      form: { csrf: csrfFrom(await loginPage2.text()), email: "reset@example.com", password: "new-password-9" },
    });
    assert.equal(newPassword.status, 303);

    const user = await app.db.findUserByEmail("reset@example.com");
    const expired = await app.db.createReset(user.id, -1000);
    assert.equal(await app.db.takeReset(expired), null);
  } finally {
    await app.close();
  }
});

test("auth routes are rate limited and reset mail is logged when SMTP is unset", async () => {
  const logs = [];
  const app = await boot({
    config: testConfig({ RATE_LIMIT_MAX: "2" }),
    mailer: {
      async send(message) {
        logs.push(message);
      },
    },
  });
  const { createMailer } = await import("../src/mailer.js");
  const logged = [];
  await createMailer({ smtp: { host: "", port: 587, user: "", pass: "", from: "StateWatchPro <hello@statewatchpro.com>" } }, {
    info(line) { logged.push(line); },
  }).send({ to: "ada@example.com", subject: "Reset", text: "https://app.statewatchpro.com/reset?token=abc" });
  assert.match(logged[0], /SMTP is not configured/);
  assert.match(logged[0], /token=abc/);

  try {
    const ip = nextIp();
    const jar = {};
    const page = await request(app.url, "/login", { jar, ip });
    const token = csrfFrom(await page.text());
    const form = { csrf: token, email: "missing@example.com", password: "not-a-real-password" };
    assert.equal((await request(app.url, "/login", { method: "POST", jar, ip, form })).status, 400);
    assert.equal((await request(app.url, "/login", { method: "POST", jar, ip, form })).status, 400);
    const blocked = await request(app.url, "/login", { method: "POST", jar, ip, form });
    assert.equal(blocked.status, 429);
  } finally {
    await app.close();
  }
});

test("organization names are escaped", async () => {
  const app = await boot();
  try {
    const ip = nextIp();
    const created = await signup(app.url, {
      ...person,
      email: "xss@example.com",
      organization: `<script>alert("x")</script>`,
    }, ip);
    assert.equal(created.response.status, 303);
    const user = await app.db.findUserByEmail("xss@example.com");
    const account = await app.db.getAccount(user.accountId);
    await app.db.updateAccount(account.id, { planId: "monthly", status: "active", seats: 1, accessUntil: null });
    const accountPage = await request(app.url, "/account", { jar: created.jar, ip });
    const html = await accountPage.text();
    assert.equal(accountPage.status, 200);
    assert.match(html, /&lt;script&gt;/);
    assert.equal(html.includes("<script>"), false);
  } finally {
    await app.close();
  }
});
