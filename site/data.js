/* St. John the Beloved test site · the parish data (site/data.js), read from the site's database through its API
   (GET api/bootstrap) before the first screen draws: main.jsx awaits loadData(). The lists keep the same names and shapes
   the screens use; changes are written back through save(). Every person, family, gift and address is made up (the seed,
   db/generate.js). No sacrament records are kept anywhere in the site; people who serve are "servants". */

export const CHURCH = {};
export const CLERGY = [];
export const MINISTRIES = [];
export const MEMBER_STATUS = { active: 'Active', visitor: 'Visitor', moved: 'Moved away', inactive: 'Inactive' };
export const FAMILIES = [];
export const MEMBERS = [];
export const SERVICES = [];
export const FEASTS = [];
export const EVENTS = [];
export const FUNDS = [];
export const GIFTS = [];
export const PLEDGES = [];
export const GIVING_BY_MONTH = [];
export const SERVING_SLOTS = [];
export const ANNOUNCEMENTS = [];
export const DOCUMENTS = [];
export const MEDIA = [];
export const BOOKSTORE = [];
export const ME = {};

export const memberById = (id) => MEMBERS.find((m) => m.id === id);
export const familyById = (id) => FAMILIES.find((f) => f.id === id);
export const membersOf = (fid) => MEMBERS.filter((m) => m.family === fid);

const fill = (list, rows) => { list.length = 0; (rows || []).forEach((r) => list.push(r)); };

// reads every list from the API (relative to the page, so the site works under any address)
export async function loadData() {
  const res = await fetch('api/bootstrap', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('The parish data could not load (' + res.status + ')');
  const d = await res.json();
  Object.assign(CHURCH, d.church); Object.assign(ME, d.me);
  fill(CLERGY, d.clergy); fill(MINISTRIES, d.ministries); fill(FAMILIES, d.families); fill(MEMBERS, d.members);
  fill(SERVICES, d.services); fill(FEASTS, d.feasts); fill(EVENTS, d.events); fill(FUNDS, d.funds); fill(GIFTS, d.gifts);
  fill(PLEDGES, d.pledges); fill(GIVING_BY_MONTH, d.givingByMonth); fill(SERVING_SLOTS, d.servingSlots);
  fill(ANNOUNCEMENTS, d.announcements); fill(DOCUMENTS, d.documents); fill(MEDIA, d.media); fill(BOOKSTORE, d.bookstore);
}

// writes a change to the database: save('members', 'POST', {...}) → the answer's JSON; throws with the server's words
export async function save(where, method, body) {
  const res = await fetch('api/' + where, { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body || {}) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'The change could not be saved (' + res.status + ')');
  return out;
}
