/* St. John the Beloved test site · migrations (db/migrate.js): applies db/migrations/NNN_*.sql in order, each once, and
   records them in schema_migrations.
     node db/migrate.js              apply what has not run
   migrate(db) is also called by the server on start. */
const fs = require('fs');
const path = require('path');
const { open } = require('./db.js');

const DIR = path.join(__dirname, 'migrations');

async function migrate(db) {
  await db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await db.query('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
  const files = fs.readdirSync(DIR).filter((f) => /^\d{3}_[\w-]+\.sql$/.test(f)).sort();
  const applied = [];
  for (const f of files) {
    const version = f.slice(0, 3);
    if (done.has(version)) continue;
    const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
    await db.tx(async (q) => { for (const stmt of split(sql)) await q(stmt); await q('INSERT INTO schema_migrations (version) VALUES ($1)', [version]); });
    applied.push(f);
  }
  return applied;
}

// the statements of a migration file (no function bodies with semicolons in these files)
const split = (sql) => sql.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);

module.exports = { migrate };

if (require.main === module) {
  open().then(async (db) => { const a = await migrate(db); console.log(a.length ? 'Applied ' + a.join(', ') : 'Nothing to apply'); await db.close(); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
