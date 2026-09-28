# MealVote 🍲

Everyone votes, the pot decides. A household gets three Nigerian meal options each day, votes (no account needed), and the majority wins.

**Stack:** React + TypeScript (Vite, Tailwind, TanStack Query, Framer Motion) · Node + Express + TypeScript · MongoDB (Mongoose) · Vitest + Supertest

## Run locally

```bash
npm install
cp .env.example .env        # then set MONGODB_URI (and a long random SESSION_SECRET)
npm run seed:meals -w server   # loads the 51-meal Nigerian library (safe to re-run)
npm run dev                 # client http://localhost:5173, API http://localhost:4010
```

```bash
npm test                    # server: unit + integration tests (in-memory Mongo, no setup needed)
```

## How it works

- **Household + invite link:** the owner creates a household and shares `/join/<token>`. Guests pick a name and join with a secure session cookie, no account.
- **Daily round:** the first person to open today's page creates it: 3 meals from the library, different categories where possible, skipping anything that won in the last 5 days.
- **Voting:** one vote each, changeable until close. Closes at **12:00 Africa/Lagos**, or as soon as everyone has voted. Opened after 11:00, the window is 2 hours instead. Votes stay secret until close.
- **Result:** more than half of the household wins. A tie starts round 2 with fresh meals. A second tie goes to a deterministic fallback: the tied meal eaten longest ago.
- **Game layer:** Chop Cards, the pot reveal, household streak, XP/levels and badges (all derived from real votes, nothing extra to store), and a calendar "chop log".

The server owns all rules (membership, deadlines, majority, selection). See `server/src/services/rules.ts` for the pure logic and `prd-product.md` for the product spec.

## Meal images

Photos are hotlinked from Wikimedia Commons / Unsplash with credit and licence stored per meal; meals without a confident match show a patterned placeholder.

```bash
npm run seed:images -w server            # only meals without an image yet
npm run seed:images -w server -- --all   # retry everything (set UNSPLASH_ACCESS_KEY for better matches)
npm run seed:meals -w server             # push images.json into the database
```

Bad matches go in `server/seeds/image-blocklist.json`.

## Layout

```
client/   React app
server/   Express API, models, services, seeds, tests
```
