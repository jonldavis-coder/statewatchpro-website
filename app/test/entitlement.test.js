import assert from "node:assert/strict";
import test from "node:test";
import { boot, csrfFrom, nextIp, request, signup } from "./helpers.js";

async function member(app, email, patch) {
  const ip = nextIp();
  const created = await signup(app.url, {
    name: "Ada Example",
    email,
    organization: "Example Office",
    password: "correct-horse",
  }, ip);
  assert.equal(created.response.status, 303);
  const user = await app.db.findUserByEmail(email);
  await app.db.updateAccount(user.accountId, {
    planId: "monthly",
    status: "active",
    seats: 1,
    accessUntil: null,
    foiaCredits: 0,
    ...patch,
  });
  return { ip, jar: created.jar, user };
}

test("member pages require a signed-in user and an active entitlement", async () => {
  const app = await boot();
  try {
    const anon = await request(app.url, "/dashboard");
    assert.equal(anon.status, 302);
    assert.match(anon.headers.get("location"), /^\/login/);

    const unpaid = await signup(app.url, {
      name: "Bea Example",
      email: "bea@example.com",
      organization: "Example Office",
      password: "correct-horse",
    }, nextIp());
    const gated = await request(app.url, "/dashboard", { jar: unpaid.jar });
    assert.equal(gated.status, 302);
    assert.equal(gated.headers.get("location"), "/pricing");
    assert.equal((await request(app.url, "/billing", { jar: unpaid.jar })).headers.get("location"), "/pricing");

    const expired = await member(app, "trial@example.com", {
      planId: "trial",
      accessUntil: new Date(Date.now() - 60_000).toISOString(),
    });
    assert.equal((await request(app.url, "/alerts", { jar: expired.jar, ip: expired.ip })).status, 302);

    const pastDue = await member(app, "due@example.com", { status: "past_due" });
    assert.equal((await request(app.url, "/reports", { jar: pastDue.jar, ip: pastDue.ip })).headers.get("location"), "/pricing");

    const monthly = await member(app, "month@example.com", { planId: "monthly", seats: 2 });
    const dash = await request(app.url, "/dashboard", { jar: monthly.jar, ip: monthly.ip });
    const dashHtml = await dash.text();
    assert.equal(dash.status, 200);
    assert.match(dashHtml, /Sample data/);
    assert.match(dashHtml, /Out for bid/);

    const reports = await request(app.url, "/reports", { jar: monthly.jar, ip: monthly.ip });
    const reportsHtml = await reports.text();
    assert.match(reportsHtml, /Annual members only/);
    assert.equal(reportsHtml.includes("Vendor A"), false);

    const annual = await member(app, "year@example.com", { planId: "annual", seats: 2, foiaCredits: 1 });
    const annualReports = await request(app.url, "/reports", { jar: annual.jar, ip: annual.ip });
    const annualHtml = await annualReports.text();
    assert.match(annualHtml, /Sample data/);
    assert.match(annualHtml, /Quarterly webinar/);
    assert.match(annualHtml, /Vendor A/);

    const alertsPage = await request(app.url, "/alerts", { jar: annual.jar, ip: annual.ip });
    const saved = await request(app.url, "/alerts", {
      method: "POST",
      jar: annual.jar,
      ip: annual.ip,
      form: { csrf: csrfFrom(await alertsPage.text()), digest: "weekly", email: "on", rfp: "on", states: "AR" },
    });
    assert.equal(saved.status, 303);
    const alerts = await app.db.getAlerts(annual.user.id);
    assert.equal(alerts.digest, "weekly");
    assert.equal(alerts.emailEnabled, true);
    assert.equal(alerts.amendments, false);
    assert.equal(alerts.states, "AR");
  } finally {
    await app.close();
  }
});

test("FOIA credits, the annual free request, and per-user privacy", async () => {
  const app = await boot();
  try {
    const annual = await member(app, "foia-owner@example.com", { planId: "annual", seats: 2, foiaCredits: 1 });
    const page = await request(app.url, "/foia", { jar: annual.jar, ip: annual.ip });
    const token = csrfFrom(await page.text());
    const fields = {
      csrf: token,
      name: "Ada Example",
      organization: "Example Office",
      email: "foia-owner@example.com",
      state: "AR",
      agency: "SECRET-AGENCY-ALPHA",
      records: "Sample memos",
      dates: "2024",
      format: "Electronic",
      notes: "Private note",
      credit: "annual_free",
    };
    const first = await request(app.url, "/foia", { method: "POST", jar: annual.jar, ip: annual.ip, form: fields });
    assert.equal(first.status, 303);
    const id = new URL(first.headers.get("location"), app.url).pathname.split("/").pop();
    const detail = await request(app.url, `/foia/${id}`, { jar: annual.jar, ip: annual.ip });
    assert.match(await detail.text(), /SECRET-AGENCY-ALPHA/);
    const account = await app.db.getAccount(annual.user.accountId);
    assert.equal(account.foiaCredits, 1);
    assert.equal(account.annualFoiaYear, new Date().getUTCFullYear());

    const secondPage = await request(app.url, "/foia", { jar: annual.jar, ip: annual.ip });
    const second = await request(app.url, "/foia", {
      method: "POST",
      jar: annual.jar,
      ip: annual.ip,
      form: { ...fields, csrf: csrfFrom(await secondPage.text()), credit: "annual_free", agency: "SECOND" },
    });
    assert.equal(second.status, 400);
    assert.match(await second.text(), /once per year|already used|annual members/i);

    const paidPage = await request(app.url, "/foia", { jar: annual.jar, ip: annual.ip });
    const paid = await request(app.url, "/foia", {
      method: "POST",
      jar: annual.jar,
      ip: annual.ip,
      form: { ...fields, csrf: csrfFrom(await paidPage.text()), credit: "paid", agency: "SECRET-AGENCY-CREDIT" },
    });
    assert.equal(paid.status, 303);
    assert.equal((await app.db.getAccount(annual.user.accountId)).foiaCredits, 0);

    const monthly = await member(app, "foia-month@example.com", { planId: "monthly", foiaCredits: 1 });
    const monthPage = await request(app.url, "/foia", { jar: monthly.jar, ip: monthly.ip });
    const monthPost = await request(app.url, "/foia", {
      method: "POST",
      jar: monthly.jar,
      ip: monthly.ip,
      form: { ...fields, email: "foia-month@example.com", csrf: csrfFrom(await monthPage.text()), credit: "annual_free" },
    });
    assert.equal(monthPost.status, 400);
    assert.match(await monthPost.text(), /annual/i);

    const invitePage = await request(app.url, "/account", { jar: annual.jar, ip: annual.ip });
    const invite = await request(app.url, "/account/invites", {
      method: "POST",
      jar: annual.jar,
      ip: annual.ip,
      form: { csrf: csrfFrom(await invitePage.text()), email: "seat@example.com" },
    });
    assert.equal(invite.status, 303);
    const link = app.sent.at(-1).text.match(/https?:\/\/\S+/)[0];
    const inviteToken = link.split("/invite/")[1];
    const seatJar = {};
    const seatIp = nextIp();
    const joinPage = await request(app.url, `/invite/${inviteToken}`, { jar: seatJar, ip: seatIp });
    const join = await request(app.url, `/invite/${inviteToken}`, {
      method: "POST",
      jar: seatJar,
      ip: seatIp,
      form: {
        csrf: csrfFrom(await joinPage.text()),
        name: "Seat Person",
        email: "seat@example.com",
        organization: "Example Office",
        password: "seat-password",
      },
    });
    assert.equal(join.status, 303);
    assert.equal(join.headers.get("location"), "/dashboard");
    const seatList = await request(app.url, "/foia", { jar: seatJar, ip: seatIp });
    const seatHtml = await seatList.text();
    assert.equal(seatHtml.includes("SECRET-AGENCY-ALPHA"), false);
    const hidden = await request(app.url, `/foia/${id}`, { jar: seatJar, ip: seatIp });
    assert.equal(hidden.status, 404);

    const other = await member(app, "other@example.com", { planId: "annual" });
    const otherList = await request(app.url, "/foia", { jar: other.jar, ip: other.ip });
    assert.equal((await otherList.text()).includes("SECRET-AGENCY-ALPHA"), false);
    assert.equal((await request(app.url, `/foia/${id}`, { jar: other.jar, ip: other.ip })).status, 404);

    const full = await member(app, "solo@example.com", { planId: "monthly", seats: 1 });
    const soloPage = await request(app.url, "/account", { jar: full.jar, ip: full.ip });
    const blocked = await request(app.url, "/account/invites", {
      method: "POST",
      jar: full.jar,
      ip: full.ip,
      form: { csrf: csrfFrom(await soloPage.text()), email: "extra@example.com" },
    });
    assert.equal(blocked.status, 400);
    assert.match(await blocked.text(), /seats/i);
    assert.equal(app.sent.filter((message) => message.to === "extra@example.com").length, 0);
  } finally {
    await app.close();
  }
});
