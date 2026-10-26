/* St. John the Beloved test site · Dashboard (#/): the parish office's home page. A HomePage template with the figures of
   the week in a row of MetricCards (members, families, servants signed up), then the office's widgets in a WidgetGrid of
   Panels that people reorder: upcoming services and feasts (List, SectionHeading, Divider, Badge), today's tasks
   (Checkbox, with a toast as each is done) and visitors to welcome (RowButton), giving this month against last month and
   the year so far (MetricCard comparison and trend), the office's notifications (NotificationList) and who is in the
   office (StatusDot presence). Quick actions sit in a ButtonGroup; "Record a gift" is the page's primary action, and a
   FloatingActionButton on a narrow window (useAppLayout, Show / Hide). */
import { NAV_PAGES } from '../site.jsx';
import { Badge, Button, ButtonGroup, Checkbox, Columns, CommandMenu, RetryNotice, useRetry, Divider, FloatingActionButton, Hide, HomePage, Icon, Inline, List, MetricCard,
  NotificationList, Panel, RowButton, SectionHeading, Stack, StatusDot, Text, WidgetGrid, useAppLayout, useToast } from 'plenix-platform';
import { CLERGY, FAMILIES, FEASTS, GIFTS, GIVING_BY_MONTH, MEMBERS, SERVICES, SERVING_SLOTS } from '../data.js';
const { useState } = React;

const TODAY = '2026-10-25';
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const count = (n) => new Intl.NumberFormat('en-US').format(n);
const shortDate = (iso) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso + 'T12:00'));
const clock = (hm) => { const [h, m] = hm.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM'); };

// the figures
const ACTIVE = MEMBERS.filter((m) => m.status === 'active').length;
const JOINED_RECENTLY = MEMBERS.filter((m) => m.joined >= '2024-01-01').length;
const sumMonth = (month) => GIFTS.filter((g) => g.date.slice(5, 7) === String(month).padStart(2, '0')).reduce((s, g) => s + g.amount, 0);
const OCTOBER = sumMonth(10), SEPTEMBER = sumMonth(9);
const SIGNED = SERVING_SLOTS.reduce((s, x) => s + x.signed.length, 0), NEEDED = SERVING_SLOTS.reduce((s, x) => s + x.needed, 0);
const FEAST_BADGE = { feast: { tone: 'active', icon: 'star', label: 'Feast' }, fast: { tone: 'waiting', icon: 'clock', label: 'Fast' },
  season: { tone: 'neutral', icon: 'calendar', label: 'Season' }, patron: { tone: 'success', icon: 'star', label: 'Patron feast' } };

// the office's made-up work for today
const TASKS = [
  { id: 't1', label: 'Print the weekly bulletin', description: '120 copies for the Divine Liturgy' },
  { id: 't2', label: 'Confirm the Agape meal count', description: 'Agape Kitchen asked by 10:00 AM' },
  { id: 't3', label: 'Send the Sunday School reminder', description: 'Grades 1–6, classes at 11:30 AM' },
  { id: 't4', label: 'Find a servant for the sound desk', description: 'November 1, 7:30 AM: nobody signed up yet' },
];
const NOTIFICATIONS = [
  { id: 'n1', text: 'Mina Habib signed up four servants for the parish festival', time: '9 min ago', unread: true },
  { id: 'n2', text: 'A new family filled in the visitor card: the Selim family', time: '1 hr ago', unread: true },
  { id: 'n3', text: 'The building fund report for Q3 is ready to review', time: 'Yesterday', unread: false },
  { id: 'n4', text: 'Fr. Antony Wahba published “Kiahk Midnight Praises schedule”', time: 'Oct 15', unread: false },
];
const OFFICE = [
  { id: CLERGY[0].id, name: CLERGY[0].name, role: CLERGY[0].role, tone: 'online', label: 'In the office' },
  { id: CLERGY[1].id, name: CLERGY[1].name, role: CLERGY[1].role, tone: 'busy', label: 'In a meeting' },
  { id: 'o1', name: 'Nevine Mikhail', role: 'Church office secretary', tone: 'online', label: 'In the office' },
  { id: 'o2', name: 'Hany Fahmy', role: 'Visitation servant', tone: 'away', label: 'Away' },
  { id: 'o3', name: 'Sarah Ibrahim', role: 'Food Pantry lead', tone: 'offline', label: 'Not in today' },
];
const WIDGETS = [
  { id: 'services', title: 'Services and feasts' },
  { id: 'tasks', title: 'Today’s tasks' },
  { id: 'giving', title: 'Giving' },
  { id: 'notifications', title: 'Notifications' },
  { id: 'office', title: 'In the office' },
  { id: 'livestream', title: 'Livestream' },
  { id: 'find', title: 'Find a page' },
];

// the floating "Record a gift" on a narrow window: it reads the shell's layout, so it is drawn inside the page
function RecordGiftFab({ onRecord }) {
  const layout = useAppLayout();
  return layout && layout.narrow ? <FloatingActionButton icon="field-currency" label="Record a gift" onClick={onRecord} /> : null;
}

// the livestream encoder's status: on a weekday the encoder in the sound room is switched off, so the refresh fails and the
// last known status stays on screen with a RetryNotice beside it (useRetry: three attempts, Retry starts a new series)
const encoderStatus = () => Promise.reject(new Error('The encoder in the sound room is switched off'));

export function DashboardScreen({ screen, chrome }) {
  const toast = useToast();
  const stream = useRetry(encoderStatus, { attempts: 3 });
  const [order, setOrder] = useState(WIDGETS);
  const [done, setDone] = useState([]);
  const [notes, setNotes] = useState(NOTIFICATIONS);
  const record = () => screen.navigate('/giving');
  const toggleTask = (task, on) => {
    setDone((d) => (on ? d.concat(task.id) : d.filter((x) => x !== task.id)));
    if (on) toast.show('Done: ' + task.label, { tone: 'success', action: { label: 'Undo', onAction: () => setDone((d) => d.filter((x) => x !== task.id)) } });
  };
  const visitors = MEMBERS.filter((m) => m.status === 'visitor').slice(0, 3);
  const feasts = FEASTS.filter((f) => f.date >= TODAY).slice(0, 4);
  const open = TASKS.length - done.length;
  const unread = notes.filter((n) => n.unread).length;

  const widgets = {
    services: (handle) => (
      <Panel icon="calendar" title="Services and feasts" actions={<Inline gap="xs"><Button size="xs" variant="ghost" onClick={() => screen.navigate('/calendar')}>Calendar</Button>{handle}</Inline>}>
        <Stack gap="sm">
          <SectionHeading level={3}>This week</SectionHeading>
          <List items={SERVICES.map((s) => ({ icon: 'clock', children: s.title + ' · ' + s.day + ' ' + clock(s.time) + ' · ' + s.place }))} />
          <Divider />
          <SectionHeading level={3}>Feasts and fasts</SectionHeading>
          {feasts.map((f) => { const b = FEAST_BADGE[f.kind]; return (
            <Inline key={f.id} justify="between" gap="sm">
              <Stack gap="none"><Text>{f.title}</Text><Text variant="data">{shortDate(f.date)}</Text></Stack>
              <Badge tone={b.tone} icon={b.icon}>{b.label}</Badge>
            </Inline>
          ); })}
        </Stack>
      </Panel>
    ),
    tasks: (handle) => (
      <Panel icon="checklist" title="Today’s tasks" actions={<Inline gap="xs">{open ? <Badge tone="waiting" size="sm">{String(open)}</Badge> : <Badge tone="success" icon="check" size="sm">All done</Badge>}{handle}</Inline>}>
        <Stack gap="sm">
          {TASKS.map((t) => <Checkbox key={t.id} label={t.label} description={t.description} checked={done.includes(t.id)} onChange={(e) => toggleTask(t, e.target.checked)} />)}
          <Divider />
          <SectionHeading level={3}>Visitors to welcome</SectionHeading>
          {visitors.map((m) => (
            <RowButton key={m.id} onClick={() => screen.navigate('/member/' + m.id)}>
              <Inline gap="sm"><Icon name="person" /><Stack gap="none"><Text variant="strong">{m.name}</Text><Text variant="secondary">Visitor · {m.district} district · {m.email}</Text></Stack></Inline>
            </RowButton>
          ))}
        </Stack>
      </Panel>
    ),
    giving: (handle) => (
      <Panel icon="field-currency" title="Giving" description="Every fund, every method" actions={<Inline gap="xs"><Button size="xs" variant="ghost" onClick={() => screen.navigate('/gifts')}>History</Button>{handle}</Inline>}>
        <Stack gap="md">
          <MetricCard type="comparison" title="This month" context="October against September" value={money(OCTOBER)}
            change={{ amount: Math.abs(Math.round((OCTOBER - SEPTEMBER) / SEPTEMBER * 100)) + '%', direction: OCTOBER >= SEPTEMBER ? 'up' : 'down', versus: 'vs September' }}
            goodWhen="up" compare={[{ label: 'October', value: money(OCTOBER), amount: OCTOBER, color: 'blue' }, { label: 'September', value: money(SEPTEMBER), amount: SEPTEMBER, color: 'gray' }]} />
          <MetricCard type="trend" title="This year" context="January to October"
            value={money(GIVING_BY_MONTH.reduce((s, m) => s + m.general + m.building + m.pantry, 0))}
            trend={GIVING_BY_MONTH.map((m) => m.general + m.building + m.pantry)} trendVariant="bar" trendLabel="Giving by month" footer="Updated this morning" />
        </Stack>
      </Panel>
    ),
    notifications: (handle) => (
      <Panel icon="hdr-bell" title="Notifications" flush actions={<Inline gap="xs">{unread ? <Badge tone="negative" size="sm">{String(unread)}</Badge> : null}{handle}</Inline>}>
        <NotificationList items={notes} onChange={setNotes} limit={4} onOpen={(n) => toast.show('Opened: ' + n.text)} onViewAll={() => screen.navigate('/messages')} />
      </Panel>
    ),
    office: (handle) => (
      <Panel icon="settings-users" title="In the office" description="Who is in today" actions={handle}>
        <Stack gap="sm">
          {OFFICE.map((p) => (
            <Inline key={p.id} gap="sm">
              <StatusDot tone={p.tone} size="md" icon label={p.label} />
              <Stack gap="none"><Text variant="strong">{p.name}</Text><Text variant="secondary">{p.role} · {p.label}</Text></Stack>
            </Inline>
          ))}
        </Stack>
      </Panel>
    ),
    livestream: (handle) => (
      <Panel icon="settings-camera" title="Livestream" description="The Divine Liturgy is streamed every Sunday" actions={handle}>
        <Stack gap="sm">
          <Inline gap="sm" justify="between"><Text>Last stream</Text><Text variant="data">Oct 25, 8:00 AM</Text></Inline>
          <Inline gap="sm" justify="between"><Text>Viewers</Text><Text variant="data">214</Text></Inline>
          <RetryNotice retry={stream} tone="warning" title="The stream status could not refresh" showCount>The sound room's encoder is switched off on weekdays.</RetryNotice>
        </Stack>
      </Panel>
    ),
    find: (handle) => (
      <Panel icon="search" title="Find a page" actions={handle}>
        <CommandMenu label="Find a page or a command" placeholder="Type a page, like members or calendar"
          items={NAV_PAGES.map((p) => ({ id: p.id, label: p.title, icon: p.icon, group: p.group, onSelect: () => screen.navigate(p.navOpen || p.open || p.path) }))} />
      </Panel>
    ),
  };

  return (
    <HomePage {...chrome} title="Parish office" description={'Sunday, October 25, 2026 · ' + count(ACTIVE) + ' active members'}
      actions={<Hide below="medium"><Button variant="primary" icon="field-currency" onClick={record}>Record a gift</Button></Hide>}>
      <RecordGiftFab onRecord={record} />
      <Columns count={3} collapseBelow="wide">
        <MetricCard icon="settings-users" title="Members" context="Active members" value={count(ACTIVE)} unit="active"
          change={{ amount: String(JOINED_RECENTLY), direction: 'up', versus: 'joined since 2024' }} goodWhen="up" href="#/members" headingLevel={2} />
        <MetricCard icon="home" title="Families" context="Households in the parish" value={count(FAMILIES.length)} unit="households" href="#/families" headingLevel={2} />
        <MetricCard icon="checklist" title="Servants signed up" context="The next eight days" value={String(SIGNED)} target={String(NEEDED)}
          status={SIGNED < NEEDED ? { tone: 'waiting', icon: 'clock', label: (NEEDED - SIGNED) + ' open' } : { tone: 'success', icon: 'check', label: 'Full' }} href="#/servants" headingLevel={2} />
      </Columns>
      <Inline wrap gap="sm" justify="between">
        <Text variant="secondary">Drag a widget’s handle, or use the arrow keys on it, to change the order.</Text>
        <ButtonGroup label="Quick actions">
          <Button icon="document" onClick={() => toast.show('The bulletin was sent to the office printer', { tone: 'success' })}>Print bulletin</Button>
          <Button icon="mail" onClick={() => screen.navigate('/messages')}>Email the parish</Button>
          <Button icon="hdr-bell" onClick={() => screen.navigate('/announcements')}>Announcements</Button>
        </ButtonGroup>
      </Inline>
      <WidgetGrid label="Parish office widgets" columns={3} items={order} renderItem={(w, handle) => widgets[w.id](handle)}
        onReorder={(ids) => setOrder(ids.map((id) => order.find((x) => x.id === id)))} />
    </HomePage>
  );
}
