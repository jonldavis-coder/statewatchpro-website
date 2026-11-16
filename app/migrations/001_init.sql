CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL DEFAULT 'none',
  status TEXT NOT NULL DEFAULT 'none',
  seats INTEGER NOT NULL DEFAULT 1,
  access_until TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  foia_credits INTEGER NOT NULL DEFAULT 0,
  annual_foia_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS users_account ON users (account_id);
CREATE INDEX IF NOT EXISTS accounts_customer ON accounts (stripe_customer_id);
CREATE INDEX IF NOT EXISTS accounts_subscription ON accounts (stripe_subscription_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS invites_account ON invites (account_id);

CREATE TABLE IF NOT EXISTS foia_requests (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  requester_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL,
  state TEXT NOT NULL,
  agency TEXT NOT NULL,
  records TEXT NOT NULL,
  date_range TEXT NOT NULL DEFAULT '',
  preferred_format TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  credit_kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS foia_requests_account ON foia_requests (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS alert_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  digest TEXT NOT NULL DEFAULT 'daily',
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_rfp BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_amendments BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_awards BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_renewals BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_prices BOOLEAN NOT NULL DEFAULT TRUE,
  states TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL
);
