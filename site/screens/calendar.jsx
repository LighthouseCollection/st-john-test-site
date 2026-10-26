/* St. John the Beloved test site · Calendar (site/screens/calendar.jsx): the parish's events, weekly services and
   the feasts and fasts of the liturgical calendar, as a month (Calendar with the chosen day's events), a week (TimeGrid of
   EventChips under DateBadges) or an agenda (DateBadge and EventChip rows), switched by a SegmentedControl. The chosen
   event shows beside the calendar (SplitView with a ReadingPane); on a narrow window it opens in a Sheet instead.
   Plenix parts: SitePage, PageContent, SplitView, ReadingPane, SegmentedControl, Calendar, TimeGrid, EventChip, DateBadge,
   Sheet, Heading, Stack, Inline, Text, Badge, Button, EmptyState, below (the narrow window class). */
import { Badge, Button, Calendar, DateBadge, EmptyState, EventChip, Heading, Inline, PageContent, ReadingPane, SegmentedControl, Sheet, SplitView,
  Stack, Text, TimeGrid, below, formatDate, formatTime } from 'plenix-platform';
import { EVENTS, FEASTS, MINISTRIES, SERVICES } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useEffect } = React;

const TODAY = '2026-10-25';
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dateOf = (iso) => new Date(iso.slice(0, 10) + 'T00:00');
const hourOf = (t) => Number(t.slice(11, 13)) + Number(t.slice(14, 16)) / 60;
const weekday = (d) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
// the data's colors that the event chip has no hue for take the nearest data color
const HUE = { orange: 'brown', teal: 'blue' };
const hue = (c) => HUE[c] || c;
// every dated thing of the calendar: the events, and the feasts and fasts as all-day items
const ITEMS = EVENTS.map((e) => ({ ...e, date: e.start.slice(0, 10), color: hue(e.color), kind: 'event' }))
  .concat(FEASTS.map((f) => ({ id: f.id, title: f.title, date: f.date, kind: f.kind, color: f.kind === 'fast' ? 'purple' : 'red', place: 'The whole Church' })))
  .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')));
const timeText = (e) => (e.start ? formatTime(new Date(e.start)) + '–' + formatTime(new Date(e.end)) : 'All day');

function useNarrow() {
  const query = below('--plx-sys-shell-phone-below');
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query), on = () => setNarrow(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

function EventDetail({ item, onOpen }) {
  const ministry = MINISTRIES.find((m) => m.id === item.ministry);
  return (
    <Stack gap="sm">
      <Inline gap="sm"><DateBadge day={dateOf(item.date).getDate()} weekday={weekday(dateOf(item.date))} dateTime={item.date} today={item.date === TODAY} />
        <Stack gap="none"><Text variant="strong">{formatDate(dateOf(item.date), { dateStyle: 'full' })}</Text><Text variant="secondary">{timeText(item)}</Text></Stack></Inline>
      <Text>Place: {item.place}</Text>
      {ministry ? <Text>Ministry: {ministry.name}</Text> : null}
      {item.kind !== 'event' ? <Text variant="secondary">A {item.kind === 'fast' ? 'fast' : item.kind === 'season' ? 'season' : 'feast'} of the Coptic Orthodox Church.</Text> : null}
      {item.rsvp ? <Text>{item.rsvp} people are coming.</Text> : null}
      {item.kind === 'event' ? <Inline><Button icon="open" onClick={onOpen}>Open the event</Button></Inline> : null}
    </Stack>
  );
}

export function CalendarScreen({ screen, chrome }) {
  const narrow = useNarrow();
  const [view, setView] = useState('month');
  const [dayIso, setDayIso] = useState(TODAY);
  const [chosen, setChosen] = useState(null);
  const item = ITEMS.find((x) => x.id === chosen);
  const pick = (id) => setChosen(id);
  const openEvent = () => screen.navigate('/event/' + item.id);

  // the week (Sunday to Saturday) around the chosen day
  const first = dateOf(dayIso); first.setDate(first.getDate() - first.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(first); d.setDate(first.getDate() + i); return d; });
  const days = week.map((d) => ({ key: isoOf(d), weekday: weekday(d), day: d.getDate(), dateTime: isoOf(d), today: isoOf(d) === TODAY }));
  const keys = days.map((d) => d.key);
  const weekEvents = EVENTS.filter((e) => keys.indexOf(e.start.slice(0, 10)) >= 0).map((e) => ({
    id: e.id, day: e.start.slice(0, 10), start: hourOf(e.start), end: e.end.slice(0, 10) === e.start.slice(0, 10) ? hourOf(e.end) : 22,
    title: e.title, time: formatTime(new Date(e.start)), color: hue(e.color), onClick: () => pick(e.id),
  }));
  const onDay = ITEMS.filter((x) => x.date === dayIso);
  const upcoming = ITEMS.filter((x) => x.date >= TODAY);

  const views = (
    <Stack gap="md">
      <Inline gap="md" justify="between" wrap>
        <Heading level={1}>Calendar</Heading>
        <SegmentedControl label="Calendar view" value={view} onChange={setView}
          options={[{ value: 'month', label: 'Month', icon: 'calendar' }, { value: 'week', label: 'Week', icon: 'grid-3x2' }, { value: 'agenda', label: 'Agenda', icon: 'list-lines' }]} />
      </Inline>
      {view === 'month' ? (
        <Stack gap="md">
          <Calendar label="Parish calendar" value={dayIso} onChange={(d) => setDayIso(d)} today={TODAY} />
          <Stack gap="sm">
            <Heading level={2}>{formatDate(dateOf(dayIso), { dateStyle: 'full' })}</Heading>
            {onDay.length ? onDay.map((x) => <EventChip key={x.id} title={x.title} time={timeText(x)} color={x.color} onClick={() => pick(x.id)} />)
              : <Text variant="secondary">Nothing on this day. The weekly services: {SERVICES.map((s) => s.title + ' (' + s.day + ')').join(', ')}.</Text>}
          </Stack>
        </Stack>
      ) : null}
      {view === 'week' ? (
        <Stack gap="sm">
          <Inline gap="sm">
            <Button size="sm" icon="chevron-left" iconOnly label="Previous week" onClick={() => setDayIso(isoOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() - 7)))} />
            <Button size="sm" onClick={() => setDayIso(TODAY)}>This week</Button>
            <Button size="sm" icon="chevron-right" iconOnly label="Next week" onClick={() => setDayIso(isoOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() + 7)))} />
            <Text variant="secondary">Week of {formatDate(week[0])}</Text>
          </Inline>
          <TimeGrid label={'Week of ' + formatDate(week[0])} days={days} startHour={7} endHour={22} events={weekEvents} />
        </Stack>
      ) : null}
      {view === 'agenda' ? (
        <Stack as="ol" gap="sm" aria-label="Coming up">
          {upcoming.map((x) => (
            <Inline as="li" key={x.id} gap="md">
              <DateBadge day={dateOf(x.date).getDate()} weekday={weekday(dateOf(x.date))} dateTime={x.date} today={x.date === TODAY} />
              <Stack gap="xs" grow>
                <EventChip title={x.title} time={timeText(x)} color={x.color} onClick={() => pick(x.id)} />
                {x.kind !== 'event' ? <Inline><Badge tone={x.kind === 'fast' ? 'waiting' : 'active'} icon={x.kind === 'fast' ? 'clock' : 'star'}>{x.kind === 'fast' ? 'Fast' : x.kind === 'season' ? 'Season' : 'Feast'}</Badge></Inline> : null}
              </Stack>
            </Inline>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );

  if (narrow) {
    return (
      <SitePage chrome={chrome} page="workspace">
        <PageContent>{views}</PageContent>
        <Sheet open={!!item} onClose={() => setChosen(null)} title={item ? item.title : ''}>
          {item ? <EventDetail item={item} onOpen={openEvent} /> : null}
        </Sheet>
      </SitePage>
    );
  }
  return (
    <SitePage chrome={chrome} page="master-detail">
      <PageContent>
        <SplitView label="Calendar" firstLabel="Calendar" defaultSize={640} first={views}
          second={<ReadingPane label={item ? item.title : 'Event'}
            actions={item ? <Inline gap="sm"><Button size="sm" icon="close" onClick={() => setChosen(null)}>Close</Button></Inline> : null}
            empty={<EmptyState icon="calendar" title="No event chosen">Choose an event in the calendar to see it here.</EmptyState>}>
            {item ? <Stack gap="md"><Heading level={2}>{item.title}</Heading><EventDetail item={item} onOpen={openEvent} /></Stack> : null}
          </ReadingPane>} />
      </PageContent>
    </SitePage>
  );
}
