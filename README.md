# Pixel Perfect

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/253b48b3-603b-44c4-b639-75e732f750f9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Configuration

Server settings live on the Cloudflare Worker, never in the browser bundle (see `src/lib/server-api.ts`).

| Name | Type | Purpose |
| --- | --- | --- |
| `STAFF_PASSWORD` | secret | Staff sign-in password. Sign-in is disabled while it is unset. |
| `SESSION_SECRET` | secret | Signs staff sessions (HttpOnly cookie). |
| `STAFF_EMAILS` | var | Comma-separated staff emails (default: `admin@thefreshpooch.ca,hello@doggroomingtoronto.ca`). |
| `DEMO_STAFF_ACCESS`, `DEMO_STAFF_HINT` | var | Public demo only: one-click demo sign-in and the hint shown on the sign-in screen. Remove both for real use. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | secret / var | Real SMS sending. Without them the app says the SMS was not sent. |
| `GEMINI_API_KEY` | secret | Live Qimmiq answers and the AI owner copilot. Without it Qimmiq uses its built-in engine. |
| `BOOKINGS_DB` | D1 binding | Shared bookings and pet-parent accounts. Create the tables with the files in `migrations/` (`npx wrangler d1 execute thefreshpooch-bookings --remote --file migrations/0001_bookings.sql`, then `0002` to `0004`; if `--file` fails with an authentication error, pass the SQL with `--command`). |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | var / secret | Web Push key pair for staff alerts (new bookings, password requests) on phones and computers, no extra app. The private key is a JWK JSON string. Each staff device turns alerts on in the dashboard ("Alerts"). |
| `NTFY_TOPIC` | secret | Optional extra: the same staff alerts through the ntfy app. |
| `RESEND_API_KEY` + `RESET_EMAIL_FROM` | secret + var | Optional: password-reset links are emailed (Resend). Without them, the owner sends the one-time link from the dashboard ("Password help"). |

Set secrets with `npx wrangler secret put NAME --name thefreshpooch`; vars live in `wrangler.json`.

Data: with `VITE_API_URL` set, bookings go to the NestJS backend (`/booking/*`); without it, bookings from the portal, the quote and the Qimmiq cart are stored in D1 (`/api/bookings`) and staff see them on any device, while the sample route and history live in each browser (`src/lib/appointments.ts`). Pet parents sign up and sign in through `/api/account/*`; the sample account `jordan.m@torontoparents.ca` opens the demo portal. Prices for the whole app come from `src/lib/pricing.ts`.

Local server settings: put them in `.dev.vars` (git-ignored) and start with `node --env-file=.dev.vars node_modules/vite/bin/vite.js dev`.
