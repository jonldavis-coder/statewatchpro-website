const PLANS = new Set(["trial", "monthly", "annual"]);

export function isEntitled(account, now = new Date()) {
  if (!account || account.status !== "active") return false;
  if (!PLANS.has(account.planId)) return false;
  if (account.accessUntil) {
    const end = Date.parse(account.accessUntil);
    if (!Number.isFinite(end) || end <= now.getTime()) return false;
  }
  return true;
}

export function hasAnnualPerks(account, now = new Date()) {
  return isEntitled(account, now) && account.planId === "annual";
}

export function freeFoiaAvailable(account, now = new Date()) {
  if (!hasAnnualPerks(account, now)) return false;
  return account.annualFoiaYear !== now.getUTCFullYear();
}

export function planLabel(account) {
  if (!account) return "No plan";
  if (account.planId === "trial") return "Trial";
  if (account.planId === "monthly") return "Monthly";
  if (account.planId === "annual") return "Annual";
  return "No plan";
}
