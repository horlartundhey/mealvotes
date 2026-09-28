import cookieParser from 'cookie-parser';
import express from 'express';
import { connectDb } from './lib/db';
import { asyncHandler, errorMiddleware } from './lib/errors';
import { householdRouter, inviteRouter } from './routes/households';
import { mealRouter } from './routes/meals';
import { todayRouter } from './routes/today';

export function createApp({ connect = true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  if (connect) {
    app.use(
      '/api',
      asyncHandler(async (_req, _res, next) => {
        await connectDb();
        next();
      }),
    );
  }

  app.use('/api/households', householdRouter);
  app.use('/api/households/:householdId/meals', mealRouter);
  app.use('/api/households/:householdId', todayRouter);
  app.use('/api/invites', inviteRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorMiddleware);
  return app;
}

export default createApp();
