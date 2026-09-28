import mongoose from 'mongoose';
import { env } from './env';

// Cached across serverless invocations so we don't open a new connection per request.
let connecting: Promise<typeof mongoose> | null = null;

export async function connectDb(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!uri) throw new Error('MONGODB_URI is not set');
  connecting ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    return await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
}
