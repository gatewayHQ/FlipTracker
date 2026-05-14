import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isLocal = process.env.DATABASE_URL.includes('localhost') ||
                process.env.DATABASE_URL.includes('127.0.0.1');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: isLocal ? false : 'require',
  max: isLocal ? 10 : 1,
  idle_timeout: isLocal ? undefined : 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export default sql;
