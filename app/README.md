# StateWatchPro member app

Paid member desk for [statewatchpro.com](https://statewatchpro.com). It runs as a Node web service on Render at `https://app.statewatchpro.com`. The marketing site stays on GitHub Pages from the repository root. `render.yaml` at the root only describes this service and its database. It does not publish or replace the static site.

Sign-up collects a name, email, organization, and password. Every product page requires a signed-in user and an active entitlement. Anyone signed in without access is sent to `/pricing`.

## Plans

Checkout uses Stripe Checkout Sessions created on the server. `client_reference_id` is the user id and `customer_email` is set (or the existing Stripe customer, once one exists). Display amounts are the sale price with the regular price struck through. Checkout charges the Stripe price id.

| Plan | Sale charged | Regular price shown | Price env | Default price id |
| --- | --- | --- | --- | --- |
| Trial, 7 days, 1 user | $64 one-time | $129 | `STRIPE_PRICE_TRIAL` | `price_1UcE1fFhnOoFBQrwd8cVFFG9` |
| Trial list price (display only) | | | `STRIPE_PRICE_TRIAL_REGULAR` | `price_1UcE1fFhnOoFBQrwOqISK7d5` |
| Monthly, quantity = seats | $99 / user / month | $199 | `STRIPE_PRICE_MONTHLY` | `price_1UcE1gFhnOoFBQrw2EFjpFps` |
| Monthly list price (display only) | | | `STRIPE_PRICE_MONTHLY_REGULAR` | `price_1UcE1gFhnOoFBQrwrhZ3SrfE` |
| Annual, quantity = seats | $999 / user / year | $1,999 | `STRIPE_PRICE_ANNUAL` | `price_1UcE1hFhnOoFBQrwdPReAMdZ` |
| Annual list price (display only) | | | `STRIPE_PRICE_ANNUAL_REGULAR` | `price_1UcE1iFhnOoFBQrw9OsvEnuh` |
| FOIA filing, +1 credit | $199 | | `STRIPE_PRICE_FOIA` | `price_1UcE1iFhnOoFBQrwKX1zsL4K` |
| FOIA 5-pack, +5 credits | $899 | | `STRIPE_PRICE_FOIA_5PACK` | `price_1UcE1jFhnOoFBQrwgRAVQyAN` |

Annual members get the quarterly report, the quarterly webinar, and one free FOIA request per year. Monthly and trial members do not. FOIA requests and the records on them are visible only to the user who submitted them.

Monthly and annual owners can invite people up to the seat quantity. Trial access is one user. Access ends when a subscription is canceled or unpaid, and when a trial's 7 days are over. `/billing` links to the Stripe Customer Portal.

## Environment variables

Set these on the Render web service. Do not commit real values. `.env.example` lists the same names.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes in production | Postgres connection string. The Blueprint wires it from `statewatchpro-db`. |
| `SESSION_SECRET` | Yes | HMAC key for the session cookie. At least 16 characters. The Blueprint generates it. |
| `STRIPE_SECRET_KEY` | Yes, to charge | Secret key. Checkout refuses to run when this is empty, and no subscription is changed. |
| `STRIPE_WEBHOOK_SECRET` | Yes, to grant access | Signing secret for `POST /stripe/webhook`. Requests with a bad or missing signature are rejected before any write. |
| `APP_URL` | Yes | Public origin, `https://app.statewatchpro.com`. Used for reset links, invite links, and Checkout return URLs. |
| `MARKETING_URL` | No | Defaults to `https://statewatchpro.com`. |
| `COOKIE_SECURE` | No | Set to `true` on Render so the session cookie is `Secure`. |
| `STRIPE_PRICE_TRIAL` | No | Defaults to the live sale price above. |
| `STRIPE_PRICE_TRIAL_REGULAR` | No | Stored for reference. The struck-through amount is the regular price. |
| `STRIPE_PRICE_MONTHLY` | No | Defaults to the live monthly sale price. |
| `STRIPE_PRICE_MONTHLY_REGULAR` | No | Reference id for the $199 price. |
| `STRIPE_PRICE_ANNUAL` | No | Defaults to the live annual sale price. |
| `STRIPE_PRICE_ANNUAL_REGULAR` | No | Reference id for the $1,999 price. |
| `STRIPE_PRICE_FOIA` | No | Defaults to the live $199 FOIA price. |
| `STRIPE_PRICE_FOIA_5PACK` | No | Defaults to the live $899 pack price. |
| `SMTP_HOST` | No | When empty, mail is printed to the service logs, including password-reset links. |
| `SMTP_PORT` | No | Defaults to `587`. Port `465` uses implicit TLS. |
| `SMTP_USER` | No | SMTP username, when the server requires auth. |
| `SMTP_PASS` | No | SMTP password. |
| `SMTP_FROM` | No | From address. Defaults to `StateWatchPro <hello@statewatchpro.com>`. |
| `NODE_VERSION` | No | Blueprint sets `22`. |
| `PORT` | Set by Render | The process listens on `0.0.0.0:$PORT`. |

`SWP_MEMORY=1` forces the in-memory store outside production. It is for local UI checks only. Production ignores it and requires `DATABASE_URL`.

## Stripe webhook

In the Stripe Dashboard, add an endpoint:

`https://app.statewatchpro.com/stripe/webhook`

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Paste that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. Event ids are stored so a retry does not grant access or credits twice.

## Local development

```bash
cd app
npm ci
export SESSION_SECRET="$(openssl rand -hex 24)"
export APP_URL="http://127.0.0.1:3000"
npm start
```

Without `DATABASE_URL`, the process keeps accounts in memory and drops them on exit. With `DATABASE_URL`, it applies `migrations/` before listening.

```bash
npm test
```

## Deploy on Render

1. Open the Render Dashboard and create a Blueprint from this repository. Render reads `render.yaml`.
2. Confirm the web service `statewatchpro-app` (root directory `app`) and the Postgres database `statewatchpro-db` (Basic, `basic-256mb`).
3. Fill the `sync: false` secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the `SMTP_*` values if you want real email. Leave SMTP empty until a mail server is ready. Password resets are then written to the logs.
4. Deploy. `preDeployCommand` runs `npm run migrate`. Startup migrates again if the database is configured. Both are safe to repeat.
5. In Render, confirm the custom domain `app.statewatchpro.com`, then add the DNS CNAME Render shows to that hostname.
6. Register the webhook URL above and pay with a live card only after the domain and signing secret are in place.
7. `GET /healthz` returns `{"ok":true}` when the process can reach the database.

GitHub Pages keeps serving the marketing site. This service does not build or replace those HTML files.
