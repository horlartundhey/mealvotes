import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { seedMeals } from '../seeds/seedMeals';

let mongod: MongoMemoryServer;
const app = createApp({ connect: false });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedMeals();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function setup() {
  const owner = request.agent(app);
  const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
  const id: string = created.body.id;
  const guest = request.agent(app);
  await guest.post(`/api/invites/${created.body.inviteUrl.replace('/join/', '')}/join`).send({ displayName: 'Tunde' });
  return { owner, guest, id };
}

describe('meal library', () => {
  it('seed is idempotent', async () => {
    const again = await seedMeals();
    expect(again.inserted).toBe(0);
    expect(await mongoose.connection.collection('meals').countDocuments({ householdId: null })).toBe(again.total);
  });

  it('members see the seeded library; outsiders do not', async () => {
    const { guest, id } = await setup();
    const res = await guest.get(`/api/households/${id}/meals`);
    expect(res.status).toBe(200);
    expect(res.body.meals.length).toBeGreaterThanOrEqual(50);
    expect(res.body.meals.find((m: { name: string }) => m.name === 'Jollof Rice + Chicken')).toMatchObject({
      category: 'rice',
      isActive: true,
      isCustom: false,
    });
    expect((await request(app).get(`/api/households/${id}/meals`)).status).toBe(401);
  });

  it('owner switches a built-in meal off for their household only', async () => {
    const a = await setup();
    const b = await setup();
    const list = await a.owner.get(`/api/households/${a.id}/meals`);
    const jollof = list.body.meals.find((m: { name: string }) => m.name === 'Jollof Rice + Chicken');

    expect((await a.guest.patch(`/api/households/${a.id}/meals/${jollof.id}/status`).send({ isActive: false })).status).toBe(403);
    expect((await a.owner.patch(`/api/households/${a.id}/meals/${jollof.id}/status`).send({ isActive: false })).status).toBe(200);

    const inA = (await a.owner.get(`/api/households/${a.id}/meals`)).body.meals.find((m: { id: string }) => m.id === jollof.id);
    const inB = (await b.owner.get(`/api/households/${b.id}/meals`)).body.meals.find((m: { id: string }) => m.id === jollof.id);
    expect(inA.isActive).toBe(false);
    expect(inB.isActive).toBe(true);

    await a.owner.patch(`/api/households/${a.id}/meals/${jollof.id}/status`).send({ isActive: true });
    const back = (await a.owner.get(`/api/households/${a.id}/meals`)).body.meals.find((m: { id: string }) => m.id === jollof.id);
    expect(back.isActive).toBe(true);
  });

  it('owner adds a custom meal that only their household sees', async () => {
    const a = await setup();
    const b = await setup();
    const created = await a.owner.post(`/api/households/${a.id}/meals`).send({
      name: 'Mama’s Special Stew',
      category: 'other',
      prepMinutes: 50,
      estimatedCost: 7000,
      imageUrl: 'https://example.com/stew.jpg',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ isCustom: true, isActive: true });

    const seenByA = (await a.guest.get(`/api/households/${a.id}/meals`)).body.meals;
    const seenByB = (await b.guest.get(`/api/households/${b.id}/meals`)).body.meals;
    expect(seenByA.some((m: { id: string }) => m.id === created.body.id)).toBe(true);
    expect(seenByB.some((m: { id: string }) => m.id === created.body.id)).toBe(false);

    // Another household cannot touch it.
    expect((await b.owner.patch(`/api/households/${b.id}/meals/${created.body.id}/status`).send({ isActive: false })).status).toBe(404);

    const edited = await a.owner.patch(`/api/households/${a.id}/meals/${created.body.id}`).send({ estimatedCost: 8000 });
    expect(edited.body.estimatedCost).toBe(8000);
  });

  it('validates meal input, and built-in meals are not editable', async () => {
    const a = await setup();
    const bad = await a.owner.post(`/api/households/${a.id}/meals`).send({ name: 'X', category: 'nope', prepMinutes: 0, estimatedCost: 1 });
    expect(bad.status).toBe(400);
    const insecure = await a.owner
      .post(`/api/households/${a.id}/meals`)
      .send({ name: 'X', category: 'rice', prepMinutes: 10, estimatedCost: 1, imageUrl: 'http://insecure.test/a.jpg' });
    expect(insecure.status).toBe(400);
    const builtIn = (await a.owner.get(`/api/households/${a.id}/meals`)).body.meals[0];
    expect((await a.owner.patch(`/api/households/${a.id}/meals/${builtIn.id}`).send({ name: 'Hacked' })).status).toBe(403);
  });
});
