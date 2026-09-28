import 'dotenv/config';
import path from 'node:path';
import dotenv from 'dotenv';

// Also load the repo-root .env when running from /server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  mongoUri: process.env.MONGODB_URI ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-secret',
  port: Number(process.env.PORT ?? 4010),
  isProd: process.env.NODE_ENV === 'production',
};
