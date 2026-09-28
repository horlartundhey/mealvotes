import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seedMeals } from '../seeds/seedMeals';
import { createApp } from '../src/app';
import { resetClock, setClock } from '../src/lib/clock';
import { Household } from '../src/models/Household';
import { Meal } from '../src/models/Meal';
import { MealHistory, Vote, VotingRound } from '../src/models/Voting';

let mongod: MongoMemoryServer;
const app = createApp({ connect: false });
const at = (iso: string) => setClock(() => new Date(iso));
const MORNING = '2026-09-28T08:00:00+01:00';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([seedMeals(), Meal.init(), VotingRound.init(), Vote.init(), MealHistory.init()]);
}, 120_000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
afterEach(resetClock);

type Agent = ReturnType<typeof request.agent>;
interface Home { id: string; owner: Agent; tunde: Agent; bola: Agent; ids: Record<string, string> }

async function household(members: ('tunde' | 'bola')[] = ['tunde', 'bola']): Promise<Home> {
  const owner = request.agent(app);
  const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
  const token = created.body.inviteUrl.replace('/join/', '');
  const ids: Record<string, string> = { olatunde: created.body.me.id };
  const home = { id: created.body.id as string, owner, tunde: request.agent(app), bola: request.agent(app), ids };
  for (const name of members) {
    const r = await home[name].post(`/api/invites/${token}/join`).send({ displayName: name === 'tunde' ? 'Tunde' : 'Bola' });
    ids[name] = r.body.participant.id;
  }
  return home;
}

const today = async (h: Home, who: Agent = h.owner) => (await who.get(`/api/households/${h.id}/today`)).body;
const vote = (h: Home, who: Agent, roundId: string, mealId: string) =>
  who.put(`/api/households/${h.id}/rounds/${roundId}/vote`).send({ mealId });
const optionIds = (t: { round: { options: { meal: { id: string } }[] } }) => t.round.options.map((o) => o.meal.id);

describe('daily generation (Test 3)', () => {
  it('creates three options on first open and gives every member the same ones', async () => {
    at(MORNING);
    const h = await household();
    const a = await today(h);
    const b = await today(h, h.tunde);
    const c = await today(h, h.bola);
    expect(a.round.options).toHaveLength(3);
    expect(a.round.roundNumber).toBe(1);
    expect(a.round.status).toBe('OPEN');
    expect(optionIds(b)).toEqual(optionIds(a));
    expect(optionIds(c)).toEqual(optionIds(a));
    expect(await VotingRound.countDocuments({ householdId: h.id })).toBe(1);
  });

  it('simultaneous first opens still produce one round', async () => {
    at(MORNING);
    const h = await household();
    const results = await Promise.all([today(h), today(h, h.tunde), today(h, h.bola), today(h), today(h, h.tunde)]);
    expect(new Set(results.map((r) => optionIds(r).join())).size).toBe(1);
    expect(await VotingRound.countDocuments({ householdId: h.id })).toBe(1);
  });

  it('closes at 12:00 Lagos when opened in the morning, and 2 hours later when opened after 11:00', async () => {
    at(MORNING);
    const a = await today(await household());
    expect(new Date(a.round.closesAt).toISOString()).toBe(new Date('2026-09-28T12:00:00+01:00').toISOString());
    at('2026-09-28T15:00:00+01:00');
    const b = await today(await household());
    expect(new Date(b.round.closesAt).toISOString()).toBe(new Date('2026-09-28T17:00:00+01:00').toISOString());
  });

  it('never suggests a meal that won within the cooldown (Test 9)', async () => {
    at(MORNING);
    const h = await household();
    const all = await Meal.find({ householdId: null }).lean();
    const keep = all.slice(0, 4);
    await Household.updateOne({ _id: h.id }, { disabledMealIds: all.slice(4).map((m) => m._id) });
    await MealHistory.create({ householdId: h.id, mealId: keep[0]._id, date: '2026-09-27', selectionMethod: 'MAJORITY', winningVotes: 2 });
    const t = await today(h);
    expect(optionIds(t).sort()).toEqual(keep.slice(1).map((m) => String(m._id)).sort());
  });

  it('reports a clear error when the library has nothing eligible', async () => {
    at(MORNING);
    const h = await household();
    await Household.updateOne({ _id: h.id }, { disabledMealIds: (await Meal.find({ householdId: null }).lean()).map((m) => m._id) });
    const res = await h.owner.get(`/api/households/${h.id}/today`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NO_ELIGIBLE_MEALS');
  });
});

describe('majority voting (Tests 4, 7)', () => {
  it('two of three wins, and the round closes early once everyone has voted', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const [jollof, beans, yam] = optionIds(t);
    await vote(h, h.owner, t.round.id, jollof);
    const mid = await vote(h, h.tunde, t.round.id, jollof);
    expect(mid.body.round.status).toBe('OPEN'); // only 2 of 3 so far
    const last = await vote(h, h.bola, t.round.id, yam);
    expect(last.body.round.status).toBe('COMPLETED');
    expect(last.body.result).toMatchObject({ selectionMethod: 'MAJORITY', winningVotes: 2, eligibleCount: 3 });
    expect(last.body.result.winner.id).toBe(jollof);
    expect(last.body.result.breakdown.find((b: { mealId: string }) => b.mealId === jollof).voters.sort()).toEqual(['Olatunde', 'Tunde']);
    void beans;
  });

  it('keeps votes secret while voting is open', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const res = await vote(h, h.owner, t.round.id, optionIds(t)[0]);
    const asTunde = await today(h, h.tunde);
    expect(asTunde.round.members.find((m: { displayName: string }) => m.displayName === 'Olatunde').hasVoted).toBe(true);
    expect(asTunde.round.myVoteMealId).toBeNull(); // Tunde hasn't voted; and can't see Olatunde's pick
    expect(asTunde.result).toBeNull();
    expect(JSON.stringify(asTunde)).not.toContain('voters');
    expect(res.body.round.myVoteMealId).toBe(optionIds(t)[0]);
  });

  it('changing a vote replaces it: only the latest counts', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const [a, , c] = optionIds(t);
    await vote(h, h.tunde, t.round.id, a);
    const changed = await vote(h, h.tunde, t.round.id, c);
    expect(changed.body.round.myVoteMealId).toBe(c);
    expect(await Vote.countDocuments({ roundId: t.round.id })).toBe(1);
    expect((await Vote.findOne({ roundId: t.round.id }))!.mealId.toString()).toBe(c);
  });

  it('a lone owner cannot close the round alone before anyone joins', async () => {
    at(MORNING);
    const h = await household([]);
    const t = await today(h);
    const res = await vote(h, h.owner, t.round.id, optionIds(t)[0]);
    expect(res.body.round.status).toBe('OPEN');
  });

  it('two votes at the deadline win even though the third member never voted', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const pick = optionIds(t)[1];
    await vote(h, h.owner, t.round.id, pick);
    await vote(h, h.tunde, t.round.id, pick);
    at('2026-09-28T12:00:01+01:00');
    const after = await today(h);
    expect(after.round.status).toBe('COMPLETED');
    expect(after.result.winner.id).toBe(pick);
  });

  it('rejects unknown meals, non-options and outsiders', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const notOption = (await Meal.find({ householdId: null }).lean()).map((m) => String(m._id)).find((id) => !optionIds(t).includes(id))!;
    expect((await vote(h, h.owner, t.round.id, notOption)).status).toBe(400);
    expect((await vote(h, h.owner, t.round.id, 'nope')).status).toBe(400);
    expect((await request(app).put(`/api/households/${h.id}/rounds/${t.round.id}/vote`).send({ mealId: optionIds(t)[0] })).status).toBe(401);
    const other = await household();
    expect((await vote(other, other.owner, t.round.id, optionIds(t)[0])).status).toBe(404); // another household's round
  });
});

describe('deadline (Test 8)', () => {
  it('rejects a vote on a round that has closed', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    await vote(h, h.owner, t.round.id, optionIds(t)[0]);
    at('2026-09-28T12:30:00+01:00'); // past the deadline; 1 vote of 3 → no majority
    const res = await vote(h, h.tunde, t.round.id, optionIds(t)[1]);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Voting is closed.');
  });
});

describe('ties (Tests 5, 6)', () => {
  it('1-1-1 starts round 2 with fresh options and keeps round 1 on record', async () => {
    at(MORNING);
    const h = await household();
    const r1 = await today(h);
    const [a, b, c] = optionIds(r1);
    await vote(h, h.owner, r1.round.id, a);
    await vote(h, h.tunde, r1.round.id, b);
    await vote(h, h.bola, r1.round.id, c);

    const r2 = await today(h);
    expect(r2.round.roundNumber).toBe(2);
    expect(r2.round.status).toBe('OPEN');
    expect(optionIds(r2).filter((id) => optionIds(r1).includes(id))).toHaveLength(0);
    expect(r2.previousRounds).toHaveLength(1);
    expect(r2.previousRounds[0].breakdown).toHaveLength(3); // revealed now that it has closed
    expect(await VotingRound.findById(r1.round.id).then((r) => r!.status)).toBe('NO_MAJORITY');
    expect(new Date(r2.round.closesAt).getTime()).toBeGreaterThan(Date.parse(MORNING)); // has its own deadline
  });

  it('a second tie uses the fallback: the meal eaten longest ago wins', async () => {
    at(MORNING);
    const h = await household();
    const r1 = await today(h);
    const first = optionIds(r1);
    await vote(h, h.owner, r1.round.id, first[0]);
    await vote(h, h.tunde, r1.round.id, first[1]);
    await vote(h, h.bola, r1.round.id, first[2]);
    const r2 = await today(h);
    const [a, b, c] = optionIds(r2);

    // b was eaten 9 days ago, c 5 days ago, a 3 days ago
    await MealHistory.create([
      { householdId: h.id, mealId: b, date: '2026-09-19', selectionMethod: 'MAJORITY', winningVotes: 2 },
      { householdId: h.id, mealId: c, date: '2026-09-23', selectionMethod: 'MAJORITY', winningVotes: 2 },
      { householdId: h.id, mealId: a, date: '2026-09-25', selectionMethod: 'MAJORITY', winningVotes: 2 },
    ]);
    await vote(h, h.owner, r2.round.id, a);
    await vote(h, h.tunde, r2.round.id, b);
    const done = await vote(h, h.bola, r2.round.id, c);

    expect(done.body.round.status).toBe('COMPLETED');
    expect(done.body.result).toMatchObject({ selectionMethod: 'FALLBACK', daysSinceEaten: 9 });
    expect(done.body.result.winner.id).toBe(b);
    expect(await VotingRound.countDocuments({ householdId: h.id })).toBe(2); // never a round 3
  });

  it('a 2-2 split in a four-person household is a tie too (majority is 3)', async () => {
    at(MORNING);
    const h = await household();
    const token = (await h.owner.get(`/api/households/${h.id}`)).body.inviteUrl.replace('/join/', '');
    const ada = request.agent(app);
    await ada.post(`/api/invites/${token}/join`).send({ displayName: 'Ada' });
    const r1 = await today(h);
    const [a, b] = optionIds(r1);
    await vote(h, h.owner, r1.round.id, a);
    await vote(h, h.tunde, r1.round.id, a);
    await vote(h, h.bola, r1.round.id, b);
    await ada.put(`/api/households/${h.id}/rounds/${r1.round.id}/vote`).send({ mealId: b });
    expect((await today(h)).round.roundNumber).toBe(2);
  });
});

describe('nobody votes', () => {
  it('invents no winner; the owner can open another round', async () => {
    at(MORNING);
    const h = await household();
    const r1 = await today(h);
    at('2026-09-28T12:05:00+01:00');
    const after = await today(h);
    expect(after.round.status).toBe('NO_VOTES');
    expect(after.result).toBeNull();
    expect(after.canStartAnotherRound).toBe(true);
    expect((await today(h, h.tunde)).canStartAnotherRound).toBe(false);
    expect(await MealHistory.countDocuments({ householdId: h.id })).toBe(0);

    expect((await h.tunde.post(`/api/households/${h.id}/rounds`)).status).toBe(403);
    const next = await h.owner.post(`/api/households/${h.id}/rounds`);
    expect(next.status).toBe(201);
    expect(next.body.round.roundNumber).toBe(2);
    expect(next.body.round.status).toBe('OPEN');
    expect(optionIds(next.body).filter((id) => optionIds(r1).includes(id))).toHaveLength(0);
  });
});

describe('history + tomorrow (Tests 9, 10)', () => {
  it('records the winner, excludes it tomorrow, and shows it in the monthly view', async () => {
    at(MORNING);
    const h = await household();
    const t = await today(h);
    const winner = optionIds(t)[0];
    await vote(h, h.owner, t.round.id, winner);
    await vote(h, h.tunde, t.round.id, winner);
    await vote(h, h.bola, t.round.id, optionIds(t)[1]);

    const hist = await h.owner.get(`/api/households/${h.id}/history?month=2026-09`);
    expect(hist.body.days).toHaveLength(1);
    expect(hist.body.days[0]).toMatchObject({ date: '2026-09-28', selectionMethod: 'MAJORITY', winningVotes: 2 });
    expect(hist.body.days[0].meal.id).toBe(winner);

    at('2026-09-29T08:00:00+01:00');
    const tomorrow = await today(h);
    expect(tomorrow.date).toBe('2026-09-29');
    expect(tomorrow.round.roundNumber).toBe(1);
    expect(optionIds(tomorrow)).not.toContain(winner);
  });

  it('an unfinished round from a previous day is expired, not resurrected', async () => {
    at(MORNING);
    const h = await household();
    const yesterday = await today(h);
    await vote(h, h.owner, yesterday.round.id, optionIds(yesterday)[0]);
    at('2026-09-29T09:00:00+01:00');
    const t = await today(h);
    expect(t.date).toBe('2026-09-29');
    expect((await VotingRound.findById(yesterday.round.id))!.status).toBe('EXPIRED');
    expect(await MealHistory.countDocuments({ householdId: h.id })).toBe(0);
  });

  it('validates the month parameter', async () => {
    const h = await household();
    expect((await h.owner.get(`/api/households/${h.id}/history?month=nope`)).status).toBe(400);
  });
});

describe('stats (gamification)', () => {
  it('awards XP, level, streak and badges from real activity', async () => {
    const h = await household();
    for (const day of ['2026-09-26', '2026-09-27', '2026-09-28']) {
      at(`${day}T07:30:00+01:00`);
      const t = await today(h);
      const pick = optionIds(t)[0];
      await vote(h, h.owner, t.round.id, pick);
      await vote(h, h.tunde, t.round.id, pick);
      await vote(h, h.bola, t.round.id, pick);
    }
    const stats = (await h.owner.get(`/api/households/${h.id}/stats`)).body;
    expect(stats).toMatchObject({ streak: 3, votesCast: 3, xp: 30, level: 1, decidedMeals: 3 });
    const earned = stats.badges.filter((b: { earned: boolean }) => b.earned).map((b: { id: string }) => b.id);
    expect(earned).toEqual(expect.arrayContaining(['first-ladle', 'early-bird']));
    expect(earned).not.toContain('chop-master');
  });
});
