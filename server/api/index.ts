// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
// An Express app is itself a (req, res) handler, so it is exported as-is. The Mongo connection is cached
// at module level in src/lib/db.ts, so warm invocations reuse it.
import app from '../src/app';

export default app;
