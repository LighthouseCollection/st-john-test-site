/* St. John the Beloved test site · the seed (db/seed.js): empties every parish table and fills it with the made-up data of
   db/generate.js, in one transaction, so every reset gives the same parish (the tests rely on it).
     node db/seed.js            reset the database to the seed
   seed(db) is also called by the server: on start when the database is empty, every night, and on POST /api/reset. */
const { open } = require('./db.js');
const { migrate } = require('./migrate.js');
const D = require('./generate.js');

const TABLES = ['signups', 'serving_slots', 'pledges', 'giving_months', 'gifts', 'funds', 'rsvps', 'events', 'feasts', 'services', 'member_ministries', 'members',
  'families', 'ministries', 'clergy', 'announcements', 'documents', 'media', 'bookstore_items', 'settings'];

// many rows in one INSERT: rows is a list of value lists
async function insert(q, table, cols, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const part = rows.slice(i, i + 500), params = [];
    const values = part.map((r) => '(' + r.map((v) => { params.push(v); return '$' + params.length; }).join(', ') + ')').join(', ');
    await q('INSERT INTO ' + table + ' (' + cols.join(', ') + ') VALUES ' + values, params);
  }
}

async function seed(db) {
  await db.tx(async (q) => {
    await q('TRUNCATE ' + TABLES.join(', ') + ' RESTART IDENTITY CASCADE');
    await insert(q, 'settings', ['key', 'value'], [['church', JSON.stringify(D.CHURCH)], ['me', JSON.stringify({ id: D.ME.id, email: D.ME.email, role: D.ME.role })]]);
    await insert(q, 'clergy', ['id', 'name', 'role'], D.CLERGY.map((c) => [c.id, c.name, c.role]));
    await insert(q, 'ministries', ['id', 'name', 'icon', 'lead', 'meets', 'area', 'member_count', 'servant_count'], D.MINISTRIES.map((m) => [m.id, m.name, m.icon, m.lead, m.meets, m.group, m.members, m.servants]));
    await insert(q, 'families', ['id', 'name', 'last_name', 'address', 'phone', 'since', 'district'], D.FAMILIES.map((f) => [f.id, f.name, f.last, JSON.stringify(f.address), f.phone, f.since, f.district]));
    await insert(q, 'members', ['id', 'family_id', 'first_name', 'last_name', 'sex', 'role', 'born', 'email', 'phone', 'status', 'joined', 'servant', 'district', 'giving'],
      D.MEMBERS.map((m) => [m.id, m.family, m.first, m.last, m.sex, m.role, m.born, m.email, m.phone, m.status, m.joined, m.servant, m.district, m.giving]));
    await insert(q, 'member_ministries', ['member_id', 'ministry_id'], D.MEMBERS.flatMap((m) => m.ministries.map((x) => [m.id, x])));
    await insert(q, 'services', ['id', 'title', 'day', 'starts', 'ends', 'place'], D.SERVICES.map((s) => [s.id, s.title, s.day, s.time, s.end, s.place]));
    await insert(q, 'feasts', ['id', 'title', 'day', 'kind'], D.FEASTS.map((f) => [f.id, f.title, f.date, f.kind]));
    await insert(q, 'events', ['id', 'title', 'starts_at', 'ends_at', 'place', 'ministry_id', 'color', 'rsvp_count'], D.EVENTS.map((e) => [e.id, e.title, e.start, e.end, e.place, e.ministry, e.color, e.rsvp]));
    await insert(q, 'funds', ['id', 'name', 'goal', 'raised'], D.FUNDS.map((f) => [f.id, f.name, f.goal, f.raised]));
    await insert(q, 'gifts', ['id', 'member_id', 'fund_id', 'amount', 'method', 'given_on', 'position'], D.GIFTS.map((g, i) => [g.id, g.member, g.fund, g.amount, g.method, g.date, i]));
    await insert(q, 'giving_months', ['month', 'label', 'general', 'building', 'pantry'], D.GIVING_BY_MONTH.map((m) => [m.month, m.label, m.general, m.building, m.pantry]));
    await insert(q, 'pledges', ['id', 'member_id', 'fund_id', 'amount', 'paid', 'frequency', 'status'], D.PLEDGES.map((p) => [p.id, p.member, p.fund, p.amount, p.paid, p.frequency, p.status]));
    await insert(q, 'serving_slots', ['id', 'role', 'ministry_id', 'day', 'starts', 'needed'], D.SERVING_SLOTS.map((s) => [s.id, s.role, s.ministry, s.date, s.time, s.needed]));
    await insert(q, 'signups', ['slot_id', 'member_id'], D.SERVING_SLOTS.flatMap((s) => s.signed.map((m) => [s.id, m])));
    await insert(q, 'announcements', ['id', 'title', 'body', 'author', 'day', 'status', 'audience'], D.ANNOUNCEMENTS.map((a) => [a.id, a.title, a.body, a.author, a.date, a.status, a.audience]));
    await insert(q, 'documents', ['id', 'name', 'folder', 'size', 'modified', 'owner', 'version'], D.DOCUMENTS.map((d) => [d.id, d.name, d.folder, d.size, d.modified, d.owner, d.version]));
    await insert(q, 'media', ['id', 'title', 'kind', 'speaker', 'day', 'duration'], D.MEDIA.map((m) => [m.id, m.title, m.kind, m.speaker, m.date, m.duration]));
    await insert(q, 'bookstore_items', ['id', 'name', 'price', 'category', 'stock'], D.BOOKSTORE.map((b) => [b.id, b.name, b.price, b.category, b.stock]));
  });
  return { members: D.MEMBERS.length, families: D.FAMILIES.length, gifts: D.GIFTS.length };
}

module.exports = { seed };

if (require.main === module) {
  open().then(async (db) => { await migrate(db); const n = await seed(db); console.log('Seeded: ' + n.families + ' families, ' + n.members + ' members, ' + n.gifts + ' gifts'); await db.close(); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
