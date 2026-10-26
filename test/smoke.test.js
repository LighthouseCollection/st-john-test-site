/* St. John the Beloved test site · the smoke test (test/smoke.test.js): the site's own check, run in its CI and before a
   deploy. It starts the server (DATABASE_URL: the CI's throwaway PostgreSQL, or pglite:memory), then in Chrome opens every
   page of site/pages.js: each must draw its main region with no page error, console error or failed request. Then the API:
   a new member is saved and is there after a reload, a sign-up and an RSVP save, and a reset brings the seed back.
   (The full Plenix tests, pages, keyboard, typography and the rest, run in the Plenix repository against this site.)
     npm test        CHROME_PATH picks the browser; PORT (8795) */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

process.env.PORT = process.env.PORT || '8795';
process.env.RESET_OPEN = '1';
process.env.RESET_HOUR = '-1';
process.env.SEED_ON_START = '1';
const { start } = require('../server/server.js');
const BASE = 'http://127.0.0.1:' + process.env.PORT + '/';

const text = fs.readFileSync(path.join(__dirname, '..', 'site', 'pages.js'), 'utf8');
const PAGES = JSON.parse(text.slice(text.indexOf('= [') + 2).replace(/;\s*$/, ''));
const chrome = () => process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));

(async () => {
  const server = await start();
  const failed = [];
  const check = (name, ok, detail) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' · ' + detail)); if (!ok) failed.push(name); };
  const api = async (p, method, body) => { const r = await fetch(BASE + 'api/' + p, { method: method || 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json() }; };
  const browser = await puppeteer.launch({ executablePath: chrome(), headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    let errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
    for (const p of PAGES) {
      errs = [];
      await page.goto('about:blank');
      await page.goto(BASE + '#' + (p.open || p.path), { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForFunction(() => document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20, { timeout: 15000 }).catch(() => errs.push('empty page'));
      check('page ' + p.id, !errs.length, errs.slice(0, 3).join(' | '));
    }

    // the API: saves survive a reload; a reset brings the seed back
    const before = (await api('bootstrap')).json.members.length;
    const made = await api('members', 'POST', { first: 'Test', last: 'Visitor', status: 'visitor', district: 'East', address: { line1: '1 Test Lane', city: 'Maple Hollow', region: 'NJ', postal: '07999', country: 'US' } });
    const after = (await api('bootstrap')).json.members;
    check('a new member is saved', made.status === 201 && after.length === before + 1 && after.some((m) => m.id === made.json.id && m.name === 'Test Visitor'), JSON.stringify(made));
    const edit = await api('members/' + made.json.id, 'PATCH', { phone: '(555) 010-9999' });
    check('a member is changed', edit.status === 200 && (await api('bootstrap')).json.members.find((m) => m.id === made.json.id).phone === '(555) 010-9999', JSON.stringify(edit));
    check('a bad member is refused', (await api('members', 'POST', { first: '' })).status === 400, '');
    const sign = await api('slots/sl5/signups', 'PUT', { members: ['m3', 'm4'] });
    check('a sign-up is saved', sign.status === 200 && JSON.stringify((await api('bootstrap')).json.servingSlots.find((s) => s.id === 'sl5').signed) === '["m3","m4"]', JSON.stringify(sign));
    const coming = (await api('bootstrap')).json.events.find((e) => e.id === 'e10').rsvp;
    const rsvp = await api('events/e10/rsvps', 'POST', { answer: 'yes' });
    check('an RSVP is counted', rsvp.status === 201 && (await api('bootstrap')).json.events.find((e) => e.id === 'e10').rsvp === coming + 1, JSON.stringify(rsvp));
    const reset = await api('reset', 'POST');
    check('a reset brings the seed back', reset.status === 200 && (await api('bootstrap')).json.members.length === before, JSON.stringify(reset));
    const health = (await (await fetch(BASE + 'healthz')).json());
    check('the health check answers', health.ok && health.members === before && health.gifts === 10000, JSON.stringify(health));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed.length ? 'SMOKE_FAIL ' + failed.length : 'SMOKE_OK ' + (PAGES.length + 7) + ' checks');
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
