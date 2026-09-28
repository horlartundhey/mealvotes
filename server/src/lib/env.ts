import path from 'node:path';
import dotenv from 'dotenv';

// server/.env (this file is server/src/lib/env.ts). On Vercel there is no file: variables come from the project settings.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  mongoUri: process.env.MONGODB_URI ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-secret',
  port: Number(process.env.PORT ?? 4010),
  isProd: process.env.NODE_ENV === 'production',
};
