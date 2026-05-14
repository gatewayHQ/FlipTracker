import 'dotenv/config';
import { initializeSchema } from '../server/src/db/schema';
import app from '../server/src/app';
import type { IncomingMessage, ServerResponse } from 'http';

// Initialize schema once per cold start (CREATE IF NOT EXISTS — safe to call repeatedly)
const initPromise = initializeSchema().catch(err => {
  console.error('Schema initialization failed:', err);
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise;
  return app(req as any, res as any);
}
