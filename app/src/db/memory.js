import { hashToken, newId, newToken } from "../ids.js";

function copy(value) {
  return value ? { ...value } : null;
}

export function defaultAlerts() {
  return {
    digest: "daily",
    emailEnabled: true,
    rfp: true,
    amendments: true,
    deadlines: true,
    awards: true,
    renewals: true,
    prices: true,
    states: "",
  };
}

export function createMemoryDb() {
  const users = new Map();
  const accounts = new Map();
  const resets = new Map();
  const invites = new Map();
  const foia = new Map();
  const alerts = new Map();
  const events = new Set();

  function blankAccount(id, now) {
    return {
      id,
      planId: "none",
      status: "none",
      seats: 1,
      accessUntil: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      foiaCredits: 0,
      annualFoiaYear: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    async ping() {},

    async createOwner({ name, email, organization, passwordHash }) {
      if ([...users.values()].some((user) => user.email === email)) {
        const error = new Error("An account with that email already exists.");
        error.status = 400;
        throw error;
      }
      const now = new Date().toISOString();
      const account = blankAccount(newId("acct"), now);
      const user = {
        id: newId("usr"),
        accountId: account.id,
        email,
        name,
        organization,
        passwordHash,
        role: "owner",
        disabled: false,
        createdAt: now,
      };
      accounts.set(account.id, account);
      users.set(user.id, user);
      return { user: copy(user), account: copy(account) };
    },

    async createMember({ accountId, name, email, organization, passwordHash }) {
      if (!accounts.has(accountId)) throw new Error("Account not found");
      if ([...users.values()].some((user) => user.email === email)) {
        const error = new Error("An account with that email already exists.");
        error.status = 400;
        throw error;
      }
      const user = {
        id: newId("usr"),
        accountId,
        email,
        name,
        organization,
        passwordHash,
        role: "member",
        disabled: false,
        createdAt: new Date().toISOString(),
      };
      users.set(user.id, user);
      return copy(user);
    },

    async findUserByEmail(email) {
      return copy([...users.values()].find((user) => user.email === email));
    },

    async findUserById(id) {
      return copy(users.get(id));
    },

    async setPassword(id, passwordHash) {
      const user = users.get(id);
      if (!user) throw new Error("Not found");
      user.passwordHash = passwordHash;
    },

    async listMembers(accountId) {
      return [...users.values()]
        .filter((user) => user.accountId === accountId)
        .map((user) => copy(user))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async disableMember(accountId, userId) {
      const user = users.get(userId);
      if (!user || user.accountId !== accountId || user.role === "owner") return false;
      user.disabled = true;
      return true;
    },

    async getAccount(id) {
      return copy(accounts.get(id));
    },

    async updateAccount(id, patch) {
      const account = accounts.get(id);
      if (!account) throw new Error("Account not found");
      Object.assign(account, patch, { updatedAt: new Date().toISOString() });
      return copy(account);
    },

    async addFoiaCredits(id, count, customerId) {
      const account = accounts.get(id);
      if (!account) throw new Error("Account not found");
      account.foiaCredits += count;
      if (customerId) account.stripeCustomerId = customerId;
      account.updatedAt = new Date().toISOString();
      return account.foiaCredits;
    },

    async findAccountByStripe({ subscriptionId, customerId, userId }) {
      if (subscriptionId) {
        const match = [...accounts.values()].find((account) => account.stripeSubscriptionId === subscriptionId);
        if (match) return copy(match);
      }
      if (customerId) {
        const match = [...accounts.values()].find((account) => account.stripeCustomerId === customerId);
        if (match) return copy(match);
      }
      if (userId) {
        const user = users.get(userId);
        if (user) return copy(accounts.get(user.accountId));
      }
      return null;
    },

    async claimStripeEvent(id) {
      if (!id || events.has(id)) return false;
      events.add(id);
      return true;
    },

    async releaseStripeEvent(id) {
      events.delete(id);
    },

    async createReset(userId, ttlMs = 60 * 60 * 1000) {
      const token = newToken();
      resets.set(hashToken(token), { userId, expiresAt: Date.now() + ttlMs });
      return token;
    },

    async takeReset(token) {
      const hash = hashToken(token);
      const row = resets.get(hash);
      if (!row) return null;
      resets.delete(hash);
      if (row.expiresAt <= Date.now()) return null;
      return row.userId;
    },

    async createInvite({ accountId, email }) {
      const token = newToken();
      invites.set(hashToken(token), {
        accountId,
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: null,
        createdAt: new Date().toISOString(),
      });
      return token;
    },

    async getInvite(token) {
      const row = invites.get(hashToken(token));
      if (!row || row.acceptedAt) return null;
      if (Date.parse(row.expiresAt) <= Date.now()) return null;
      return copy(row);
    },

    async acceptInvite(token) {
      const row = invites.get(hashToken(token));
      if (!row || row.acceptedAt || Date.parse(row.expiresAt) <= Date.now()) return null;
      row.acceptedAt = new Date().toISOString();
      return copy(row);
    },

    async listPendingInvites(accountId) {
      return [...invites.values()]
        .filter((row) => row.accountId === accountId && !row.acceptedAt && Date.parse(row.expiresAt) > Date.now())
        .map((row) => copy(row));
    },

    async countOccupiedSeats(accountId) {
      const members = [...users.values()].filter((user) => user.accountId === accountId && !user.disabled).length;
      const pending = [...invites.values()]
        .filter((row) => row.accountId === accountId && !row.acceptedAt && Date.parse(row.expiresAt) > Date.now())
        .length;
      return members + pending;
    },

    async submitFoia(input) {
      const account = accounts.get(input.accountId);
      if (!account) return { ok: false, error: "Account not found." };
      if (input.kind === "annual_free") {
        if (account.annualFoiaYear === input.year) {
          return { ok: false, error: "The free FOIA request for this year is already used." };
        }
        account.annualFoiaYear = input.year;
      } else if (input.kind === "paid") {
        if (account.foiaCredits < 1) return { ok: false, error: "No FOIA credits remaining." };
        account.foiaCredits -= 1;
      } else {
        return { ok: false, error: "Choose how this request is covered." };
      }
      account.updatedAt = new Date().toISOString();
      const row = {
        id: newId("foia"),
        accountId: input.accountId,
        userId: input.userId,
        name: input.name,
        organization: input.organization,
        email: input.email,
        state: input.state,
        agency: input.agency,
        records: input.records,
        dateRange: input.dateRange || "",
        format: input.format || "",
        notes: input.notes || "",
        creditKind: input.kind,
        status: "submitted",
        createdAt: new Date().toISOString(),
      };
      foia.set(row.id, row);
      return { ok: true, id: row.id };
    },

    async listFoia(accountId, userId) {
      return [...foia.values()]
        .filter((row) => row.accountId === accountId && row.userId === userId)
        .map((row) => copy(row))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getFoia(accountId, userId, id) {
      const row = foia.get(id);
      if (!row || row.accountId !== accountId || row.userId !== userId) return null;
      return copy(row);
    },

    async getAlerts(userId) {
      return { ...defaultAlerts(), ...(alerts.get(userId) || {}) };
    },

    async saveAlerts(userId, settings) {
      alerts.set(userId, { ...settings });
      return this.getAlerts(userId);
    },
  };
}
