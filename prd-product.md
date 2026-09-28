Yes, I understand exactly what you're building. And I like the direction you're taking with the invite link and the way you want to introduce accounts.

There are really two separate product decisions here:

How people join a household and participate in voting without friction.

How the platform gets the meal options, adapts them to the Nigerian context, and presents three suitable choices for the day.

Let's design both so they work together.

1. The invite-link experience

The idea is: I create a group, share a link, and my people can start voting immediately.

No account required at the beginning.

Step 1 — Create a group

The owner opens MealVote.

MealVote

Plan meals together

Create household
Who are we feeding?

Set up your household and invite the people you'll eat with.

Household name
The Ibitoye Household
Your name
Olatunde

Household members

Olatunde (Owner)

You can invite other people after creating the household.

Create household

After clicking Create, the backend creates the household and generates an invitation.

Step 2 — Share the invite link
Your household is ready!

Invite your two other voters.

Your invite link

mealvote.app/join/ib7k2m

Copy link

Share invite

Send it to WhatsApp, Telegram, or anywhere else your household communicates.

The invite link identifies the household, not necessarily the person. Each person still needs to choose their own display name.

Step 3 — The person joins and votes

Tunde clicks the link from WhatsApp.

You're invited
Join The Ibitoye Household

Choose a name so everyone knows who voted.

Your name
Tunde

Today's meal vote

You're joining a household with 2 other voters.

Join & see today's meals

Then they see the three options and vote. No registration wall.

Important: How do we record their vote?

Even without an account, the backend can create a guest participant and record their vote.

For example:

Guest Participant
-----------------
id: guest_123

Household:
household_001

Display name:
Tunde

Joined at:
2026-09-23

Then:

Vote
----
participant_id: guest_123
voting_round_id: round_001
meal_id: meal_007

So their vote is recorded immediately. An account is not required for the vote to exist.

Step 4 — The subtle account invitation

After Tunde votes, don't force him to register.

Show something like:

Your vote is in! 🎉

You can come back tomorrow using this link.

Want to keep your voting history, save your favourite meals, and join future household votes without entering your name again?

Create your account — it's free.

Not now

This is the right kind of onboarding: the user has already received value, and the account is presented as a convenience rather than a requirement.

One technical detail: if Tunde creates an account later, the system should link the guest participant to his account, preserving his existing votes.

2. How do we get the meals onto the platform?

Yes, I understand the second part.

You want the platform to have a collection of meals, and every day it should provide three appropriate options for the household to vote on.

But you also want flexibility because Nigerian food choices depend on the situation:

What people feel like eating.

What ingredients are available.

How much money is available.

Whether someone has time to cook.

Whether the household wants something different.

Whether a particular meal was eaten recently.

My recommendation: Build a meal library + daily meal generator + manual control.

Don't make the whole system depend on AI, and don't make the owner manually create every single day's options either. Combine the two.

3. The meal system architecture
Meal Library

All available Nigerian meals and household favourites

Daily Meal Generator

Filters meals by preferences, history, budget and availability

Today's 3 options

Owner can accept, replace or manually choose meals

Household Voting

Three people select their preferred meal

The key distinction:

The meal library contains possibilities. The daily generator creates suggestions. The household chooses what actually gets eaten.

4. Option A — Manually add meals

This is the easiest way to start.

You, as the household owner, have a page:

Meal Library
Your meals

Manage meals available for voting.

Library

Jollof Rice + Chicken

Rice • Chicken • Nigerian

Active

Beans + Plantain

Beans • Plantain • Nigerian

Active

Yam + Egg Sauce

Yam • Egg • Nigerian

Active

Add a meal

When adding a meal, you could enter:

Field

	

Example




Meal name

	

Jollof Rice + Chicken




Category

	

Rice




Protein

	

Chicken




Meal type

	

Major meal




Cuisine

	

Nigerian




Estimated cost

	

₦8,000




Preparation time

	

1 hour




Active

	

Yes

You can also add a photo and short description.

Why manual entry is useful

You control the meals.

You avoid inappropriate suggestions.

You can add family favourites.

You can adapt meals to Nigerian availability.

No AI cost or API complexity.

The downside

You have to build the library yourself.

For an MVP, though, this is perfectly fine. You could seed the platform with 50–100 meals and let the household add more over time.

5. Option B — Generate meals automatically

This is where MealVote becomes more interesting.

Instead of you opening the app and manually selecting meals every day, the platform can generate options automatically.

Example:

Today's suggested meals
Today's options

Wednesday, September 23

3 options
Fried Rice + Chicken
Option A

Rice • Chicken • Medium effort

A familiar rice meal with a protein option.

Spaghetti + Beef
Option B

Pasta • Beef • Quick preparation

A different option from rice-based meals.

Yam + Egg Sauce
Option C

Yam • Egg • Moderate effort

A non-rice alternative for variety.

Refresh suggestions

The system could use rules such as:

Generate 3 meals where:

1. Meal is active.
2. Meal is a major meal.
3. Meal was not eaten recently.
4. Meal is suitable for the household.
5. Meal fits today's budget.
6. Meal is available or can be prepared.
7. Options have some variety.

Then it selects three.

But here's where I would introduce an important distinction.

6. Should AI generate the meals?

AI can help generate and recommend meals, but I would not let AI be the only source of truth.

Why?

Imagine the household is in Lagos and the AI suggests:

Grilled salmon + quinoa + asparagus.

Technically, that's a meal. But it might not be what your household wants, what is available nearby, or what fits the budget.

For your product, I would use AI as an optional assistant.

AI could help with:

Suggesting new meals.

Generating meal descriptions.

Grouping meals into categories.

Finding alternatives to a meal.

Suggesting meals based on available ingredients.

Creating a weekly shopping list.

The meal database should control:

Whether a meal is active.

Whether it's a major meal.

Whether it has been eaten recently.

Whether the household has excluded it.

Whether it's available for today's vote.

This keeps the product predictable.

7. The best approach: Three ways to get today's meals

I'd build three buttons for the owner.

Prepare today's vote

Choose how to get the three meal options.

1. Generate suggestions

The system chooses three suitable meals from the library.

2. Choose from library

The owner manually selects the three meals for today.

3. Refresh options

Replace one or all of today's suggestions with alternatives.

This is the flexibility you need.

For example:

The generator suggests beans, rice and yam.

But today you don't want rice.

The owner clicks Refresh rice.

The system replaces it with:

Spaghetti + Beef.

The other two options remain unchanged.

This is better than regenerating everything and losing options people already like.

8. How should we structure Nigerian meals?

I would seed the library with categories rather than just a flat list of random foods.

Rice meals
6

Jollof Rice + Chicken

Fried Rice + Chicken

Ofada Rice + Sauce

Coconut Rice + Fish

White Rice + Stew

Rice + Beans + Plantain

Swallow meals
8

Eba + Egusi Soup

Pounded Yam + Egusi

Amala + Ewedu

Semo + Vegetable Soup

Fufu + Okro Soup

Beans and plantain
6

Beans + Plantain

Beans Porridge

Moi Moi + Pap

Akara + Pap

Yam, potatoes and other meals
7

Yam + Egg Sauce

Boiled Yam + Garden Egg Sauce

Spaghetti + Beef

Potato Porridge

Sweet Potato + Egg

Plantain + Egg

This is just a starter library, not a fixed menu. The household can add its own meals.

9. How do we handle "today is not a rice day"?

This is where I would create meal preferences and daily constraints.

Before generating the meals, the owner can set today's preferences.

Today's settings
Customize today's meals

These settings affect what the generator suggests.

Meal preference
No preference
Exclude today
Rice
Beans
Swallow

The owner can select any categories to avoid.

Budget for major meal
₦5,000 – ₦10,000
Preparation time
Under 1 hour

Generate 3 meals

Example:

Today: No rice, under ₦10,000, moderate preparation.

The generator might return:

Beans + Plantain

Yam + Egg Sauce

Spaghetti + Beef

This is much closer to the real problem you're solving.

10. What if the three people have different preferences?

This is important because one person's preference shouldn't necessarily override everyone else's.

Suppose:

Olatunde doesn't want rice.

Tunde likes rice.

Bola doesn't mind rice.

The system should not automatically eliminate all rice meals unless the group has a hard restriction.

Instead, it could generate a mixture:

Option A: Beans + Plantain

Option B: Jollof Rice + Chicken

Option C: Yam + Egg Sauce

Then everyone votes.

The majority still decides.

But if someone says:

"I cannot eat peanuts."

That should be a hard exclusion for the relevant meal.

Two kinds of preferences

Type

	

Example

	

Effect




Dislike

	

"I don't like beans"

	

Reduce suggestions or allow voting




Exclusion

	

"I cannot eat peanuts"

	

Exclude meals containing peanuts

This distinction will be useful later when you build the preference system.

11. How do we build the month?

I would not generate 30 fixed meals all at once and lock them in.

Instead:

Generate daily, but maintain a monthly plan.

For example:

September 23
→ Generate 3 meals
→ Vote
→ Winner becomes today's meal

September 24
→ Generate 3 new meals
→ Avoid recent repeats
→ Vote

September 25
→ Generate 3 new meals
→ Vote

Then the calendar shows the actual history.

This allows the household to change its mind without destroying the whole month's plan.

Optional: Plan the month ahead

Later, you could add:

Generate monthly meal plan

The system creates a 30-day draft with one major meal per day.

The owner can edit the draft before publishing it.

But the daily voting should still be able to change a particular day.

12. The data model for meals

Since you're building with React + Node.js, here's how I'd think about the database.

meals

Stores the master meal library.

id
name
description
category
meal_type
cuisine
preparation_time
estimated_cost
image_url
is_active
created_by
created_at

Example:

{
  "name": "Jollof Rice + Chicken",
  "category": "rice",
  "meal_type": "major",
  "cuisine": "nigerian",
  "preparation_time": 60,
  "estimated_cost": 8000,
  "is_active": true
}
daily_meals

Stores what was selected for a particular day.

id
household_id
date
winning_meal_id
status
meal_options

Stores the options presented for a day or voting round.

id
voting_round_id
meal_id
option_order
is_active
meal_preferences

Stores household or individual preferences.

id
household_id
user_id
meal_id
preference
meal_history

You can either derive this from winning meals in daily_meals, or maintain a dedicated history table if you need richer tracking.

The important thing is to distinguish:

Meals in the library.

Meals suggested today.

Meals voted for.

Meals actually selected/eaten.

Those are not always the same thing.

13. What I would build first

For the actual MVP, I would avoid AI initially.

Phase 1 — Make the real household problem work

Create household.

Generate invite link.

Join with name.

Add meals manually.

Seed Nigerian meals.

Generate 3 random suitable options.

Replace an option.

Vote.

Determine winner.

View monthly history.

Phase 2 — Make the meal system smarter

Meal preferences.

Excluded categories.

Budget.

Preparation time.

Prevent repeated meals.

Manual daily constraints.

Shopping list.

Phase 3 — Add AI

AI meal suggestions.

AI-generated meal descriptions.

Suggest alternatives based on available ingredients.

AI-assisted monthly planning.

Natural language requests like:

"We don't want rice today, we have ₦7,000 and we want something we can cook in 45 minutes."

Then the AI suggests meals from your library or proposes new ones for the owner to approve.

My recommendation for the product

I'd name the two sections:

1. Household

This handles:

Create group.

Invite link.

Join household.

Members.

Voting access.

Preferences.

2. Meal Planning

This handles:

Meal library.

Add meal.

Generate today's options.

Manual selection.

Refresh options.

Monthly calendar.

Meal history.

And one key rule:

The household owner controls the meal library, but the household members control the final meal choice through voting.

That gives you a product that is simple enough to use every day but has enough engineering depth to become a strong full-stack project.

Before we start building, I want to settle four decisions
MealVote — Product decisions

Choose your preferred setup. You can change any of these later.

1. Where should meals come from?

Manual meal library — we add meals ourselves.
AI-generated meals — the system creates suggestions.
Hybrid — manual library plus AI suggestions.

2. How should guest members work?

Join by name, vote as guest, optional account after voting.
Join by name, but create an account before voting.

3. How should daily meals be generated?

Automatically every day from the library.
Owner manually selects the 3 options.
Automatic suggestions, with manual replacement and editing.

4. What do you want to build first?

The MVP — household, invite link, meals, voting.
The complete product flow and screen design first.
Database and backend architecture first.
Continue with these decisions
Today 10:19 PM
My MealVote decisions: Meal source: manual; Guest accounts: guest; Daily generation: automatic; First build focus: mvp. Let's proceed with the product design and implementation plan.

Perfect. With those decisions, I’d keep MealVote intentionally small and real-world usable first. The MVP should prove one complete loop:

Create household → share invite → guests join → system generates 3 meals → everyone votes → majority wins → meal is recorded → next day continues.

MealVote MVP
Product rules
Decision	MVP rule
Meal source	Manually managed meal library
Members	Guests can participate without accounts
Daily options	Automatically generated
Daily options	3 meals
Voters	3 initially, but backend supports more
Votes	1 vote/person/round
Change vote	Allowed until voting closes
Winner	>50% of eligible votes
1–1–1 tie	Generate a fresh set of 3 options
Second tie	System fallback
Meal history	Always recorded
Accounts	Optional after guest votes
Major meal	One winning meal/day
Secondary food	Out of MVP initially
1. The core user journey

This is the flow I'd build before anything else.

                    LANDING PAGE
                         │
                         ▼
                  Create Household
                         │
                         ▼
                Household Dashboard
                         │
                         ▼
                  Generate Invite
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Person 2 joins          Person 3 joins
       through link            through link
             │                       │
             └───────────┬───────────┘
                         ▼
                  Today's Voting
                         │
                         ▼
                 3 meal options
                         │
                         ▼
                    Everyone votes
                         │
                         ▼
                    Calculate result
                    /             \
                majority           tie
                   │                │
                   ▼                ▼
                 WINNER        New 3 options
                   │                │
                   ▼                ▼
              Save meal       Vote again
                   │                │
                   └───────┬────────┘
                           ▼
                     Meal History

That's our vertical slice.

We shouldn't build settings, AI, shopping lists, nutrition, etc. until this works.

2. Screen structure

I'd start with approximately 8 screens.

Public
Landing page
Join household
Household
Create household
Household dashboard
Invite members
Voting
Today's meal
Voting result
History
Monthly meal calendar

That's enough for a legitimate MVP.

3. Screen 1 — Landing page

Very simple.

What are we eating today?

Stop spending 30 minutes deciding what to eat.

Create your household, invite your people, and let everyone vote.

Create a household

Join a household

Don't over-design this.

The product's value proposition is immediately understandable.

4. Screen 2 — Create household
Create your household

Household name
[ The Ibitoye Household ]

Your name
[ Olatunde ]

[ Create Household ]

After submission:

Household created 🎉

Your household is ready.

Invite your household members to start voting.

[ Copy Invite Link ]

[ Go to Today's Meal ]
5. Screen 3 — Join household

The guest receives:

mealvote.app/join/abc123

They see:

You've been invited!

The Ibitoye Household

Enter your name to join today's meal vote.

Your name

[ Tunde ]

Join & Vote

No password.

No email.

No account.

No friction.

6. Guest identity

This is an important implementation detail.

When Tunde joins, the backend creates:

GuestParticipant

id: gp_123
household_id: household_001
display_name: Tunde
session_token: ...

The browser receives a secure session/cookie.

So when Tunde votes:

POST /votes

participant = gp_123
meal = meal_007
round = round_001

We know exactly who voted.

Later

After voting:

Your vote has been recorded.

Want to keep your voting history and join future votes automatically?

Create an account

Maybe later

If they create an account, we associate:

guest_participant
        ↓
user

Their historical votes remain intact.

7. Screen 4 — Household dashboard

This becomes the home screen.

Good morning, Olatunde 👋

The Ibitoye Household

┌─────────────────────────────┐
│ Today's Meal                │
│                             │
│ Voting is open              │
│ 2 of 3 members have voted   │
│                             │
│ [ Vote Now ]                │
└─────────────────────────────┘

Members
👑 Olatunde
   Tunde
   Bola

[ Invite Member ]

This Month
12 meals decided

For a guest:

Good morning, Tunde 👋

The Ibitoye Household

Today's meal
Voting is open

[ Vote Now ]

Don't expose admin functionality to guests.

8. Screen 5 — Today's voting

This is the most important screen in the entire application.

What's for dinner?

Monday, September 28

Choose one:

┌─────────────────────────┐
│ 🍛                     │
│ Jollof Rice + Chicken  │
│                         │
│ Rice • Chicken          │
│                         │
│ ○ Choose this           │
└─────────────────────────┘

┌─────────────────────────┐
│ 🍝                     │
│ Spaghetti + Beef       │
│                         │
│ Pasta • Beef            │
│                         │
│ ○ Choose this           │
└─────────────────────────┘

┌─────────────────────────┐
│ 🍠                     │
│ Yam + Egg Sauce        │
│                         │
│ Yam • Egg               │
│                         │
│ ○ Choose this           │
└─────────────────────────┘

At the bottom:

Voting closes at 10:00 AM

Then:

Submit Vote

After voting:

✓ Vote recorded

And:

You can change your vote until voting closes.

9. Don't reveal too much voting information

This is something I'd deliberately test.

If Tunde votes and immediately sees:

Jollof — 2
Spaghetti — 0
Yam — 0

he might simply follow the majority.

Instead, initially show:

Your vote has been recorded.

2 of 3 members have voted.

Then reveal the final result when voting closes.

This makes the voting more genuine.

We can later decide whether live vote counts are desirable.

10. Screen 6 — Results

When voting closes:

Today's Meal 🎉
Jollof Rice + Chicken

2 of 3 people voted for this meal.

Olatunde   → Jollof
Tunde      → Jollof
Bola       → Spaghetti

Then:

Enjoy your meal! 🍽️

And save it into history.

11. Automatic meal generation

This is where our manual meal library comes in.

We create something like:

Meal Library
───────────────
Jollof Rice + Chicken
Fried Rice + Chicken
White Rice + Stew
Beans + Plantain
Yam + Egg Sauce
Amala + Ewedu
Eba + Egusi
Spaghetti + Beef
...

Every morning the backend runs:

Generate today's options

The algorithm:

1. Get active meals
        ↓
2. Remove recently eaten meals
        ↓
3. Remove excluded meals
        ↓
4. Apply household preferences
        ↓
5. Ensure variety
        ↓
6. Randomly/select 3
        ↓
7. Create voting round
12. Meal repetition rules

For MVP, let's keep this simple.

A meal cannot be suggested if it was the winning meal within the last 5 days.

So:

Sept 20 → Jollof
Sept 21 → Beans
Sept 22 → Yam
Sept 23 → Spaghetti
Sept 24 → Eba
Sept 25 → Jollof

Jollof becomes eligible again.

This can become configurable later.

13. The tie system

Our voting service should have a very clear state machine.

VOTING_OPEN
     │
     ▼
VOTING_CLOSED
     │
     ▼
CALCULATING_RESULT
     │
     ├── Majority
     │       ↓
     │    COMPLETED
     │
     └── No majority
             ↓
       GENERATE_NEW_OPTIONS
             ↓
          REVOTE

Maximum:

Round 1
   ↓
No majority
   ↓
Round 2
   ↓
No majority
   ↓
Fallback

No endless voting.

14. The fallback

I'd make the fallback deterministic:

Choose the eligible meal that hasn't been eaten for the longest time.

For example:

Beans — last eaten 3 days ago
Yam — last eaten 8 days ago
Jollof — last eaten 5 days ago

If there's another tie:

Yam

wins because it has been longest since it was eaten.

That is much better than:

Math.random()

because there's a logical explanation for the result.

15. Database architecture

I'd use PostgreSQL.

The initial schema:

users
─────
id
name
email
created_at


households
──────────
id
name
owner_id
invite_token
created_at


participants
────────────
id
household_id
user_id NULL
display_name
session_token
created_at


meals
─────
id
name
description
category
image_url
is_active
created_at


voting_rounds
─────────────
id
household_id
date
round_number
status
opened_at
closes_at
winner_meal_id NULL


voting_options
──────────────
id
voting_round_id
meal_id


votes
─────
id
voting_round_id
participant_id
meal_id
created_at
updated_at


meal_history
────────────
id
household_id
meal_id
date

There is one particularly important constraint:

UNIQUE(
    voting_round_id,
    participant_id
)

That guarantees one vote per person per round at the database level.

16. Backend API

I'd build the Node/Express API around the domain rather than around generic CRUD.

Household
POST   /api/households
GET    /api/households/:id
POST   /api/households/:id/invite
Joining
GET    /api/invites/:token
POST   /api/invites/:token/join
Meals
GET    /api/meals
POST   /api/meals
PATCH  /api/meals/:id
Daily voting
GET    /api/households/:id/today
POST   /api/voting-rounds/:id/vote
PATCH  /api/voting-rounds/:id/vote
GET    /api/voting-rounds/:id/result
History
GET /api/households/:id/history

That's enough for MVP.

17. Automatic generation: cron or request?

For the first version, don't introduce queues or complicated infrastructure.

We can generate today's options when the first person opens the household that day:

GET /today
       ↓
Does today's voting round exist?
       ↓
NO → Generate it
       ↓
YES → Return existing round

This has a major advantage:

You don't need a background worker just to generate three meals.

Later, when you're comfortable with the product, we can introduce:

Cron
   ↓
07:00
   ↓
Generate daily voting rounds

Or even:

BullMQ / Redis
       ↓
Daily meal generation job

But that's unnecessary for MVP.

18. Frontend architecture

Since you're focusing on React/Node, I'd use:

React
TypeScript
React Router
TanStack Query
Tailwind CSS

Something like:

src/
├── components/
│   ├── MealCard.tsx
│   ├── VoteButton.tsx
│   ├── MemberList.tsx
│   └── InviteCard.tsx
│
├── pages/
│   ├── Landing.tsx
│   ├── CreateHousehold.tsx
│   ├── JoinHousehold.tsx
│   ├── Dashboard.tsx
│   ├── Today.tsx
│   └── History.tsx
│
├── services/
│   ├── householdApi.ts
│   ├── mealApi.ts
│   └── votingApi.ts
│
├── hooks/
│   ├── useHousehold.ts
│   ├── useToday.ts
│   └── useVote.ts
│
└── types/
    ├── household.ts
    ├── meal.ts
    └── voting.ts
19. MVP development sequence

I wouldn't build everything at once.

Sprint 1 — Foundation

Goal: A household can exist.

Set up React
Set up Node/Express
Set up PostgreSQL
Database migrations
Household model
Participant model
Create household
Basic dashboard

Done when:

I can create a household and see myself as its owner.

Sprint 2 — Invitations

Goal: Another person can join.

Generate invite token
Share invite URL
Join page
Guest participant creation
Guest session
Member list

Done when:

I can copy a link, open it in another browser, enter "Tunde", and join the household.

Sprint 3 — Meal library

Goal: The system knows what meals exist.

Meal table
Seed Nigerian meals
Meal management
Active/inactive meals
Images
Categories

Done when:

The household has a library of meals from which options can be generated.

Sprint 4 — Daily generation

Goal: The system produces today's 3 meals.

Daily round
Meal selection algorithm
Recent meal exclusion
Three options
Voting deadline

Done when:

Opening the household on a new day automatically creates three appropriate options.

Sprint 5 — Voting

Goal: Three people can vote.

Vote endpoint
One vote/person
Change vote
Vote validation
Close voting
Majority calculation
Winner

Done when:

Two people vote for Jollof and Jollof becomes the winner.

Sprint 6 — Tie handling

Goal: The system handles disagreement.

Detect 1–1–1
Generate second round
Revote
Fallback
Record both rounds

Done when:

The application never gets stuck because the three people disagree.

Sprint 7 — History

Goal: The application remembers what happened.

Daily history
Monthly calendar
Winning meals
Meal frequency
Repetition prevention

Done when:

I can open September and see everything the household ate.

20. The MVP success test

Before we call MealVote MVP complete, we should be able to perform this exact scenario:

Browser A

Olatunde:

Creates "Home"

Gets:

mealvote.app/join/ABC123
Browser B

Tunde:

Opens ABC123

Enters:

Tunde
Browser C

Bola:

Opens ABC123

Enters:

Bola

The system generates:

Jollof + Chicken
Beans + Plantain
Yam + Egg Sauce

Everyone votes:

Olatunde → Jollof
Tunde    → Jollof
Bola     → Yam

System:

Jollof + Chicken
2/3 votes

WINNER

Tomorrow:

Jollof is excluded

New options are generated.

Then we deliberately test:

Olatunde → Jollof
Tunde    → Beans
Bola     → Yam

System detects:

1 / 1 / 1

and creates:

ROUND 2

That's our first end-to-end acceptance test.

One thing I would change from our earlier idea

I would not build the monthly planner first even though the product is month-oriented.

The month should initially be a history/calendar view, while the actual decision happens one day at a time.

That gives us a much cleaner core:

Today → 3 options → Vote → Winner → History

Once that works reliably, the monthly planning layer becomes an enhancement rather than something the core system depends on.

# MealVote

## MVP Product & Technical Implementation Specification

**Version:** 1.0
**Status:** Ready for implementation
**Product type:** Household meal-planning and voting application
**Primary MVP stack:** React + TypeScript, Node.js + Express, PostgreSQL

---

# 1. Product Overview

MealVote is a lightweight household meal-planning application that solves the recurring problem:

> **"What are we eating today?"**

A household creates a group, invites members through a shareable link, and receives three automatically selected meal options each day.

Members vote for one option.

The meal receiving a majority becomes the household's meal for that day.

The MVP is designed around three primary voters, but the backend should support a variable number of household members.

---

# 2. Product Goals

## Primary goal

Make deciding what to eat a fast, repeatable, and democratic process.

## MVP goals

The MVP must allow a user to:

1. Create a household.
2. Receive a unique invitation link.
3. Share the invitation link.
4. Allow guests to join without creating an account.
5. Automatically generate three meal options for the day.
6. Allow each member to vote once.
7. Allow a member to change their vote before voting closes.
8. Determine a majority winner.
9. Handle a 1–1–1 tie.
10. Record the winning meal.
11. Prevent excessive meal repetition.
12. View the household's meal history.
13. Continue the process on subsequent days.

---

# 3. Explicitly Out of Scope for MVP

The following should NOT be built initially:

* AI-generated meals
* Nutrition tracking
* Calorie tracking
* Grocery/shopping lists
* Food delivery integration
* Payment integration
* Restaurant ordering
* Complex dietary analysis
* Meal recipes
* Breakfast/lunch/dinner scheduling
* Multiple meals per day
* Advanced recommendation engine
* Push notifications
* Social sharing
* Public households
* Complex account management
* Subscription/payment plans

These can become future product capabilities.

---

# 4. Core Product Decisions

| Area                     | MVP Decision                     |
| ------------------------ | -------------------------------- |
| Meal source              | Manually maintained meal library |
| Daily meal generation    | Automatic                        |
| Daily options            | 3                                |
| Members                  | Guest participants               |
| Account required to vote | No                               |
| Account creation         | Optional after participation     |
| Initial household size   | 3 people                         |
| Backend household size   | Variable                         |
| Major meals              | 1 per day                        |
| Voting                   | 1 vote per participant           |
| Vote changes             | Allowed before deadline          |
| Majority                 | More than 50% of eligible voters |
| First tie                | Generate a new set of 3 options  |
| Second tie               | Deterministic fallback           |
| Meal repetition          | Prevent recently eaten meals     |
| History                  | Persisted                        |
| AI                       | Not part of MVP                  |

---

# 5. Core User Roles

## 5.1 Household Owner

The person who creates the household.

Permissions:

* Create household
* View household
* Generate invitation
* Share invitation
* View members
* Remove members
* Manage meal library
* View meal history
* View voting results

## 5.2 Guest Participant

A person who joins through an invitation link.

Permissions:

* Join household
* View today's meal options
* Vote
* Change their vote before deadline
* View voting result
* View household meal history

A guest does not need an account.

## 5.3 Registered User — Future/Optional MVP Enhancement

A guest may later convert their participant identity into an account.

Their previous votes and history must remain associated with them.

---

# 6. Primary User Journey

```text
Create Household
       ↓
Generate Invite Link
       ↓
Share Link
       ↓
Guest Opens Link
       ↓
Guest Enters Name
       ↓
Guest Joins Household
       ↓
Today's Voting Round Exists?
       ↓
        NO
        ↓
Generate 3 Meals
       ↓
Everyone Votes
       ↓
Voting Closes
       ↓
Calculate Result
       ↓
Majority?
   ↙          ↘
 YES           NO
  ↓             ↓
Winner       Generate
Recorded     New Options
                ↓
              Revote
                ↓
           Majority?
           ↙      ↘
         YES       NO
          ↓         ↓
       Winner     Fallback
          ↓         ↓
          └────┬────┘
               ↓
          Meal History
```

---

# 7. Household Creation Flow

## Screen

### Create your household

Fields:

* Household name
* Creator/display name

Example:

```text
Household name:
The Ibitoye Household

Your name:
Olatunde
```

User clicks:

**Create Household**

## Backend actions

1. Create household.
2. Create owner participant.
3. Generate unique invite token.
4. Return household information.
5. Return invitation URL.

Example:

```text
https://mealvote.app/join/abc123xyz
```

---

# 8. Invitation Flow

The invitation URL identifies the household.

Example:

```text
/join/:inviteToken
```

Guest opens it.

The application displays:

> You've been invited to The Ibitoye Household.

Input:

```text
Your name
```

Guest clicks:

**Join & Vote**

Backend:

1. Validate invitation.
2. Validate household.
3. Create guest participant.
4. Create guest session.
5. Associate session with participant.
6. Redirect to today's voting page.

No account is required.

---

# 9. Guest Identity Model

A guest participant must have a persistent identity during their participation.

Example:

```text
Participant
-------------------------
id
household_id
user_id
display_name
session_token
status
created_at
```

For a guest:

```text
user_id = NULL
```

For a registered participant:

```text
user_id = USER_ID
```

This allows the same participation model to support both guests and registered users.

---

# 10. Guest-to-Account Conversion

After voting, optionally display:

> **Your vote has been recorded.**
>
> Create an account to keep your voting history and make future household voting easier.

Actions:

**Create account**

**Maybe later**

If the guest creates an account, the system associates:

```text
Guest Participant
        ↓
Registered User
```

Historical votes remain unchanged.

This should be an account-linking operation, not a new participant.

---

# 11. Daily Meal Generation

The meal library is manually populated.

Example meals:

```text
Jollof Rice + Chicken
Fried Rice + Chicken
White Rice + Stew
Beans + Plantain
Yam + Egg Sauce
Amala + Ewedu
Eba + Egusi
Spaghetti + Beef
Moi Moi + Pap
Ofada Rice + Sauce
```

Each meal has metadata.

Example:

```json
{
  "name": "Jollof Rice + Chicken",
  "category": "rice",
  "mealType": "major",
  "cuisine": "nigerian",
  "preparationTime": 60,
  "estimatedCost": 8000,
  "isActive": true
}
```

---

# 12. Meal Generation Algorithm

When today's voting round does not exist:

```text
1. Retrieve active meals.
2. Filter to major meals.
3. Remove recently eaten meals.
4. Remove household-excluded meals.
5. Apply future preference rules when available.
6. Ensure reasonable category variety.
7. Select three meals.
8. Create voting round.
9. Create three voting options.
```

The MVP does not require AI.

The system should select from the manually maintained meal library.

---

# 13. Meal Repetition Rule

A meal that won recently should not immediately appear again.

MVP rule:

> A meal cannot be automatically selected if it was the household's winning meal within the previous 5 days.

Example:

```text
Sept 20 — Jollof
Sept 21 — Beans
Sept 22 — Yam
Sept 23 — Spaghetti
Sept 24 — Eba
Sept 25 — Jollof
```

Jollof becomes eligible again after the defined cooldown period.

The cooldown should be stored as configuration rather than hard-coded throughout the application.

---

# 14. Daily Voting Round

Every household has one primary voting round per day.

Example:

```text
VotingRound

date:
2026-09-28

status:
OPEN

roundNumber:
1

closesAt:
2026-09-28T10:00:00+01:00
```

A round contains exactly three initial options.

---

# 15. Voting Rules

Each participant may have:

**One active vote per round.**

Database constraint:

```text
UNIQUE(voting_round_id, participant_id)
```

A participant may change their vote before the voting deadline.

After the deadline:

```text
Voting is locked.
```

Votes cannot be changed.

---

# 16. Majority Calculation

The winning condition is:

```text
votes > eligibleVoters / 2
```

Equivalent:

```text
majority = floor(eligibleVoters / 2) + 1
```

Examples:

### 3 voters

```text
Majority = 2
```

### 4 voters

```text
Majority = 3
```

### 5 voters

```text
Majority = 3
```

This prevents the business logic from being permanently tied to three people.

---

# 17. Non-Voting Members

A member who has not voted should not prevent a majority winner.

Example:

```text
Olatunde → Jollof
Tunde    → Jollof
Bola     → No vote
```

Result:

```text
Jollof = 2
```

Jollof wins because two votes constitute a majority of three eligible participants.

---

# 18. Voting Tie

Example:

```text
Olatunde → Jollof
Tunde    → Beans
Bola     → Yam
```

Result:

```text
Jollof = 1
Beans  = 1
Yam    = 1
```

No majority exists.

The round becomes:

```text
NO_MAJORITY
```

The system generates three new options.

A second voting round is created:

```text
roundNumber = 2
```

The previous round remains recorded.

---

# 19. Second Tie

If the second round also produces no majority:

```text
ROUND 2
1 / 1 / 1
```

The system uses a deterministic fallback.

### Fallback rule

Select the eligible meal that has gone the longest without being eaten.

This is preferable to random selection because the system can explain its decision.

Example:

```text
Meal              Days since eaten

Jollof             5
Beans              3
Yam                9
```

Fallback:

```text
Yam
```

The final result is recorded as:

```text
selectionMethod = FALLBACK
```

---

# 20. Voting States

Voting rounds should use explicit states.

```text
OPEN
CLOSED
CALCULATING
COMPLETED
NO_MAJORITY
REVOTING
FALLBACK
```

Recommended lifecycle:

```text
OPEN
 ↓
CLOSED
 ↓
CALCULATING
 ├── majority → COMPLETED
 │
 └── no majority → REVOTING
                         ↓
                       OPEN
                         ↓
                      CLOSED
                         ↓
                    CALCULATING
                    ├── majority → COMPLETED
                    │
                    └── no majority → FALLBACK
                                          ↓
                                      COMPLETED
```

---

# 21. Meal History

Once a meal is selected, the system records it.

Example:

```text
MealHistory

household:
household_001

date:
2026-09-28

meal:
Jollof Rice + Chicken

selectionMethod:
MAJORITY

winningVotes:
2
```

Possible selection methods:

```text
MAJORITY
FALLBACK
```

This historical data is used for:

* Monthly calendar
* Meal repetition prevention
* Future analytics

---

# 22. Database Schema

## users

```text
id              UUID PK
name            VARCHAR
email           VARCHAR UNIQUE
password_hash   VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## households

```text
id              UUID PK
name            VARCHAR
owner_id        UUID FK → users.id
invite_token    VARCHAR UNIQUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## participants

```text
id              UUID PK
household_id    UUID FK
user_id         UUID NULL FK
display_name    VARCHAR
session_token   VARCHAR
status          VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Possible status:

```text
ACTIVE
INACTIVE
```

## meals

```text
id                  UUID PK
name                VARCHAR
description         TEXT
category            VARCHAR
meal_type           VARCHAR
cuisine             VARCHAR
preparation_time    INTEGER
estimated_cost      DECIMAL
image_url           TEXT
is_active           BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## voting_rounds

```text
id              UUID PK
household_id    UUID FK
date            DATE
round_number    INTEGER
status          VARCHAR
opened_at       TIMESTAMP
closes_at       TIMESTAMP
winner_meal_id  UUID NULL FK
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Unique constraint:

```text
(household_id, date, round_number)
```

## voting_options

```text
id              UUID PK
voting_round_id UUID FK
meal_id         UUID FK
option_order    INTEGER
created_at      TIMESTAMP
```

## votes

```text
id              UUID PK
voting_round_id UUID FK
participant_id  UUID FK
meal_id         UUID FK
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Unique constraint:

```text
(voting_round_id, participant_id)
```

## meal_history

```text
id                  UUID PK
household_id        UUID FK
meal_id             UUID FK
date                DATE
selection_method    VARCHAR
winning_votes       INTEGER
created_at          TIMESTAMP
```

---

# 23. Entity Relationships

```text
USER
 │
 │ 1
 │
 ▼
HOUSEHOLD
 │
 │ 1
 │
 ├───────────────┐
 │               │
 ▼               ▼
PARTICIPANTS    VOTING_ROUNDS
 │               │
 │               │
 ▼               ▼
VOTES        VOTING_OPTIONS
 │               │
 │               ▼
 └───────────► MEALS
                 │
                 ▼
            MEAL_HISTORY
```

Important relationship:

```text
Household
   ↓
Participants
   ↓
Votes
   ↓
Voting Round
   ↓
Meal
```

---

# 24. API Specification

## Household

### Create household

```http
POST /api/households
```

Request:

```json
{
  "name": "The Ibitoye Household",
  "ownerName": "Olatunde"
}
```

Response:

```json
{
  "id": "household_001",
  "name": "The Ibitoye Household",
  "inviteUrl": "/join/abc123"
}
```

---

### Get household

```http
GET /api/households/:householdId
```

Returns household details and active members.

---

### Generate invite

```http
POST /api/households/:householdId/invite
```

Returns:

```json
{
  "inviteUrl": "https://mealvote.app/join/abc123"
}
```

---

# 25. Invitation API

### Validate invite

```http
GET /api/invites/:token
```

Returns:

```json
{
  "valid": true,
  "household": {
    "id": "household_001",
    "name": "The Ibitoye Household"
  }
}
```

---

### Join household

```http
POST /api/invites/:token/join
```

Request:

```json
{
  "displayName": "Tunde"
}
```

Response:

```json
{
  "participant": {
    "id": "participant_001",
    "displayName": "Tunde"
  },
  "householdId": "household_001"
}
```

A secure guest session should be established at this point.

---

# 26. Meal API

### Get meals

```http
GET /api/meals
```

### Create meal

```http
POST /api/meals
```

Request:

```json
{
  "name": "Jollof Rice + Chicken",
  "description": "Nigerian jollof rice served with chicken.",
  "category": "rice",
  "mealType": "major",
  "cuisine": "nigerian",
  "preparationTime": 60,
  "estimatedCost": 8000,
  "imageUrl": "..."
}
```

### Update meal

```http
PATCH /api/meals/:mealId
```

### Deactivate meal

```http
PATCH /api/meals/:mealId/status
```

---

# 27. Today's Meal API

### Get today's voting round

```http
GET /api/households/:householdId/today
```

Server behavior:

```text
Does today's round exist?

YES
 → return it

NO
 → generate 3 options
 → create round
 → return it
```

This provides automatic generation without requiring a background job in the MVP.

---

# 28. Voting API

### Cast vote

```http
POST /api/voting-rounds/:roundId/votes
```

Request:

```json
{
  "mealId": "meal_001"
}
```

### Change vote

```http
PATCH /api/voting-rounds/:roundId/votes
```

Request:

```json
{
  "mealId": "meal_002"
}
```

Backend must verify:

1. Participant belongs to household.
2. Voting round belongs to that household.
3. Voting round is still open.
4. Meal is one of the round's options.
5. Participant has not violated voting rules.

---

# 29. Result API

```http
GET /api/voting-rounds/:roundId/result
```

Example:

```json
{
  "status": "COMPLETED",
  "winner": {
    "mealId": "meal_001",
    "name": "Jollof Rice + Chicken"
  },
  "votes": 2,
  "eligibleVoters": 3,
  "selectionMethod": "MAJORITY"
}
```

---

# 30. History API

```http
GET /api/households/:householdId/history
```

Optional query:

```text
?month=2026-09
```

Response:

```json
{
  "month": "2026-09",
  "days": [
    {
      "date": "2026-09-28",
      "meal": "Jollof Rice + Chicken",
      "selectionMethod": "MAJORITY"
    }
  ]
}
```

---

# 31. Frontend Routes

```text
/
```

Landing page.

```text
/create
```

Create household.

```text
/join/:inviteToken
```

Guest join page.

```text
/household/:householdId
```

Household dashboard.

```text
/household/:householdId/today
```

Today's voting page.

```text
/household/:householdId/result
```

Voting result.

```text
/household/:householdId/history
```

Monthly history.

```text
/household/:householdId/meals
```

Meal library.

---

# 32. Frontend Component Structure

```text
components/
│
├── household/
│   ├── HouseholdHeader
│   ├── MemberList
│   └── InviteCard
│
├── meals/
│   ├── MealCard
│   ├── MealGrid
│   └── MealLibrary
│
├── voting/
│   ├── VotingRound
│   ├── VoteButton
│   ├── VotingTimer
│   ├── VoteStatus
│   └── ResultCard
│
└── common/
    ├── Button
    ├── Modal
    ├── LoadingState
    ├── ErrorState
    └── EmptyState
```

---

# 33. State Management

For the MVP:

* React local state for simple UI state.
* TanStack Query for server state.
* Context only where genuinely necessary.

Important server state:

```text
household
participants
today's round
meal options
current participant
vote
result
history
```

Avoid creating a giant global Redux store for the MVP.

---

# 34. Security Requirements

Even though this is a small application, several things must be enforced on the backend.

## Never trust the frontend

The backend must determine:

* Who the participant is.
* Which household they belong to.
* Whether they can vote.
* Whether the voting round is open.
* Whether the selected meal is valid.

## Guest session

Do not expose a guest's raw identity as authorization.

Use a secure session mechanism.

## Invite tokens

Invite tokens should be:

* Random
* Difficult to guess
* Unique
* Stored securely
* Revocable/replaceable later

## Voting

Database constraint:

```text
ONE PARTICIPANT
+
ONE ROUND
=
ONE ACTIVE VOTE
```

---

# 35. Important Edge Cases

The MVP must handle:

### Guest joins twice

Don't create unlimited duplicate participants accidentally.

The application should identify an existing session and return the existing participant.

### Invalid invite

Display:

> This invitation is invalid or no longer available.

### Expired/inactive household

Prevent joining.

### Member tries to vote twice

Update their existing vote rather than creating another vote.

### Member tries to vote after deadline

Return:

```text
Voting is closed.
```

### Invalid meal ID

Reject the request.

### Meal isn't part of today's options

Reject the vote.

### No eligible meals

Display an administrative error and allow the owner to manage the meal library.

### Fewer than three eligible meals

Generate as many as possible and notify the owner that the library needs more eligible meals.

### Nobody votes

Do not invent a winner.

Mark the round:

```text
NO_VOTES
```

For MVP, the owner can trigger another voting round or select manually.

### Member leaves

Set membership/participant status to inactive.

Do not delete historical votes.

---

# 36. Acceptance Tests

The MVP is not complete until these scenarios work.

## Test 1 — Create household

**Given:** No household exists.

**When:** User creates a household.

**Then:**

* Household is created.
* User becomes owner.
* Invite URL is generated.

---

## Test 2 — Guest joins

**Given:** Valid invite URL.

**When:** Guest enters "Tunde".

**Then:**

* Participant is created.
* Guest is associated with household.
* Guest can see today's voting round.

---

## Test 3 — Automatic meal generation

**Given:** Household has no voting round today.

**When:** First member opens today's page.

**Then:**

* Three eligible meals are selected.
* Voting round is created.
* Same options are returned to every member.

---

## Test 4 — Two out of three

```text
A → Jollof
B → Jollof
C → Yam
```

Expected:

```text
Jollof wins.
```

---

## Test 5 — One-one-one

```text
A → Jollof
B → Beans
C → Yam
```

Expected:

```text
No majority.
Generate round 2.
```

---

## Test 6 — Second tie

Round 2:

```text
A → Rice
B → Beans
C → Yam
```

Expected:

```text
Fallback selection.
```

The eligible meal with the longest time since being eaten becomes the winner.

---

## Test 7 — Vote change

```text
Tunde → Jollof
```

Then:

```text
Tunde → Yam
```

Expected:

```text
Only Yam is counted as Tunde's active vote.
```

---

## Test 8 — Voting deadline

After the round closes:

```text
POST /votes
```

Expected:

```text
403/409
Voting is closed.
```

---

## Test 9 — Meal repetition

If Jollof won yesterday:

Expected:

```text
Jollof is excluded from today's automatic generation.
```

---

## Test 10 — History

After a winning meal is recorded:

Expected:

```text
September calendar
→ September 28
→ Jollof Rice + Chicken
```

---

# 37. MVP Sprint Plan

## Sprint 1 — Project Foundation

### Backend

* Initialize Node/Express project.
* Configure TypeScript.
* Configure PostgreSQL.
* Configure environment variables.
* Configure database migrations.
* Add base error handling.
* Add request validation.
* Add logging.

### Frontend

* Initialize React/TypeScript.
* Configure routing.
* Configure Tailwind.
* Create base layout.
* Create reusable UI components.

### Deliverable

Both applications run locally and communicate successfully.

---

# Sprint 2 — Household + Guest System

### Build

* Create household.
* Owner participant.
* Invite token.
* Invite URL.
* Join page.
* Guest participant.
* Guest session.
* Member list.

### Deliverable

Three different browser sessions can join the same household.

---

# Sprint 3 — Meal Library

### Build

* Meal database.
* Meal CRUD.
* Seed Nigerian meals.
* Active/inactive meals.
* Meal categories.
* Meal metadata.

### Deliverable

The system has a usable library of meals.

---

# Sprint 4 — Daily Meal Generation

### Build

* Voting round.
* Daily round creation.
* Three meal selection.
* Recent-meal filtering.
* Option persistence.

### Deliverable

Every household gets the same three options for the current day.

---

# Sprint 5 — Voting Engine

### Build

* Cast vote.
* Change vote.
* Voting deadline.
* Vote validation.
* Majority calculation.
* Winner.
* Result screen.

### Deliverable

The complete happy-path voting process works.

---

# Sprint 6 — Tie + History

### Build

* Tie detection.
* Second round.
* Second-round options.
* Fallback algorithm.
* Meal history.
* Monthly calendar.

### Deliverable

The application handles disagreement and remembers the outcome.

---

# Sprint 7 — Hardening

### Build

* Error states.
* Loading states.
* Empty states.
* Security validation.
* Database constraints.
* API tests.
* Frontend tests.
* Integration tests.
* Responsive design.
* Deployment.

### Deliverable

Production-ready MVP.

---

# 38. Suggested Project Structure

## Repository

```text
mealvote/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── models/
│   │   └── utils/
│   │
│   ├── migrations/
│   ├── seeds/
│   └── package.json
│
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── decisions.md
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

# 39. Engineering Principles

MealVote should be used as a proper learning-by-building project.

For each feature:

```text
Research
   ↓
Define problem
   ↓
Design
   ↓
Implement
   ↓
Test
   ↓
Review
   ↓
Document
```

Don't just make the feature work.

For example, when implementing voting, document:

> Why is the majority calculated on the backend?

> Why is a database unique constraint needed?

> Why do we store voting rounds rather than simply updating a daily meal?

> Why do we preserve guest participation history?

Those decisions become part of the project's engineering story.

---

# 40. Testing Strategy

## Unit tests

Test business logic independently.

Examples:

```text
calculateMajority()
determineWinner()
isMealEligible()
generateMealOptions()
shouldTriggerRevote()
selectFallbackMeal()
```

## Integration tests

Test API + database.

Examples:

```text
POST /households
POST /invites/:token/join
POST /voting-rounds/:id/votes
```

## End-to-end tests

Eventually test:

```text
Create household
→ Join with guest
→ Generate meals
→ Vote
→ Calculate result
→ Record history
```

---

# 41. Initial Seed Data

The MVP should launch with enough meals that the algorithm doesn't repeatedly run out of options.

Initial target:

**30–50 Nigerian meal combinations.**

Categories:

* Rice
* Beans
* Yam
* Plantain
* Pasta
* Swallow
* Potatoes
* Other Nigerian meals

Each meal should have:

* Name
* Category
* Description
* Major meal type
* Preparation time
* Estimated cost
* Image
* Active status

---

# 42. Product Analytics — Later

Do not build analytics into the first sprint.

Eventually we can track:

```text
Most selected meals
Most rejected meals
Average voting participation
Average time to decision
Number of revotes
Meals eaten per month
Meal category distribution
```

This can help answer:

> "What does this household actually like eating?"

---

# 43. Future Product Roadmap

Once the MVP is stable:

## V1

* Registered accounts
* Individual preferences
* Favourite meals
* Excluded meals
* Household settings
* Better meal-generation rules

## V2

* Weekly/monthly planning
* Shopping lists
* Ingredient aggregation
* Meal recipes
* Budget tracking

## V3

* AI-assisted meal suggestions
* Ingredient-based recommendations
* Natural-language meal planning
* Smart meal rotation
* Personalized recommendations

Example future interaction:

> "We have chicken, rice, eggs and plantain at home. We don't want anything too expensive and we want something that takes less than 45 minutes."

The AI could recommend from the household's approved meal library.

---

# 44. MVP Definition of Done

MealVote MVP is complete when a real household can perform this entire process:

```text
1. Create household
        ↓
2. Copy invite link
        ↓
3. Share link
        ↓
4. Two guests join
        ↓
5. System generates 3 meals
        ↓
6. Three people vote
        ↓
7. Majority is calculated
        ↓
8. Winner is recorded
        ↓
9. Voting closes
        ↓
10. Tomorrow gets new options
        ↓
11. Previous meal is considered by
    the repetition algorithm
        ↓
12. Household can view its monthly history
```

And importantly:

> **No single user can manipulate the result from the frontend.**

The backend remains the authority for membership, voting, deadlines, majority calculation, and meal selection.

---

# 45. First Build Milestone

The first milestone is deliberately small:

### Milestone 1 — "A Household Can Exist"

Build only:

```text
React
   ↓
Create Household
   ↓
Express API
   ↓
PostgreSQL
   ↓
Household created
   ↓
Invite URL generated
```

Then:

```text
Browser A
   ↓
Creates household

Browser B
   ↓
Opens invite URL
   ↓
Enters name
   ↓
Joins household

Browser C
   ↓
Opens same invite URL
   ↓
Enters name
   ↓
Joins household
```

**Do not build voting yet.**

Once that foundation is working, we move to the meal domain.

---

# 46. Recommended Development Order

The implementation order is therefore:

```text
PHASE 1
Project setup
        ↓
PHASE 2
Households
        ↓
PHASE 3
Guest invitations
        ↓
PHASE 4
Meal library
        ↓
PHASE 5
Daily meal generation
        ↓
PHASE 6
Voting
        ↓
PHASE 7
Majority + tie handling
        ↓
PHASE 8
History
        ↓
PHASE 9
Testing
        ↓
PHASE 10
Deployment
```

The result is a small but complete full-stack system rather than a collection of disconnected screens.

insteadof postgres let's use mongo db 