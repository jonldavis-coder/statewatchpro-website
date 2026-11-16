import { hashToken, newId, newToken } from "../ids.js";
import { createPool } from "../pg.js";
import { defaultAlerts } from "./memory.js";

function iso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    email: row.email,
    name: row.name,
    organization: row.organization,
    passwordHash: row.password_hash,
    role: row.role,
    disabled: row.disabled,
    createdAt: iso(row.created_at),
  };
}

function mapAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    planId: row.plan_id,
    status: row.status,
    seats: row.seats,
    accessUntil: iso(row.access_until),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    foiaCredits: row.foia_credits,
    annualFoiaYear: row.annual_foia_year,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapFoia(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    name: row.requester_name,
    organization: row.organization,
    email: row.email,
    state: row.state,
    agency: row.agency,
    records: row.records,
    dateRange: row.date_range,
    format: row.preferred_format,
    notes: row.notes,
    creditKind: row.credit_kind,
    status: row.status,
    createdAt: iso(row.created_at),
  };
}

function duplicateEmail(error) {
  if (error && error.code === "23505") {
    const wrapped = new Error("An account with that email already exists.");
    wrapped.status = 400;
    return wrapped;
  }
  return error;
}

export function createPostgresDb(connectionString) {
  const pool = createPool(connectionString);

  async function one(sql, params) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  }

  return {
    async ping() {
      await pool.query("SELECT 1");
    },

    async createOwner({ name, email, organization, passwordHash }) {
      const accountId = newId("acct");
      const userId = newId("usr");
      const now = new Date().toISOString();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO accounts (id, plan_id, status, seats, foia_credits, created_at, updated_at)
           VALUES ($1, 'none', 'none', 1, 0, $2, $2)`,
          [accountId, now],
        );
        await client.query(
          `INSERT INTO users (id, account_id, email, name, organization, password_hash, role, disabled, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'owner', FALSE, $7)`,
          [userId, accountId, email, name, organization, passwordHash, now],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw duplicateEmail(error);
      } finally {
        client.release();
      }
      return { user: await this.findUserById(userId), account: await this.getAccount(accountId) };
    },

    async createMember({ accountId, name, email, organization, passwordHash }) {
      const id = newId("usr");
      const now = new Date().toISOString();
      try {
        await pool.query(
          `INSERT INTO users (id, account_id, email, name, organization, password_hash, role, disabled, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'member', FALSE, $7)`,
          [id, accountId, email, name, organization, passwordHash, now],
        );
      } catch (error) {
        throw duplicateEmail(error);
      }
      return this.findUserById(id);
    },

    async findUserByEmail(email) {
      return mapUser(await one("SELECT * FROM users WHERE email = $1", [email]));
    },

    async findUserById(id) {
      return mapUser(await one("SELECT * FROM users WHERE id = $1", [id]));
    },

    async setPassword(id, passwordHash) {
      await pool.query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, passwordHash]);
    },

    async listMembers(accountId) {
      const result = await pool.query("SELECT * FROM users WHERE account_id = $1 ORDER BY created_at ASC", [accountId]);
      return result.rows.map(mapUser);
    },

    async disableMember(accountId, userId) {
      const result = await pool.query(
        "UPDATE users SET disabled = TRUE WHERE id = $1 AND account_id = $2 AND role <> 'owner'",
        [userId, accountId],
      );
      return result.rowCount > 0;
    },

    async getAccount(id) {
      return mapAccount(await one("SELECT * FROM accounts WHERE id = $1", [id]));
    },

    async updateAccount(id, patch) {
      const current = await this.getAccount(id);
      if (!current) throw new Error("Account not found");
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      await pool.query(
        `UPDATE accounts
         SET plan_id = $2, status = $3, seats = $4, access_until = $5, stripe_customer_id = $6,
             stripe_subscription_id = $7, foia_credits = $8, annual_foia_year = $9, updated_at = $10
         WHERE id = $1`,
        [
          id,
          next.planId,
          next.status,
          next.seats,
          next.accessUntil,
          next.stripeCustomerId,
          next.stripeSubscriptionId,
          next.foiaCredits,
          next.annualFoiaYear,
          next.updatedAt,
        ],
      );
      return next;
    },

    async addFoiaCredits(id, count, customerId) {
      const row = await one(
        `UPDATE accounts
         SET foia_credits = foia_credits + $2,
             stripe_customer_id = COALESCE($3, stripe_customer_id),
             updated_at = $4
         WHERE id = $1
         RETURNING foia_credits`,
        [id, count, customerId, new Date().toISOString()],
      );
      if (!row) throw new Error("Account not found");
      return row.foia_credits;
    },

    async findAccountByStripe({ subscriptionId, customerId, userId }) {
      if (subscriptionId) {
        const row = await one("SELECT * FROM accounts WHERE stripe_subscription_id = $1", [subscriptionId]);
        if (row) return mapAccount(row);
      }
      if (customerId) {
        const row = await one("SELECT * FROM accounts WHERE stripe_customer_id = $1", [customerId]);
        if (row) return mapAccount(row);
      }
      if (userId) {
        const user = await this.findUserById(userId);
        if (user) return this.getAccount(user.accountId);
      }
      return null;
    },

    async claimStripeEvent(id) {
      const result = await pool.query(
        "INSERT INTO stripe_events (id, received_at) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, new Date().toISOString()],
      );
      return result.rowCount > 0;
    },

    async releaseStripeEvent(id) {
      await pool.query("DELETE FROM stripe_events WHERE id = $1", [id]);
    },

    async createReset(userId) {
      const token = newToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await pool.query(
        "INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
        [hashToken(token), userId, expires],
      );
      return token;
    },

    async takeReset(token) {
      const row = await one(
        "DELETE FROM password_resets WHERE token_hash = $1 RETURNING user_id, expires_at",
        [hashToken(token)],
      );
      if (!row) return null;
      if (new Date(row.expires_at).getTime() <= Date.now()) return null;
      return row.user_id;
    },

    async createInvite({ accountId, email }) {
      const token = newToken();
      const now = new Date();
      await pool.query(
        `INSERT INTO invites (token_hash, account_id, email, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [hashToken(token), accountId, email, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), now.toISOString()],
      );
      return token;
    },

    async getInvite(token) {
      const row = await one(
        `SELECT account_id, email, expires_at FROM invites
         WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
        [hashToken(token)],
      );
      if (!row) return null;
      return { accountId: row.account_id, email: row.email, expiresAt: iso(row.expires_at) };
    },

    async acceptInvite(token) {
      const row = await one(
        `UPDATE invites SET accepted_at = NOW()
         WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > NOW()
         RETURNING account_id, email`,
        [hashToken(token)],
      );
      if (!row) return null;
      return { accountId: row.account_id, email: row.email };
    },

    async listPendingInvites(accountId) {
      const result = await pool.query(
        `SELECT email, expires_at, created_at FROM invites
         WHERE account_id = $1 AND accepted_at IS NULL AND expires_at > NOW()
         ORDER BY created_at ASC`,
        [accountId],
      );
      return result.rows.map((row) => ({
        accountId,
        email: row.email,
        expiresAt: iso(row.expires_at),
        createdAt: iso(row.created_at),
      }));
    },

    async countOccupiedSeats(accountId) {
      const members = await one(
        "SELECT COUNT(*)::int AS count FROM users WHERE account_id = $1 AND disabled = FALSE",
        [accountId],
      );
      const pending = await one(
        `SELECT COUNT(*)::int AS count FROM invites
         WHERE account_id = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
        [accountId],
      );
      return members.count + pending.count;
    },

    async submitFoia(input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const locked = await client.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [input.accountId]);
        const account = mapAccount(locked.rows[0]);
        if (!account) {
          await client.query("ROLLBACK");
          return { ok: false, error: "Account not found." };
        }
        const now = new Date().toISOString();
        if (input.kind === "annual_free") {
          if (account.annualFoiaYear === input.year) {
            await client.query("ROLLBACK");
            return { ok: false, error: "The free FOIA request for this year is already used." };
          }
          await client.query(
            "UPDATE accounts SET annual_foia_year = $2, updated_at = $3 WHERE id = $1",
            [account.id, input.year, now],
          );
        } else if (input.kind === "paid") {
          if (account.foiaCredits < 1) {
            await client.query("ROLLBACK");
            return { ok: false, error: "No FOIA credits remaining." };
          }
          await client.query(
            "UPDATE accounts SET foia_credits = foia_credits - 1, updated_at = $2 WHERE id = $1",
            [account.id, now],
          );
        } else {
          await client.query("ROLLBACK");
          return { ok: false, error: "Choose how this request is covered." };
        }
        const id = newId("foia");
        await client.query(
          `INSERT INTO foia_requests (
             id, account_id, user_id, requester_name, organization, email, state, agency, records,
             date_range, preferred_format, notes, credit_kind, status, created_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'submitted',$14)`,
          [
            id, input.accountId, input.userId, input.name, input.organization, input.email,
            input.state, input.agency, input.records, input.dateRange || "", input.format || "",
            input.notes || "", input.kind, now,
          ],
        );
        await client.query("COMMIT");
        return { ok: true, id };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async listFoia(accountId, userId) {
      const result = await pool.query(
        "SELECT * FROM foia_requests WHERE account_id = $1 AND user_id = $2 ORDER BY created_at DESC",
        [accountId, userId],
      );
      return result.rows.map(mapFoia);
    },

    async getFoia(accountId, userId, id) {
      const row = await one(
        "SELECT * FROM foia_requests WHERE account_id = $1 AND user_id = $2 AND id = $3",
        [accountId, userId, id],
      );
      return row ? mapFoia(row) : null;
    },

    async getAlerts(userId) {
      const row = await one("SELECT * FROM alert_settings WHERE user_id = $1", [userId]);
      if (!row) return defaultAlerts();
      return {
        digest: row.digest,
        emailEnabled: row.email_enabled,
        rfp: row.alerts_rfp,
        amendments: row.alerts_amendments,
        deadlines: row.alerts_deadlines,
        awards: row.alerts_awards,
        renewals: row.alerts_renewals,
        prices: row.alerts_prices,
        states: row.states,
      };
    },

    async saveAlerts(userId, settings) {
      await pool.query(
        `INSERT INTO alert_settings (
           user_id, digest, email_enabled, alerts_rfp, alerts_amendments, alerts_deadlines,
           alerts_awards, alerts_renewals, alerts_prices, states, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id) DO UPDATE SET
           digest = EXCLUDED.digest,
           email_enabled = EXCLUDED.email_enabled,
           alerts_rfp = EXCLUDED.alerts_rfp,
           alerts_amendments = EXCLUDED.alerts_amendments,
           alerts_deadlines = EXCLUDED.alerts_deadlines,
           alerts_awards = EXCLUDED.alerts_awards,
           alerts_renewals = EXCLUDED.alerts_renewals,
           alerts_prices = EXCLUDED.alerts_prices,
           states = EXCLUDED.states,
           updated_at = EXCLUDED.updated_at`,
        [
          userId, settings.digest, settings.emailEnabled, settings.rfp, settings.amendments,
          settings.deadlines, settings.awards, settings.renewals, settings.prices, settings.states,
          new Date().toISOString(),
        ],
      );
      return this.getAlerts(userId);
    },
  };
}
