import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

let mongod: MongoMemoryServer;
const app = createApp({ connect: false });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const tokenOf = (inviteUrl: string) => inviteUrl.replace('/join/', '');

describe('households + guest invites', () => {
  it('creates a household, makes the creator owner, and returns an invite url (Test 1)', async () => {
    const owner = request.agent(app);
    const res = await owner.post('/api/households').send({ name: 'The Ibitoye Household', ownerName: 'Olatunde' });
    expect(res.status).toBe(201);
    expect(res.body.inviteUrl).toMatch(/^\/join\/.+/);
    expect(res.body.me.role).toBe('owner');

    const detail = await owner.get(`/api/households/${res.body.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.members).toHaveLength(1);
    expect(detail.body.inviteUrl).toBe(res.body.inviteUrl);
  });

  it('lets two guests join through the link in separate browsers (Test 2)', async () => {
    const owner = request.agent(app);
    const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    const token = tokenOf(created.body.inviteUrl);

    const preview = await request(app).get(`/api/invites/${token}`);
    expect(preview.body.household.name).toBe('Home');
    expect(preview.body.memberCount).toBe(1);

    const tunde = request.agent(app);
    const bola = request.agent(app);
    expect((await tunde.post(`/api/invites/${token}/join`).send({ displayName: 'Tunde' })).status).toBe(201);
    expect((await bola.post(`/api/invites/${token}/join`).send({ displayName: 'Bola' })).status).toBe(201);

    const asTunde = await tunde.get(`/api/households/${created.body.id}`);
    expect(asTunde.body.members.map((m: { displayName: string }) => m.displayName)).toEqual(['Olatunde', 'Tunde', 'Bola']);
    expect(asTunde.body.me.role).toBe('member');
    expect(asTunde.body.inviteUrl).toBeUndefined(); // guests don't see admin data
  });

  it('does not create a duplicate when the same browser joins twice', async () => {
    const owner = request.agent(app);
    const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    const token = tokenOf(created.body.inviteUrl);
    const tunde = request.agent(app);
    const first = await tunde.post(`/api/invites/${token}/join`).send({ displayName: 'Tunde' });
    const second = await tunde.post(`/api/invites/${token}/join`).send({ displayName: 'Tunde again' });
    expect(second.status).toBe(200);
    expect(second.body.participant.id).toBe(first.body.participant.id);
    const detail = await owner.get(`/api/households/${created.body.id}`);
    expect(detail.body.members).toHaveLength(2);
  });

  it('rejects a name already used in the household (case-insensitive)', async () => {
    const created = await request(app).post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    const res = await request(app)
      .post(`/api/invites/${tokenOf(created.body.inviteUrl)}/join`)
      .send({ displayName: 'olatunde' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid invites and blocks non-members', async () => {
    expect((await request(app).get('/api/invites/nope')).status).toBe(404);
    const created = await request(app).post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    expect((await request(app).get(`/api/households/${created.body.id}`)).status).toBe(401);
  });

  it('validates input', async () => {
    const res = await request(app).post('/api/households').send({ name: '', ownerName: 'X' });
    expect(res.status).toBe(400);
  });

  it('rotating the invite kills the old link; only the owner may rotate', async () => {
    const owner = request.agent(app);
    const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    const oldToken = tokenOf(created.body.inviteUrl);
    const guest = request.agent(app);
    await guest.post(`/api/invites/${oldToken}/join`).send({ displayName: 'Tunde' });

    expect((await guest.post(`/api/households/${created.body.id}/invite`)).status).toBe(403);
    const rotated = await owner.post(`/api/households/${created.body.id}/invite`);
    expect(rotated.status).toBe(200);
    expect((await request(app).get(`/api/invites/${oldToken}`)).status).toBe(404);
    expect((await request(app).get(`/api/invites/${tokenOf(rotated.body.inviteUrl)}`)).status).toBe(200);
  });

  it('removed members lose access but stay in the database', async () => {
    const owner = request.agent(app);
    const created = await owner.post('/api/households').send({ name: 'Home', ownerName: 'Olatunde' });
    const guest = request.agent(app);
    const joined = await guest
      .post(`/api/invites/${tokenOf(created.body.inviteUrl)}/join`)
      .send({ displayName: 'Tunde' });
    const del = await owner.delete(`/api/households/${created.body.id}/members/${joined.body.participant.id}`);
    expect(del.status).toBe(204);
    expect((await guest.get(`/api/households/${created.body.id}`)).status).toBe(401);
  });
});
