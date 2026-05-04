import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { initializeSchema } from './schema';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/flipfolio.db');

let _db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    _db = new BetterSqlite3(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}
