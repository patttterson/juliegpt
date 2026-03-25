import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

const sqlite = new Database('juliegpt.db');
sqlite.exec('PRAGMA journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: './drizzle' });
