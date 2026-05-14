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
  await ensureSchema();
  app(req, res);
}
