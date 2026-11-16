import { createHmac, timingSafeEqual } from "node:crypto";
import { isEntitled } from "./entitlements.js";

const TOLERANCE_MS = 5 * 60 * 1000;

export function signStripePayload(payload, secret, timestampSec = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${timestampSec}.${payload}`).digest("hex");
  return `t=${timestampSec},v1=${v1}`;
}

export function verifyStripeSignature(payload, header, secret, now = Date.now()) {
  if (!payload || !header || !secret) return false;
  const items = header.split(",").map((part) => {
    const eq = part.indexOf("=");
    return eq < 0 ? ["", ""] : [part.slice(0, eq), part.slice(eq + 1)];
  });
  const timestamp = items.find(([key]) => key === "t")?.[1];
  const signatures = items.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  const ts = Number(timestamp);
  if (!ts || signatures.length === 0) return false;
  if (Math.abs(now - ts * 1000) > TOLERANCE_MS) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const left = Buffer.from(expected);
  return signatures.some((signature) => {
    const right = Buffer.from(signature);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

function stripeId(value) {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

function clampSeats(value) {
  const seats = Number(value);
  if (!Number.isInteger(seats) || seats < 1 || seats > 200) return 1;
  return seats;
}

async function applyCheckout(db, object, { now }) {
  const paymentStatus = object.payment_status;
  if (paymentStatus && paymentStatus !== "paid" && paymentStatus !== "no_payment_required") return;
  const userId = String(object.client_reference_id || object.metadata?.userId || "");
  const user = userId ? await db.findUserById(userId) : null;
  if (!user) return;
  const account = await db.getAccount(user.accountId);
  if (!account) return;
  const planId = String(object.metadata?.planId || "");
  const customerId = stripeId(object.customer);
  const subscriptionId = stripeId(object.subscription);
  if (planId === "foia" || planId === "foia5") {
    await db.addFoiaCredits(account.id, planId === "foia" ? 1 : 5, customerId);
    return;
  }
  if (planId === "trial") {
    if (isEntitled(account, now) && (account.planId === "monthly" || account.planId === "annual")) return;
    await db.updateAccount(account.id, {
      planId: "trial",
      status: "active",
      seats: 1,
      accessUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      stripeCustomerId: customerId || account.stripeCustomerId,
      stripeSubscriptionId: null,
    });
    return;
  }
  if (planId === "monthly" || planId === "annual") {
    await db.updateAccount(account.id, {
      planId,
      status: "active",
      seats: clampSeats(object.metadata?.seats),
      accessUntil: null,
      stripeCustomerId: customerId || account.stripeCustomerId,
      stripeSubscriptionId: subscriptionId || account.stripeSubscriptionId,
    });
  }
}

async function applySubscription(db, object, type, { prices, now }) {
  const subscriptionId = stripeId(object.id);
  const customerId = stripeId(object.customer);
  const userId = String(object.metadata?.userId || "");
  const account = await db.findAccountByStripe({ subscriptionId, customerId, userId });
  if (!account || !subscriptionId) return;
  if (account.stripeSubscriptionId && account.stripeSubscriptionId !== subscriptionId) return;

  const terminal = type === "customer.subscription.deleted"
    || object.status === "canceled"
    || object.status === "unpaid"
    || object.status === "incomplete_expired";
  if (terminal) {
    if (account.stripeSubscriptionId !== subscriptionId) return;
    await db.updateAccount(account.id, {
      status: "canceled",
      accessUntil: now.toISOString(),
      stripeCustomerId: customerId || account.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });
    return;
  }
  if (object.status === "past_due") {
    if (account.stripeSubscriptionId !== subscriptionId) return;
    await db.updateAccount(account.id, {
      status: "past_due",
      stripeCustomerId: customerId || account.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });
    return;
  }
  if (object.status === "active" || object.status === "trialing") {
    const item = object.items?.data?.[0];
    const priceId = typeof item?.price === "string" ? item.price : item?.price?.id;
    const fromPrice = priceId === prices.monthly ? "monthly" : priceId === prices.annual ? "annual" : null;
    const metaPlan = object.metadata?.planId === "monthly" || object.metadata?.planId === "annual"
      ? object.metadata.planId
      : null;
    const planId = fromPrice || metaPlan || (account.planId === "monthly" || account.planId === "annual" ? account.planId : "monthly");
    const quantity = Number(item?.quantity);
    const seats = Number.isInteger(quantity) && quantity >= 1 && quantity <= 200 ? quantity : Math.max(1, account.seats || 1);
    const accessUntil = typeof object.current_period_end === "number" && object.current_period_end > 0
      ? new Date(object.current_period_end * 1000).toISOString()
      : null;
    await db.updateAccount(account.id, {
      planId,
      status: "active",
      seats,
      accessUntil,
      stripeCustomerId: customerId || account.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });
  }
}

async function applyPaymentFailed(db, object) {
  const subscriptionId = stripeId(object.subscription);
  const customerId = stripeId(object.customer);
  if (!subscriptionId) return;
  const account = await db.findAccountByStripe({ subscriptionId, customerId, userId: "" });
  if (!account || account.stripeSubscriptionId !== subscriptionId) return;
  await db.updateAccount(account.id, { status: "past_due" });
}

export async function applyStripeEvent(db, event, { prices, now = new Date() }) {
  const object = event.data?.object || {};
  if (event.type === "checkout.session.completed") {
    await applyCheckout(db, object, { now });
    return;
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await applySubscription(db, object, event.type, { prices, now });
    return;
  }
  if (event.type === "invoice.payment_failed") {
    await applyPaymentFailed(db, object);
  }
}

export async function stripeRequest(secretKey, path, params) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Stripe ${path} failed (${response.status})`);
    error.status = 502;
    throw error;
  }
  return JSON.parse(text);
}

export function checkoutParams({ spec, user, origin, customerId }) {
  const body = new URLSearchParams();
  body.set("mode", spec.mode);
  body.set("line_items[0][price]", spec.price);
  body.set("line_items[0][quantity]", String(spec.quantity));
  body.set("success_url", `${origin}/pricing?checkout=success`);
  body.set("cancel_url", `${origin}/pricing?checkout=cancel`);
  body.set("client_reference_id", user.id);
  body.set("metadata[userId]", user.id);
  body.set("metadata[accountId]", user.accountId);
  body.set("metadata[planId]", spec.planId);
  body.set("metadata[seats]", String(spec.quantity));
  if (customerId) body.set("customer", customerId);
  else body.set("customer_email", user.email);
  if (spec.mode === "subscription") {
    body.set("subscription_data[metadata][userId]", user.id);
    body.set("subscription_data[metadata][accountId]", user.accountId);
    body.set("subscription_data[metadata][planId]", spec.planId);
  }
  return body;
}
