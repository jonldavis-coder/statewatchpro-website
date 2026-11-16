import path from "node:path";
import express from "express";
import helmet from "helmet";
import { config, publicOrigin } from "./config.js";
import { openDatabase } from "./db/index.js";
import { HttpError } from "./errors.js";
import { freeFoiaAvailable, hasAnnualPerks, isEntitled } from "./entitlements.js";
import { createMailer } from "./mailer.js";
import { hashPassword, passwordMatches } from "./passwords.js";
import { appRoot } from "./paths.js";
import { checkoutSpec, parseSeats } from "./plans.js";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  clearCookie,
  cookieSecure,
  createSessionToken,
  csrfOk,
  newCsrf,
  readCookie,
  setCookie,
  touchSession,
  readSession,
} from "./session.js";
import { applyStripeEvent, checkoutParams, stripeRequest, verifyStripeSignature } from "./stripe.js";
import { cleanMultiline, cleanText, normalizeEmail, requireAccountFields, safeNext } from "./validate.js";
import {
  accountPage,
  alertsPage,
  billingPage,
  dashboardPage,
  foiaDetailPage,
  foiaPage,
  forgotPage,
  invitePage,
  loginPage,
  messagePage,
  pricingPage,
  reportsPage,
  resetPage,
  signupPage,
} from "./views.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function send(res, status, html) {
  res.status(status).set("Cache-Control", "no-store").type("html").send(html);
}

export async function createApp(options = {}) {
  const cfg = options.config || config();
  if (!cfg.sessionSecret || cfg.sessionSecret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters.");
  }
  const db = options.db || await openDatabase(cfg);
  const mailer = options.mailer || createMailer(cfg);
  const now = options.now || (() => new Date());
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        formAction: ["'self'", "https://checkout.stripe.com", "https://billing.stripe.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  }));
  app.use((req, res, next) => {
    res.set("X-Robots-Tag", "noindex");
    next();
  });
  app.use(express.static(path.join(appRoot, "public"), { maxAge: "1h" }));

  const secure = (req) => cookieSecure(req, cfg);
  const clock = () => now();

  function startSession(req, res, userId) {
    const token = createSessionToken(userId, cfg.sessionSecret, Date.now());
    setCookie(res, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secure(req),
      maxAge: 14 * 24 * 60 * 60,
    });
  }

  function csrfToken(req, res) {
    if (req.session?.csrf) return req.session.csrf;
    let token = readCookie(req.get("cookie"), CSRF_COOKIE);
    if (!token) {
      token = newCsrf();
      setCookie(res, CSRF_COOKIE, token, { httpOnly: true, secure: secure(req), maxAge: 2 * 60 * 60 });
    }
    return token;
  }

  function ctx(req, res, extra = {}) {
    return {
      cfg,
      user: req.user,
      account: req.account,
      entitled: isEntitled(req.account, clock()),
      csrf: csrfToken(req, res),
      now: clock(),
      ...extra,
    };
  }

  function originAllowed(req) {
    const origin = req.get("origin");
    if (!origin) return true;
    const host = `${req.protocol}://${req.get("host")}`;
    return origin === host || (cfg.appUrl && origin === cfg.appUrl);
  }

  function limiter(name) {
    const hits = new Map();
    return (req, res, next) => {
      const key = `${name}:${req.ip}`;
      const at = Date.now();
      const recent = (hits.get(key) || []).filter((stamp) => at - stamp < cfg.rateLimitWindowMs);
      if (recent.length >= cfg.rateLimitMax) {
        res.set("Retry-After", String(Math.ceil(cfg.rateLimitWindowMs / 1000)));
        return send(res, 429, messagePage(ctx(req, res), "Slow down", "Too many attempts. Wait and try again."));
      }
      recent.push(at);
      hits.set(key, recent);
      next();
    };
  }

  const limitSignup = limiter("signup");
  const limitLogin = limiter("login");
  const limitForgot = limiter("forgot");
  const limitReset = limiter("reset");

  function requireUser(req, res, next) {
    if (!req.user) {
      const nextUrl = safeNext(req.originalUrl);
      return res.redirect(`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`);
    }
    next();
  }

  function requireMember(req, res, next) {
    if (!req.user) return requireUser(req, res, next);
    if (!isEntitled(req.account, clock())) return res.redirect("/pricing");
    next();
  }

  function requireOwner(req, res, next) {
    if (!req.user) return requireUser(req, res, next);
    if (req.user.role !== "owner") {
      return send(res, 403, messagePage(ctx(req, res), "Owners only", "Only the account owner can do that."));
    }
    next();
  }

  app.get("/healthz", wrap(async (req, res) => {
    try {
      await db.ping();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  }));

  app.post("/stripe/webhook", express.raw({ type: "*/*", limit: "1mb" }), wrap(async (req, res) => {
    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
    const header = req.get("stripe-signature") || "";
    if (!cfg.stripeWebhookSecret || !verifyStripeSignature(payload, header, cfg.stripeWebhookSecret)) {
      return res.status(400).json({ error: "Invalid signature" });
    }
    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "Invalid payload" });
    }
    if (!event?.id || !event.type) return res.status(400).json({ error: "Missing event id" });
    const fresh = await db.claimStripeEvent(String(event.id));
    if (!fresh) return res.json({ ok: true, duplicate: true });
    try {
      await applyStripeEvent(db, event, { prices: cfg.prices, now: clock() });
    } catch (error) {
      await db.releaseStripeEvent(String(event.id));
      console.error(`stripe webhook failed ${event.type} ${event.id}`);
      return res.status(500).json({ error: "Webhook failed" });
    }
    res.json({ ok: true });
  }));

  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(wrap(async (req, res, next) => {
    req.session = null;
    req.user = null;
    req.account = null;
    const payload = readSession(readCookie(req.get("cookie"), SESSION_COOKIE), cfg.sessionSecret, Date.now());
    if (payload) {
      const user = await db.findUserById(payload.sub);
      if (user && !user.disabled) {
        req.session = payload;
        req.user = user;
        req.account = await db.getAccount(user.accountId);
        const refreshed = touchSession(payload, cfg.sessionSecret, Date.now());
        if (refreshed) {
          setCookie(res, SESSION_COOKIE, refreshed, {
            httpOnly: true,
            secure: secure(req),
            maxAge: 14 * 24 * 60 * 60,
          });
        }
      }
    }
    next();
  }));
  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
    if (!originAllowed(req) || !csrfOk(req, req.session)) {
      return send(res, 403, messagePage(ctx(req, res), "Form expired", "The form expired. Go back and try again."));
    }
    next();
  });

  app.get("/", (req, res) => {
    if (!req.user) return res.redirect("/login");
    if (!isEntitled(req.account, clock())) return res.redirect("/pricing");
    res.redirect("/dashboard");
  });

  app.get("/signup", (req, res) => {
    if (req.user) return res.redirect(isEntitled(req.account, clock()) ? "/dashboard" : "/pricing");
    send(res, 200, signupPage(ctx(req, res)));
  });

  app.post("/signup", limitSignup, wrap(async (req, res) => {
    try {
      const fields = requireAccountFields(req.body);
      if (await db.findUserByEmail(fields.email)) {
        throw new HttpError(400, "An account with that email already exists.");
      }
      const { user } = await db.createOwner({
        name: fields.name,
        email: fields.email,
        organization: fields.organization,
        passwordHash: hashPassword(fields.password),
      });
      startSession(req, res, user.id);
      res.redirect(303, "/pricing");
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      send(res, error.status, signupPage(ctx(req, res, { error: error.message, values: req.body })));
    }
  }));

  app.get("/login", (req, res) => {
    if (req.user) return res.redirect(isEntitled(req.account, clock()) ? "/dashboard" : "/pricing");
    send(res, 200, loginPage(ctx(req, res, { next: safeNext(req.query.next) })));
  });

  app.post("/login", limitLogin, wrap(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = email ? await db.findUserByEmail(email) : null;
    if (!user || user.disabled || !passwordMatches(String(req.body.password || ""), user.passwordHash)) {
      return send(res, 400, loginPage(ctx(req, res, {
        error: "Email or password is incorrect.",
        email,
        next: safeNext(req.body.next),
      })));
    }
    startSession(req, res, user.id);
    const account = await db.getAccount(user.accountId);
    const entitled = isEntitled(account, clock());
    const next = safeNext(req.body.next);
    res.redirect(303, entitled ? (next || "/dashboard") : "/pricing");
  }));

  app.post("/logout", (req, res) => {
    clearCookie(res, SESSION_COOKIE, secure(req));
    clearCookie(res, CSRF_COOKIE, secure(req));
    res.redirect(303, "/login");
  });

  app.get("/forgot", (req, res) => send(res, 200, forgotPage(ctx(req, res))));

  app.post("/forgot", limitForgot, wrap(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = email ? await db.findUserByEmail(email) : null;
    if (user && !user.disabled) {
      const token = await db.createReset(user.id);
      const url = `${publicOrigin(req, cfg)}/reset?token=${encodeURIComponent(token)}`;
      await mailer.send({
        to: user.email,
        subject: "Reset your StateWatchPro password",
        text: `Reset your StateWatchPro password. This link expires in one hour.\n\n${url}\n\nIf you did not ask for this, you can ignore the email.`,
      });
    }
    send(res, 200, forgotPage(ctx(req, res, {
      notice: "If an account exists for that email, a reset link is on its way.",
    })));
  }));

  app.get("/reset", (req, res) => {
    send(res, 200, resetPage(ctx(req, res, { token: String(req.query.token || "") })));
  });

  app.post("/reset", limitReset, wrap(async (req, res) => {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (password.length < 8 || password.length > 200) {
      return send(res, 400, resetPage(ctx(req, res, { token, error: "Password must be 8 to 200 characters." })));
    }
    const userId = await db.takeReset(token);
    if (!userId) {
      return send(res, 400, resetPage(ctx(req, res, { error: "This reset link is invalid or expired." })));
    }
    await db.setPassword(userId, hashPassword(password));
    startSession(req, res, userId);
    const user = await db.findUserById(userId);
    const account = user ? await db.getAccount(user.accountId) : null;
    res.redirect(303, isEntitled(account, clock()) ? "/dashboard" : "/pricing");
  }));

  app.get("/pricing", (req, res) => {
    send(res, 200, pricingPage(ctx(req, res, { checkout: String(req.query.checkout || ""), error: "" })));
  });

  app.post("/checkout", requireOwner, wrap(async (req, res) => {
    const planId = String(req.body.plan || "");
    const seats = parseSeats(req.body.seats, planId);
    const spec = seats ? checkoutSpec(planId, seats, cfg.prices) : null;
    if (!spec?.price) {
      return send(res, 400, pricingPage(ctx(req, res, { error: "Choose a plan." })));
    }
    if (!cfg.stripeSecretKey) {
      return send(res, 503, pricingPage(ctx(req, res, { error: "Stripe is not configured. No charge was made." })));
    }
    const session = await stripeRequest(cfg.stripeSecretKey, "checkout/sessions", checkoutParams({
      spec: { ...spec, planId },
      user: req.user,
      origin: publicOrigin(req, cfg),
      customerId: req.account.stripeCustomerId,
    }));
    if (!session.url || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) {
      throw new HttpError(502, "Checkout did not return a Stripe URL.");
    }
    res.redirect(303, session.url);
  }));

  app.get("/dashboard", requireMember, (req, res) => send(res, 200, dashboardPage(ctx(req, res))));

  app.get("/alerts", requireMember, wrap(async (req, res) => {
    const alerts = await db.getAlerts(req.user.id);
    send(res, 200, alertsPage(ctx(req, res, {
      alerts,
      notice: req.query.saved ? "Alert settings saved." : "",
    })));
  }));

  app.post("/alerts", requireMember, wrap(async (req, res) => {
    const digest = ["off", "daily", "weekly"].includes(req.body.digest) ? req.body.digest : "daily";
    const on = (key) => req.body[key] === "on";
    await db.saveAlerts(req.user.id, {
      digest,
      emailEnabled: on("email"),
      rfp: on("rfp"),
      amendments: on("amendments"),
      deadlines: on("deadlines"),
      awards: on("awards"),
      renewals: on("renewals"),
      prices: on("prices"),
      states: String(req.body.states || "").replace(/\s+/g, " ").trim().slice(0, 200),
    });
    res.redirect(303, "/alerts?saved=1");
  }));

  app.get("/foia", requireMember, wrap(async (req, res) => {
    const requests = await db.listFoia(req.account.id, req.user.id);
    send(res, 200, foiaPage(ctx(req, res, { requests })));
  }));

  app.post("/foia", requireMember, wrap(async (req, res) => {
    const kind = String(req.body.credit || "");
    const values = req.body;
    const requests = () => db.listFoia(req.account.id, req.user.id);
    const fail = async (message) => send(res, 400, foiaPage(ctx(req, res, {
      error: message,
      values,
      requests: await requests(),
    })));
    if (kind === "annual_free" && !freeFoiaAvailable(req.account, clock())) {
      return fail("The yearly free FOIA request is for annual members and can be used once per year.");
    }
    if (kind === "paid" && req.account.foiaCredits < 1) return fail("No FOIA credits remaining.");
    if (kind !== "annual_free" && kind !== "paid") return fail("Choose how this request is covered.");
    const name = cleanText(req.body.name, 80);
    const organization = cleanText(req.body.organization, 160);
    const email = normalizeEmail(req.body.email);
    const state = cleanText(req.body.state, 80);
    const agency = cleanText(req.body.agency, 160);
    const records = cleanMultiline(req.body.records, 5000);
    if (!name || !organization || !email || !state || !agency || !records) {
      return fail("Fill in name, organization, email, state, agency, and the records you want.");
    }
    const format = ["No preference", "Electronic", "Paper"].includes(req.body.format) ? req.body.format : "No preference";
    const result = await db.submitFoia({
      accountId: req.account.id,
      userId: req.user.id,
      kind,
      year: clock().getUTCFullYear(),
      name,
      organization,
      email,
      state,
      agency,
      records,
      dateRange: String(req.body.dates || "").trim().slice(0, 120),
      format,
      notes: String(req.body.notes || "").trim().slice(0, 2000),
    });
    if (!result.ok) return fail(result.error);
    res.redirect(303, `/foia/${result.id}`);
  }));

  app.get("/foia/:id", requireMember, wrap(async (req, res) => {
    const request = await db.getFoia(req.account.id, req.user.id, req.params.id);
    if (!request) return send(res, 404, messagePage(ctx(req, res), "Not found", "That FOIA request is not on this account."));
    send(res, 200, foiaDetailPage(ctx(req, res, { request })));
  }));

  app.get("/reports", requireMember, (req, res) => {
    send(res, 200, reportsPage(ctx(req, res)));
  });

  app.get("/account", requireMember, wrap(async (req, res) => {
    send(res, 200, accountPage(ctx(req, res, await accountProps(req))));
  }));

  app.post("/account/password", requireMember, wrap(async (req, res) => {
    const password = String(req.body.password || "");
    const props = await accountProps(req);
    if (!passwordMatches(String(req.body.current || ""), req.user.passwordHash)) {
      return send(res, 400, accountPage(ctx(req, res, { ...props, error: "Current password is incorrect." })));
    }
    if (password.length < 8 || password.length > 200) {
      return send(res, 400, accountPage(ctx(req, res, { ...props, error: "Password must be 8 to 200 characters." })));
    }
    await db.setPassword(req.user.id, hashPassword(password));
    res.redirect(303, "/account?password=1");
  }));

  app.post("/account/invites", requireMember, wrap(async (req, res) => {
    const props = await accountProps(req);
    const fail = (message) => send(res, 400, accountPage(ctx(req, res, { ...props, error: message })));
    if (req.user.role !== "owner") return fail("Only the account owner can invite seats.");
    if (!hasAnnualPerks(req.account, clock()) && req.account.planId !== "monthly") {
      return fail("Trial access is one user. Monthly and annual owners can invite seats.");
    }
    const email = normalizeEmail(req.body.email);
    if (!email) return fail("Enter a valid email.");
    if (await db.findUserByEmail(email)) return fail("That email already has an account.");
    const occupied = await db.countOccupiedSeats(req.account.id);
    if (occupied >= req.account.seats) return fail("All seats are in use.");
    const token = await db.createInvite({ accountId: req.account.id, email });
    const url = `${publicOrigin(req, cfg)}/invite/${token}`;
    await mailer.send({
      to: email,
      subject: "You are invited to StateWatchPro",
      text: `${req.user.name} invited you to their StateWatchPro account.\n\n${url}\n\nThis link expires in 7 days.`,
    });
    res.redirect(303, "/account?invited=1");
  }));

  app.post("/account/members/:id/remove", requireMember, wrap(async (req, res) => {
    if (req.user.role !== "owner") {
      return send(res, 403, messagePage(ctx(req, res), "Owners only", "Only the account owner can remove a seat."));
    }
    await db.disableMember(req.account.id, req.params.id);
    res.redirect(303, "/account");
  }));

  app.get("/invite/:token", wrap(async (req, res) => {
    const invite = await db.getInvite(req.params.token);
    if (!invite) return send(res, 400, messagePage(ctx(req, res), "Invite unavailable", "This invite is invalid or expired."));
    const members = await db.listMembers(invite.accountId);
    const owner = members.find((member) => member.role === "owner");
    send(res, 200, invitePage(ctx(req, res, {
      token: req.params.token,
      email: invite.email,
      organization: owner?.organization || "",
    })));
  }));

  app.post("/invite/:token", wrap(async (req, res) => {
    const invite = await db.getInvite(req.params.token);
    if (!invite) return send(res, 400, messagePage(ctx(req, res), "Invite unavailable", "This invite is invalid or expired."));
    const members = await db.listMembers(invite.accountId);
    const owner = members.find((member) => member.role === "owner");
    const again = (error, values) => send(res, 400, invitePage(ctx(req, res, {
      token: req.params.token,
      email: invite.email,
      organization: owner?.organization || "",
      error,
      values,
    })));
    let fields;
    try {
      fields = requireAccountFields({ ...req.body, email: invite.email });
    } catch (error) {
      if (error instanceof HttpError) return again(error.message, req.body);
      throw error;
    }
    if (normalizeEmail(req.body.email) !== invite.email) return again("Use the invited email address.", req.body);
    const account = await db.getAccount(invite.accountId);
    if (!isEntitled(account, clock()) || (account.planId !== "monthly" && account.planId !== "annual")) {
      return again("That membership cannot add a seat right now.", req.body);
    }
    if (await db.countOccupiedSeats(account.id) > account.seats) return again("That account has no open seat.", req.body);
    const member = await db.createMember({
      accountId: account.id,
      name: fields.name,
      email: invite.email,
      organization: fields.organization,
      passwordHash: hashPassword(fields.password),
    });
    await db.acceptInvite(req.params.token);
    startSession(req, res, member.id);
    res.redirect(303, "/dashboard");
  }));

  app.get("/billing", requireMember, (req, res) => send(res, 200, billingPage(ctx(req, res))));

  app.post("/billing/portal", requireOwner, wrap(async (req, res) => {
    if (!cfg.stripeSecretKey || !req.account.stripeCustomerId) {
      return send(res, 400, pricingPage(ctx(req, res, {
        error: "Stripe billing is not available for this account yet. No change was made.",
      })));
    }
    const session = await stripeRequest(cfg.stripeSecretKey, "billing_portal/sessions", new URLSearchParams({
      customer: req.account.stripeCustomerId,
      return_url: `${publicOrigin(req, cfg)}/billing`,
    }));
    if (!session.url || !/^https:\/\/billing\.stripe\.com\//.test(session.url)) {
      throw new HttpError(502, "The billing portal did not return a Stripe URL.");
    }
    res.redirect(303, session.url);
  }));

  async function accountProps(req) {
    const [members, invites, seatsUsed] = await Promise.all([
      db.listMembers(req.account.id),
      db.listPendingInvites(req.account.id),
      db.countOccupiedSeats(req.account.id),
    ]);
    const notice = req.query.password ? "Password updated." : req.query.invited ? "Invite sent." : "";
    return {
      members: members.map(({ passwordHash, ...member }) => member),
      invites,
      seatsUsed,
      notice,
    };
  }

  app.use((req, res) => send(res, 404, messagePage(ctx(req, res), "Not found", "That page is not part of the member app.")));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error(error instanceof Error ? error.message : "request failed");
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : "Something went wrong.";
    send(res, status, messagePage({
      cfg,
      user: req.user,
      account: req.account,
      entitled: isEntitled(req.account, clock()),
      csrf: req.session?.csrf || "",
    }, status === 500 ? "Something went wrong" : "Request failed", message));
  });

  return app;
}
