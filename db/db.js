/* St. John the Beloved test site · the database connection (db/db.js).
   DATABASE_URL picks it:
     postgres://user:pass@host:5432/stjohn   PostgreSQL 16: the server (Docker) and the CI's throwaway database
     pglite:memory                           PostgreSQL in the process (PGlite, the same SQL engine built for Node): the
                                             Plenix tests on a computer with no PostgreSQL; a fresh database every start
   query(sql, params) returns { rows } either way; tx(fn) runs fn(query) in one transaction. */
const URL = process.env.DATABASE_URL || 'pglite:memory';

let ready = null;
function open() {
  if (ready) return ready;
  if (/^pglite:/.test(URL)) {
    ready = import('@electric-sql/pglite').then(({ PGlite }) => {
      const db = new PGlite(URL === 'pglite:memory' ? undefined : URL.slice('pglite:'.length));
      return { query: (sql, params) => db.query(sql, params), exec: (sql) => db.exec(sql), tx: (fn) => db.transaction((t) => fn((s, p) => t.query(s, p))), close: () => db.close(), kind: 'pglite' };
    });
  } else {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: URL, max: 8 });
    ready = Promise.resolve({
      query: (sql, params) => pool.query(sql, params),
      exec: (sql) => pool.query(sql),
      tx: async (fn) => { const c = await pool.connect(); try { await c.query('BEGIN'); const out = await fn((s, p) => c.query(s, p)); await c.query('COMMIT'); return out; } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); } },
      close: () => pool.end(),
      kind: 'postgres',
    });
  }
  return ready;
}

module.exports = { open, URL };
