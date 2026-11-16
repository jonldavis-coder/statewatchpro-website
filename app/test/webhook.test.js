import assert from "node:assert/strict";
import test from "node:test";
import { signStripePayload } from "../src/stripe.js";
import { boot, csrfFrom, nextIp, request, signup, testConfig } from "./helpers.js";

function event(id, type, object) {
  return { id, type, data: { object } };
}

async function postEvent(app, secret, body, header) {
  return fetch(`${app.url}/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": header,
    },
    body,
  });
}

async function deliver(app, secret, payload) {
  const body = JSON.stringify(payload);
  return postEvent(app, secret, body, signStripePayload(body, secret));
}

async function owner(app, email) {
  const ip = nextIp();
  const created = await signup(app.url, {
    name: "Ada Example",
    email,
    organization: "Example Office",
    password: "correct-horse",
  }, ip);
  const user = await app.db.findUserByEmail(email);
  return { ip, jar: created.jar, user };
}

test("webhook signature, checkout grants, and duplicate events", async () => {
  const secret = "whsec_test_secret_value";
  const app = await boot();
  try {
    const ada = await owner(app, "ada-pay@example.com");
    const bad = await postEvent(app, secret, JSON.stringify(event("evt_bad", "checkout.session.completed", {})), "t=1,v1=deadbeef");
    assert.equal(bad.status, 400);
    assert.equal((await app.db.getAccount(ada.user.accountId)).planId, "none");

    const staleBody = JSON.stringify(event("evt_stale", "checkout.session.completed", {
      client_reference_id: ada.user.id,
      payment_status: "paid",
      metadata: { planId: "trial", userId: ada.user.id },
    }));
    const stale = await postEvent(app, secret, staleBody, signStripePayload(staleBody, secret, Math.floor(Date.now() / 1000) - 3600));
    assert.equal(stale.status, 400);

    const unpaid = await deliver(app, secret, event("evt_unpaid", "checkout.session.completed", {
      client_reference_id: ada.user.id,
      payment_status: "unpaid",
      metadata: { planId: "trial", userId: ada.user.id, seats: "1" },
    }));
    assert.equal(unpaid.status, 200);
    assert.equal((await app.db.getAccount(ada.user.accountId)).status, "none");

    const trial = await deliver(app, secret, event("evt_trial", "checkout.session.completed", {
      client_reference_id: ada.user.id,
      customer: "cus_ada",
      payment_status: "paid",
      metadata: { planId: "trial", userId: ada.user.id, seats: "4" },
    }));
    assert.equal(trial.status, 200);
    const trialAccount = await app.db.getAccount(ada.user.accountId);
    assert.equal(trialAccount.planId, "trial");
    assert.equal(trialAccount.status, "active");
    assert.equal(trialAccount.seats, 1);
    assert.equal(trialAccount.stripeCustomerId, "cus_ada");
    const delta = Date.parse(trialAccount.accessUntil) - Date.now();
    assert.ok(delta > 6.9 * 24 * 60 * 60 * 1000 && delta < 7.1 * 24 * 60 * 60 * 1000);
    const dash = await request(app.url, "/dashboard", { jar: ada.jar, ip: ada.ip });
    assert.equal(dash.status, 200);

    const bea = await owner(app, "bea-pay@example.com");
    assert.equal((await app.db.getAccount(bea.user.accountId)).planId, "none");

    const foia = event("evt_foia", "checkout.session.completed", {
      client_reference_id: ada.user.id,
      customer: "cus_ada",
      payment_status: "paid",
      metadata: { planId: "foia", userId: ada.user.id },
    });
    assert.equal((await deliver(app, secret, foia)).status, 200);
    assert.equal((await deliver(app, secret, foia)).status, 200);
    const afterFoia = await (await deliver(app, secret, foia)).json();
    assert.equal(afterFoia.duplicate, true);
    assert.equal((await app.db.getAccount(ada.user.accountId)).foiaCredits, 1);
    assert.equal((await app.db.getAccount(ada.user.accountId)).planId, "trial");

    const pack = await deliver(app, secret, event("evt_pack", "checkout.session.completed", {
      client_reference_id: ada.user.id,
      payment_status: "paid",
      metadata: { planId: "foia5", userId: ada.user.id },
    }));
    assert.equal(pack.status, 200);
    assert.equal((await app.db.getAccount(ada.user.accountId)).foiaCredits, 6);

    const monthly = await deliver(app, secret, event("evt_month", "checkout.session.completed", {
      client_reference_id: bea.user.id,
      customer: "cus_bea",
      subscription: "sub_bea",
      payment_status: "paid",
      mode: "subscription",
      metadata: { planId: "monthly", userId: bea.user.id, seats: "3" },
    }));
    assert.equal(monthly.status, 200);
    const beaAccount = await app.db.getAccount(bea.user.accountId);
    assert.equal(beaAccount.planId, "monthly");
    assert.equal(beaAccount.seats, 3);
    assert.equal(beaAccount.status, "active");
    assert.equal(beaAccount.stripeSubscriptionId, "sub_bea");
    assert.equal((await request(app.url, "/dashboard", { jar: bea.jar, ip: bea.ip })).status, 200);

    const renewed = await deliver(app, secret, event("evt_renew", "customer.subscription.updated", {
      id: "sub_bea",
      customer: "cus_bea",
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 40 * 24 * 60 * 60,
      metadata: { userId: bea.user.id, planId: "monthly" },
      items: { data: [{ quantity: 4, price: { id: app.cfg.prices.monthly } }] },
    }));
    assert.equal(renewed.status, 200);
    const renewedAccount = await app.db.getAccount(bea.user.accountId);
    assert.equal(renewedAccount.seats, 4);
    assert.equal(renewedAccount.status, "active");
    assert.ok(Date.parse(renewedAccount.accessUntil) > Date.now() + 30 * 24 * 60 * 60 * 1000);

    const failed = await deliver(app, secret, event("evt_fail", "invoice.payment_failed", {
      customer: "cus_bea",
      subscription: "sub_bea",
    }));
    assert.equal(failed.status, 200);
    assert.equal((await app.db.getAccount(bea.user.accountId)).status, "past_due");
    assert.equal((await request(app.url, "/dashboard", { jar: bea.jar, ip: bea.ip })).status, 302);

    const restored = await deliver(app, secret, event("evt_restore", "customer.subscription.updated", {
      id: "sub_bea",
      customer: "cus_bea",
      status: "active",
      metadata: { userId: bea.user.id, planId: "annual" },
      items: { data: [{ quantity: 2, price: { id: app.cfg.prices.annual } }] },
    }));
    assert.equal(restored.status, 200);
    assert.equal((await app.db.getAccount(bea.user.accountId)).planId, "annual");
    assert.equal((await app.db.getAccount(bea.user.accountId)).status, "active");

    const canceled = await deliver(app, secret, event("evt_cancel", "customer.subscription.deleted", {
      id: "sub_bea",
      customer: "cus_bea",
      status: "canceled",
      metadata: { userId: bea.user.id },
    }));
    assert.equal(canceled.status, 200);
    const canceledAccount = await app.db.getAccount(bea.user.accountId);
    assert.equal(canceledAccount.status, "canceled");
    assert.equal((await request(app.url, "/reports", { jar: bea.jar, ip: bea.ip })).status, 302);

    const laterTrial = await deliver(app, secret, event("evt_later_trial", "checkout.session.completed", {
      client_reference_id: bea.user.id,
      customer: "cus_bea",
      payment_status: "paid",
      metadata: { planId: "trial", userId: bea.user.id },
    }));
    assert.equal(laterTrial.status, 200);
    const replayedCancel = await deliver(app, secret, event("evt_old_cancel", "customer.subscription.deleted", {
      id: "sub_bea",
      customer: "cus_bea",
      status: "canceled",
    }));
    assert.equal(replayedCancel.status, 200);
    const stillTrial = await app.db.getAccount(bea.user.accountId);
    assert.equal(stillTrial.planId, "trial");
    assert.equal(stillTrial.status, "active");
  } finally {
    await app.close();
  }
});

test("checkout session is tied to the signed-in user and seats", async () => {
  const cfg = testConfig({ STRIPE_SECRET_KEY: "sk_test_example" });
  const app = await boot({ config: cfg });
  const original = globalThis.fetch.bind(globalThis);
  const calls = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://api.stripe.com/")) {
      calls.push({ url: String(url), body: String(init.body) });
      return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_statewatch" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return original(url, init);
  };
  try {
    const ip = nextIp();
    const created = await signup(app.url, {
      name: "Ada Example",
      email: "checkout@example.com",
      organization: "Example Office",
      password: "correct-horse",
    }, ip);
    const user = await app.db.findUserByEmail("checkout@example.com");
    const pricing = await request(app.url, "/pricing", { jar: created.jar, ip });
    const html = await pricing.text();
    assert.match(html, /Limited-time 50% off/);
    assert.match(html, /<s class="was">\$129<\/s>/);
    assert.match(html, /\$64/);
    assert.match(html, /<s class="was">\$199<\/s>/);
    assert.match(html, /\$99/);
    assert.match(html, /<s class="was">\$1,999<\/s>/);
    assert.match(html, /\$999/);
    const started = await request(app.url, "/checkout", {
      method: "POST",
      jar: created.jar,
      ip,
      form: { csrf: csrfFrom(html), plan: "monthly", seats: "3" },
    });
    assert.equal(started.status, 303);
    assert.equal(started.headers.get("location"), "https://checkout.stripe.com/c/pay/cs_test_statewatch");
    const params = new URLSearchParams(calls[0].body);
    assert.equal(params.get("client_reference_id"), user.id);
    assert.equal(params.get("customer_email"), "checkout@example.com");
    assert.equal(params.get("mode"), "subscription");
    assert.equal(params.get("line_items[0][price]"), cfg.prices.monthly);
    assert.equal(params.get("line_items[0][quantity]"), "3");
    assert.equal(params.get("metadata[userId]"), user.id);
    assert.equal(params.get("metadata[planId]"), "monthly");
    assert.equal(params.get("subscription_data[metadata][planId]"), "monthly");

    const bare = await boot();
    const ip2 = nextIp();
    const unpaid = await signup(bare.url, {
      name: "Ada Example",
      email: "noconfig@example.com",
      organization: "Example Office",
      password: "correct-horse",
    }, ip2);
    const pricing2 = await request(bare.url, "/pricing", { jar: unpaid.jar, ip: ip2 });
    const blocked = await request(bare.url, "/checkout", {
      method: "POST",
      jar: unpaid.jar,
      ip: ip2,
      form: { csrf: csrfFrom(await pricing2.text()), plan: "trial", seats: "1" },
    });
    assert.equal(blocked.status, 503);
    assert.match(await blocked.text(), /No charge was made/);
    await bare.close();
  } finally {
    globalThis.fetch = original;
    await app.close();
  }
});

test("a missing webhook secret writes nothing", async () => {
  const app = await boot({ config: testConfig({ STRIPE_WEBHOOK_SECRET: "" }) });
  try {
    const response = await postEvent(app, "", "{}", "t=1,v1=abc");
    assert.equal(response.status, 400);
  } finally {
    await app.close();
  }
});
