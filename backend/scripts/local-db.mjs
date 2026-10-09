// Runs a real PostgreSQL instance from node_modules — no Docker or system install needed.
// Data persists in backend/.local-pg; delete that folder to reset.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseDir = resolve(import.meta.dirname, '..', '.local-pg');
const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
const database = process.env.DB_NAME ?? 'fund_management';

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'fund',
  password: 'fund',
  port,
  persistent: true,
});

const isNew = !existsSync(databaseDir);
if (isNew) await pg.initialise();
await pg.start();
if (isNew) await pg.createDatabase(database);

console.log(`Local PostgreSQL ready on localhost:${port} (db: ${database}, user: fund / fund). Ctrl+C to stop.`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
