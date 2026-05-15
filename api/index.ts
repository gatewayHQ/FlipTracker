import 'dotenv/config';
import { initializeSchema } from '../server/src/db/schema';
import app from '../server/src/app';

let initPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeSchema();
  }
  return initPromise;
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    await ensureSchema();
  } catch (err: any) {
    console.error('[schema init failed]', err);
    res.status(500).json({ error: 'Database initialization failed', detail: err?.message });
    return;
  }
  app(req, res);
}
