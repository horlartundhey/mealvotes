# MealVote 🍲

Everyone votes, the pot decides. A household gets three Nigerian meal options each day, votes (no account needed), and the majority wins.

**Stack:** React + TypeScript (Vite, Tailwind, TanStack Query, Framer Motion) · Node + Express + TypeScript · MongoDB (Mongoose) · Vitest + Supertest

## Layout

`client/` and `server/` are **independent packages**: each has its own `package.json`, lockfile and `vercel.json`, and is deployed as its own Vercel project. The root `package.json` only holds convenience scripts.

```
client/   React app            → Vercel project #2 (static)
  vercel.json                    SPA fallback + proxies /api/* to the server project
server/   Express API          → Vercel project #1 (serverless function)
  api/index.ts                   Vercel entry (exports the Express app)
  vercel.json                    routes /api/* to that function
  .env / .env.example            all environment variables live here
  seeds/ src/ tests/
```

## Run locally

```bash
npm run install:all                # root + client + server
cp server/.env.example server/.env # then set MONGODB_URI and a long random SESSION_SECRET
npm run seed:meals                 # loads the 51-meal Nigerian library (safe to re-run)
npm run dev                        # client http://localhost:5173, API http://localhost:4010
npm test                           # server unit + integration tests (in-memory Mongo, no setup)
```

The client's dev server proxies `/api` to the API port, read from `server/.env`, so the two can't disagree.

## Environment variables (`server/.env`)

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `MONGODB_URI` | local + Vercel server project | yes | Atlas connection string, include the db name (`…mongodb.net/mealvote?…`) |
| `SESSION_SECRET` | local + Vercel server project | yes | Long random string that hashes guest session tokens (changing it signs everyone out) |
| `PORT` | local only (default `4010`) | no | Local API port. Ignored on Vercel |
| `UNSPLASH_ACCESS_KEY` | local only | no | Only for `seed:images`, not needed at runtime |
| `NODE_ENV` | set by Vercel | – | `production` turns on `Secure` cookies (needs https) |

The **client project needs no environment variables.**

## Deploy to Vercel (two projects from one GitHub repo)

**Why the client proxies the API:** if the client and server sat on two different `*.vercel.app` domains, browsers would treat the guest session cookie as third-party and Safari/incognito would block it. Instead the client project rewrites `/api/*` to the server project, so the browser only ever talks to one origin: no CORS, first-party cookies.

### 1. Server project (deploy this first)
1. *Add New → Project →* import the repo. **Root Directory: `server`**. Framework preset: **Other**.
2. Environment Variables: `MONGODB_URI`, `SESSION_SECRET` (do **not** add `PORT`).
3. Deploy, then note its URL, e.g. `https://mealvote-server.vercel.app`, and check `<url>/api/health` returns `{"ok":true}`.
4. Atlas → Network Access → allow `0.0.0.0/0` (Vercel has no fixed IPs).

### 2. Client project
1. Open `client/vercel.json` and replace `https://mealvote-server.vercel.app` in the first rewrite with **your server project's URL**. Commit and push.
2. *Add New → Project →* import the same repo. **Root Directory: `client`**. Framework preset: **Vite**. No env vars.
3. Deploy, then open the client URL and create a household.

The server project is a plain API; share only the **client** URL with people. To use your own domain, attach it to the client project.

Preview deployments share whatever database `MONGODB_URI` points to; use a separate Atlas database for Preview if you don't want test households mixed with real ones.

## How it works

- **Household + invite link:** the owner creates a household and shares `/join/<token>`. Guests pick a name and join with a secure session cookie, no account.
- **Daily round:** the first person to open today's page creates it: 3 meals from the library, different categories where possible, skipping anything that won in the last 5 days.
- **Voting:** one vote each, changeable until close. Closes at **12:00 Africa/Lagos**, or as soon as everyone has voted. Opened after 11:00, the window is 2 hours instead. Votes stay secret until close.
- **Result:** more than half of the household wins. A tie starts round 2 with fresh meals. A second tie goes to a deterministic fallback: the tied meal eaten longest ago.
- **Game layer:** Chop Cards, the pot reveal, household streak, XP/levels and badges (all derived from real votes), and a calendar "chop log".

The server owns all rules (membership, deadlines, majority, selection). See `server/src/services/rules.ts` for the pure logic and `prd-product.md` for the product spec.

## Meal images

Photos are hotlinked from Wikimedia Commons / Unsplash with credit and licence stored per meal; meals without a confident match show a patterned placeholder.

```bash
npm run seed:images                      # only meals without an image yet
npm run seed:images -- --all             # retry everything (set UNSPLASH_ACCESS_KEY for better matches)
npm run seed:meals                       # push server/seeds/images.json into the database
```

Bad matches go in `server/seeds/image-blocklist.json`.
