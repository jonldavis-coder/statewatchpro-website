import { freeFoiaAvailable, hasAnnualPerks, planLabel } from "./entitlements.js";
import { FOIA_PRODUCTS, MEMBER_PLANS, SALE_BADGE } from "./plans.js";
import { SAMPLE_ALERTS, SAMPLE_NOTE, SAMPLE_PANELS, SAMPLE_REPORT } from "./sample.js";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function formatWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toUTCString();
}

function nav(active) {
  const items = [
    ["dashboard", "/dashboard", "Dashboard"],
    ["alerts", "/alerts", "Alerts"],
    ["foia", "/foia", "FOIA"],
    ["reports", "/reports", "Reports"],
    ["account", "/account", "Account"],
    ["billing", "/billing", "Billing"],
    ["pricing", "/pricing", "Plans"],
  ];
  return `<aside class="sidenav" aria-label="Member">${items.map(([id, href, label]) =>
    `<a href="${href}"${active === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</aside>`;
}

export function layout({ title, user, entitled, active, body, cfg }) {
  const marketing = esc(cfg.marketingUrl);
  const accountBits = user
    ? `<span class="who">${esc(user.email)}</span><span class="chip">${esc(entitled ? planLabel(user.account || {}) : "No active plan")}</span>
       <form class="inline" method="post" action="/logout"><input type="hidden" name="csrf" value="${esc(user.csrf)}"><button class="linkish" type="submit">Sign out</button></form>`
    : `<a href="/login">Log in</a><a class="btn btn-primary btn-small" href="/signup">Create account</a>`;
  const shell = entitled
    ? `<div class="shell">${nav(active)}<div>${body}</div></div>`
    : body;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} · StateWatchPro</title>
<link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css">
</head><body>
<a class="skip" href="#main">Skip to main content</a>
<header class="hdr"><div class="wrap nav">
<a class="brand" href="${entitled ? "/dashboard" : marketing}"><img src="/logo.png" alt="StateWatchPro" width="152" height="48"></a>
<nav class="nav-links" aria-label="Account">${accountBits}<a href="${marketing}">Marketing site</a></nav>
</div></header>
<main id="main" class="page"><div class="wrap">${shell}</div></main>
<footer class="ftr"><div class="wrap"><span>© ${new Date().getUTCFullYear()} StateWatchPro</span><span><a href="${marketing}/privacy.html">Privacy</a> · <a href="${marketing}/terms.html">Terms</a> · <a href="mailto:hello@statewatchpro.com">hello@statewatchpro.com</a></span></div></footer>
</body></html>`;
}

function page(ctx, title, active, body) {
  const user = ctx.user ? { ...ctx.user, csrf: ctx.csrf, account: ctx.account } : null;
  return layout({
    title,
    user,
    entitled: ctx.entitled,
    active,
    body,
    cfg: ctx.cfg,
  });
}

function errorBox(message) {
  return message ? `<p class="error" role="alert">${esc(message)}</p>` : "";
}

export function signupPage(ctx) {
  const v = ctx.values || {};
  return page(ctx, "Create account", "", `<article class="card auth-card"><h1>Create your account</h1>
<p class="lede">Sign up, then choose a plan. Member pages open after payment.</p>
${errorBox(ctx.error)}
<form method="post" action="/signup">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<label>Name <input name="name" required autocomplete="name" value="${esc(v.name)}"></label>
<label>Email <input name="email" type="email" required autocomplete="email" value="${esc(v.email)}"></label>
<label>Organization <input name="organization" required autocomplete="organization" value="${esc(v.organization)}"></label>
<label>Password <input name="password" type="password" required autocomplete="new-password" minlength="8"></label>
<button class="btn btn-primary" type="submit">Create account</button>
</form>
<p class="note">Already registered? <a href="/login">Log in</a></p></article>`);
}

export function loginPage(ctx) {
  return page(ctx, "Log in", "", `<article class="card auth-card"><h1>Log in</h1>
${errorBox(ctx.error)}
<form method="post" action="/login">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<input type="hidden" name="next" value="${esc(ctx.next || "")}">
<label>Email <input name="email" type="email" required autocomplete="email" value="${esc(ctx.email || "")}"></label>
<label>Password <input name="password" type="password" required autocomplete="current-password"></label>
<button class="btn btn-primary" type="submit">Log in</button>
</form>
<p class="note"><a href="/forgot">Forgot password</a> · <a href="/signup">Create an account</a></p></article>`);
}

export function forgotPage(ctx) {
  return page(ctx, "Reset password", "", `<article class="card auth-card"><h1>Reset your password</h1>
${ctx.notice ? `<p class="banner" role="status">${esc(ctx.notice)}</p>` : ""}
${errorBox(ctx.error)}
<form method="post" action="/forgot">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<label>Email <input name="email" type="email" required autocomplete="email"></label>
<button class="btn btn-primary" type="submit">Send reset link</button>
</form></article>`);
}

export function resetPage(ctx) {
  return page(ctx, "Choose a new password", "", `<article class="card auth-card"><h1>Choose a new password</h1>
${errorBox(ctx.error)}
<form method="post" action="/reset">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<input type="hidden" name="token" value="${esc(ctx.token || "")}">
<label>New password <input name="password" type="password" required autocomplete="new-password" minlength="8"></label>
<button class="btn btn-primary" type="submit">Update password</button>
</form></article>`);
}

export function invitePage(ctx) {
  return page(ctx, "Accept invite", "", `<article class="card auth-card"><h1>Join ${esc(ctx.organization || "this account")}</h1>
<p class="lede">This seat was invited as ${esc(ctx.email)}. Choose a password to join that account.</p>
${errorBox(ctx.error)}
<form method="post" action="/invite/${esc(ctx.token)}">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<label>Name <input name="name" required autocomplete="name" value="${esc(ctx.values?.name || "")}"></label>
<label>Email <input name="email" type="email" required readonly value="${esc(ctx.email)}"></label>
<label>Organization <input name="organization" required value="${esc(ctx.values?.organization || ctx.organization || "")}"></label>
<label>Password <input name="password" type="password" required autocomplete="new-password" minlength="8"></label>
<button class="btn btn-primary" type="submit">Join account</button>
</form></article>`);
}

function planCard(ctx, plan) {
  const seats = plan.seats
    ? `<label>Seats <input class="seats" name="seats" type="number" min="1" max="200" value="1" required></label>`
    : `<input type="hidden" name="seats" value="1">`;
  let action = `<p class="note"><a href="/signup">Create an account</a> to buy this plan.</p>`;
  if (ctx.user && ctx.user.role !== "owner") {
    action = `<p class="note">Only the account owner can change the plan.</p>`;
  } else if (ctx.user) {
    action = `<form method="post" action="/checkout">
      <input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
      <input type="hidden" name="plan" value="${esc(plan.id)}">
      ${seats}
      <button class="btn btn-primary" type="submit">Continue to checkout</button>
    </form>`;
  }
  return `<article class="card plan"><span class="sale-badge">${esc(SALE_BADGE)}</span><h2>${esc(plan.name)}</h2>
<p class="price"><s class="was">${esc(plan.regular)}</s> ${esc(plan.sale)}</p>
<p class="note">${esc(plan.cadence)}</p><p>${esc(plan.blurb)}</p>${action}</article>`;
}

export function pricingPage(ctx) {
  const banner = ctx.checkout === "success"
    ? `<p class="banner" role="status">Checkout returned. Access updates when Stripe confirms the payment. Refresh in a moment.</p>`
    : ctx.checkout === "cancel"
      ? `<p class="banner" role="status">Checkout was canceled. No charge was made from that return.</p>`
      : "";
  const portal = ctx.user?.role === "owner" && ctx.account?.stripeCustomerId
    ? `<form method="post" action="/billing/portal"><input type="hidden" name="csrf" value="${esc(ctx.csrf)}"><button class="btn btn-ghost" type="submit">Manage billing in Stripe</button></form>`
    : "";
  const foia = FOIA_PRODUCTS.map((product) => {
    const button = ctx.user?.role === "owner"
      ? `<form method="post" action="/checkout"><input type="hidden" name="csrf" value="${esc(ctx.csrf)}"><input type="hidden" name="plan" value="${esc(product.id)}"><button class="btn btn-ghost" type="submit">Buy ${esc(product.sale)}</button></form>`
      : ctx.user
        ? `<p class="note">The account owner buys FOIA credits.</p>`
        : `<p class="note"><a href="/login?next=/pricing">Log in</a> to buy credits.</p>`;
    return `<article class="card"><h2>${esc(product.name)}</h2><p class="price">${esc(product.sale)}</p><p class="note">${esc(product.cadence)}</p><p>${esc(product.blurb)}</p>${button}</article>`;
  }).join("");
  return page(ctx, "Pricing", "pricing", `${banner}${errorBox(ctx.error)}
<h1>Plans</h1>
<p class="lede">Sale prices are charged at checkout. Regular prices are shown for comparison. The quarterly report, quarterly webinar, and one free FOIA request per year are annual only.</p>
<div class="plans">${MEMBER_PLANS.map((plan) => planCard(ctx, plan)).join("")}</div>
<h2 style="margin-top:1.6rem">FOIA filing add-on</h2>
<p class="lede">Credits are added to your account. Requests and records stay on your account and are not visible to other customers.</p>
<div class="grid-2">${foia}</div>
<div class="card" style="margin-top:1rem"><h2>Enterprise</h2><p>10 or more seats, invoicing, and a private briefing are arranged with sales. List pricing above is unchanged.</p>
<p><a class="btn btn-ghost" href="mailto:hello@statewatchpro.com?subject=StateWatchPro%20Enterprise%20plan">Contact sales</a></p>${portal}</div>`);
}

export function dashboardPage(ctx) {
  const panels = SAMPLE_PANELS.map((panel) => `<article class="panel"><h2>${esc(panel.title)}</h2><ul class="checks">${panel.rows.map((row) => `<li>${esc(row)}</li>`).join("")}</ul></article>`).join("");
  const until = ctx.account.accessUntil ? `Access through ${esc(formatWhen(ctx.account.accessUntil))}.` : "Access stays on while the subscription is active.";
  return page(ctx, "Dashboard", "dashboard", `<h1>Dashboard</h1>
<p class="lede">${esc(ctx.user.name)} · ${esc(ctx.user.organization)} · ${esc(planLabel(ctx.account))}. ${until}</p>
<p class="sample-banner"><span class="sample-flag">Sample data</span> ${esc(SAMPLE_NOTE)} Live search and collection are not on this desk yet.</p>
<div class="panel" style="margin-bottom:1rem"><h2>Activity trend</h2><p class="note">Sample chart, not a report of real spend or awards.</p>
<svg class="trend" viewBox="0 0 300 70" role="img" aria-label="Sample trend line"><polyline fill="none" stroke="#22d3ee" stroke-width="3" points="0,60 40,50 80,54 120,36 160,40 200,24 240,28 300,10"/></svg></div>
<div class="grid-2">${panels}</div>
<div class="card" style="margin-top:1rem"><h2>What this desk covers</h2><ul class="checks">
<li>AI cross-state search across the states you follow</li>
<li>Executive view of what is out for bid, just awarded, and trending</li>
<li>Competitive landscape and bidder league table</li>
<li>Proposal reference library and source provenance</li>
<li>Alerts for RFPs, amendments, deadlines, awards, renewals, and price changes</li>
</ul></div>`);
}

export function alertsPage(ctx) {
  const a = ctx.alerts;
  const box = (name, label, on) => `<label class="checkline"><input type="checkbox" name="${name}"${on ? " checked" : ""}> ${esc(label)}</label>`;
  const rows = SAMPLE_ALERTS.map((item) => `<tr><td>${esc(item.kind)}</td><td>${esc(item.text)}</td></tr>`).join("");
  const opt = (value, label) => `<option value="${value}"${a.digest === value ? " selected" : ""}>${label}</option>`;
  return page(ctx, "Alerts", "alerts", `<h1>Alerts and digests</h1>
<p class="lede">These settings are saved on your user. Delivery starts when live collection is connected.</p>
${ctx.notice ? `<p class="banner" role="status">${esc(ctx.notice)}</p>` : ""}
<form class="card" method="post" action="/alerts">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<label>Email digest <select name="digest">${opt("daily", "Daily")}${opt("weekly", "Weekly")}${opt("off", "Off")}</select></label>
${box("email", "Email me the digest", a.emailEnabled)}
${box("rfp", "New RFPs", a.rfp)}
${box("amendments", "Amendments", a.amendments)}
${box("deadlines", "Deadlines", a.deadlines)}
${box("awards", "Awards", a.awards)}
${box("renewals", "Renewals", a.renewals)}
${box("prices", "Price or cost changes", a.prices)}
<label>States to watch <input name="states" value="${esc(a.states)}" placeholder="Example: AR, TX"></label>
<button class="btn btn-primary" type="submit">Save settings</button>
</form>
<div class="card" style="margin-top:1rem"><h2>Sample digest</h2><p class="sample-banner"><span class="sample-flag">Sample data</span> ${esc(SAMPLE_NOTE)}</p>
<table><thead><tr><th>Type</th><th>Item</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

export function foiaPage(ctx) {
  const free = freeFoiaAvailable(ctx.account, ctx.now);
  const credits = ctx.account.foiaCredits;
  const options = [
    free ? `<option value="annual_free">Annual member free request</option>` : "",
    credits > 0 ? `<option value="paid">Use a paid credit (${credits} left)</option>` : "",
  ].join("");
  const form = options
    ? `<form class="card" method="post" action="/foia">
      <input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
      ${errorBox(ctx.error)}
      <label>Name <input name="name" required value="${esc(ctx.values?.name || ctx.user.name)}"></label>
      <label>Organization <input name="organization" required value="${esc(ctx.values?.organization || ctx.user.organization)}"></label>
      <label>Email <input name="email" type="email" required value="${esc(ctx.values?.email || ctx.user.email)}"></label>
      <div class="row-2"><label>State <input name="state" required value="${esc(ctx.values?.state || "")}"></label>
      <label>Agency <input name="agency" required value="${esc(ctx.values?.agency || "")}"></label></div>
      <label>Records sought <textarea name="records" required>${esc(ctx.values?.records || "")}</textarea></label>
      <div class="row-2"><label>Date range <input name="dates" value="${esc(ctx.values?.dates || "")}"></label>
      <label>Preferred format <select name="format"><option>No preference</option><option>Electronic</option><option>Paper</option></select></label></div>
      <label>Notes <textarea name="notes">${esc(ctx.values?.notes || "")}</textarea></label>
      <label>How this request is covered <select name="credit" required>${options}</select></label>
      <button class="btn btn-primary" type="submit">Submit request</button>
      </form>`
    : `<div class="card"><p>You need an annual free request or a paid FOIA credit before submitting. Monthly and trial plans do not include the yearly free request.</p><p><a href="/pricing">Buy FOIA credits</a></p></div>`;
  const rows = ctx.requests.length
    ? ctx.requests.map((row) => `<tr><td><a href="/foia/${esc(row.id)}">${esc(row.agency)}</a><div class="note">${esc(row.state)}</div></td><td>${esc(row.status)}</td><td>${esc(row.creditKind === "annual_free" ? "Annual free" : "Credit")}</td><td>${esc(formatWhen(row.createdAt))}</td></tr>`).join("")
    : `<tr><td colspan="4">No FOIA requests yet.</td></tr>`;
  const annualNote = hasAnnualPerks(ctx.account, ctx.now)
    ? (free ? "Your one free FOIA request for this year is available." : "The free FOIA request for this year is already used.")
    : "The yearly free FOIA request is for annual members. Monthly and trial members are not included.";
  return page(ctx, "FOIA requests", "foia", `<h1>FOIA requests</h1>
<p class="lede">${esc(annualNote)} Paid credits on this account: ${credits}.</p>
<div class="card" style="margin-bottom:1rem"><h2>Your requests stay on this account</h2><p>Your FOIA requests stay private. Any FOIA request you file, and the records you receive, are yours alone. They are never released to the rest of the platform or shared with any other users, including other people on the same seat plan.</p>
<p class="note">Staff draft the request, you have 48 hours to approve it or request changes, and then it is sent. Status updates appear on this list.</p></div>
${form}
<div class="card" style="margin-top:1rem"><h2>Your requests</h2>
<table><thead><tr><th>Agency</th><th>Status</th><th>Coverage</th><th>Submitted</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

export function foiaDetailPage(ctx) {
  const row = ctx.request;
  return page(ctx, "FOIA request", "foia", `<h1>${esc(row.agency)}</h1>
<p class="chip">${esc(row.status)}</p>
<dl class="card">
<div><dt>State</dt><dd>${esc(row.state)}</dd></div>
<div><dt>Records</dt><dd>${esc(row.records)}</dd></div>
<div><dt>Date range</dt><dd>${esc(row.dateRange || "Not specified")}</dd></div>
<div><dt>Format</dt><dd>${esc(row.format || "No preference")}</dd></div>
<div><dt>Notes</dt><dd>${esc(row.notes || "None")}</dd></div>
<div><dt>Coverage</dt><dd>${esc(row.creditKind === "annual_free" ? "Annual free request" : "Paid credit")}</dd></div>
</dl>
<p><a href="/foia">Back to requests</a></p>`);
}

export function reportsPage(ctx) {
  if (!hasAnnualPerks(ctx.account, ctx.now)) {
    return page(ctx, "Reports", "reports", `<h1>Reports</h1>
<div class="card"><h2>Annual members only</h2>
<p>The quarterly State Government Trends Report and the quarterly webinar are included for annual members. Monthly and trial memberships do not include them.</p>
<p><a class="btn btn-primary" href="/pricing">See annual pricing</a> <a class="btn btn-ghost" href="${esc(ctx.cfg.marketingUrl)}/reports.html">Free sample edition</a></p></div>`);
  }
  const cards = SAMPLE_REPORT.map((item) => `<article class="panel"><h2>${esc(item.title)}</h2><p>${esc(item.text)}</p></article>`).join("");
  return page(ctx, "Reports", "reports", `<h1>Quarterly report</h1>
<p class="lede">Annual membership includes the quarterly State Government Trends Report and the quarterly webinar. A live archive is not published in this desk yet.</p>
<p class="sample-banner"><span class="sample-flag">Sample data</span> Example layout only. Not a published report of real spend, awards, or prices.</p>
<div class="grid-2">${cards}</div>
<div class="card" style="margin-top:1rem"><h2>Quarterly webinar</h2>
<p>A quarterly webinar on trends and insights across state governments is included with the report. Dates are sent by email. This page does not show a live schedule yet.</p></div>`);
}

export function accountPage(ctx) {
  const members = ctx.members.map((member) => `<tr><td>${esc(member.name)}<div class="note">${esc(member.email)}</div></td><td>${esc(member.role)}</td><td>${member.disabled ? "Removed" : "Active"}</td><td>${
    ctx.user.role === "owner" && member.role !== "owner" && !member.disabled
      ? `<form method="post" action="/account/members/${esc(member.id)}/remove"><input type="hidden" name="csrf" value="${esc(ctx.csrf)}"><button class="btn btn-ghost btn-small" type="submit">Remove</button></form>`
      : ""
  }</td></tr>`).join("");
  const pending = ctx.invites.map((invite) => `<li>${esc(invite.email)} · expires ${esc(formatWhen(invite.expiresAt))}</li>`).join("");
  const canInvite = ctx.user.role === "owner" && ctx.entitled && (ctx.account.planId === "monthly" || ctx.account.planId === "annual");
  const invite = canInvite
    ? `<form method="post" action="/account/invites"><input type="hidden" name="csrf" value="${esc(ctx.csrf)}"><label>Invite email <input name="email" type="email" required></label><button class="btn btn-primary" type="submit">Send invite</button><p class="note">${ctx.seatsUsed} of ${ctx.account.seats} seats are taken, including pending invites. Trial plans cannot invite.</p></form>`
    : `<p class="note">Monthly and annual owners can invite people up to the seat quantity. Trial access is one user.</p>`;
  return page(ctx, "Account", "account", `<h1>Account</h1>
${ctx.notice ? `<p class="banner" role="status">${esc(ctx.notice)}</p>` : ""}${errorBox(ctx.error)}
<div class="grid-2"><article class="card"><h2>${esc(ctx.user.name)}</h2>
<p>${esc(ctx.user.email)}<br>${esc(ctx.user.organization)}</p>
<p>Plan: ${esc(planLabel(ctx.account))} · ${esc(ctx.account.status)}</p>
<p>FOIA credits: ${ctx.account.foiaCredits}</p></article>
<article class="card"><h2>Password</h2>
<form method="post" action="/account/password">
<input type="hidden" name="csrf" value="${esc(ctx.csrf)}">
<label>Current password <input name="current" type="password" required autocomplete="current-password"></label>
<label>New password <input name="password" type="password" required autocomplete="new-password" minlength="8"></label>
<button class="btn btn-ghost" type="submit">Change password</button>
</form></article></div>
<div class="card" style="margin-top:1rem"><h2>Seats</h2>${invite}
${pending ? `<ul class="checks">${pending}</ul>` : ""}
<table><thead><tr><th>Person</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${members}</tbody></table></div>`);
}

export function billingPage(ctx) {
  const until = ctx.account.accessUntil
    ? `Current access date: ${esc(formatWhen(ctx.account.accessUntil))}.`
    : "Access continues while the subscription is active and paid.";
  const portal = ctx.user.role === "owner" && ctx.account.stripeCustomerId
    ? `<form method="post" action="/billing/portal"><input type="hidden" name="csrf" value="${esc(ctx.csrf)}"><button class="btn btn-primary" type="submit">Open Stripe Customer Portal</button></form><p class="note">The portal is where you update the card, change seats, or cancel. Access ends when a subscription is canceled or unpaid.</p>`
    : `<p>A Stripe billing profile is created at checkout. ${ctx.user.role === "owner" ? "Buy a plan first." : "The account owner manages billing."}</p>`;
  return page(ctx, "Billing", "billing", `<h1>Billing</h1>
<div class="card"><p>Plan: ${esc(planLabel(ctx.account))} · status ${esc(ctx.account.status)} · ${ctx.account.seats} seat${ctx.account.seats === 1 ? "" : "s"}.</p>
<p>${until}</p>${portal}<p><a href="/pricing">Compare plans</a></p></div>`);
}

export function messagePage(ctx, title, message, statusNote = "") {
  return page(ctx, title, "", `<article class="card auth-card"><h1>${esc(title)}</h1><p>${esc(message)}</p>${statusNote}</article>`);
}
