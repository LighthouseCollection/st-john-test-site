/* St. John the Beloved test site · one event (site/screens/event.jsx), opened at #/event/<id> (e10, the parish
   festival of the Feast of St. John the Beloved, by default): the answer to the invitation (RadioTiles, with a Spotlight
   that shows where to answer), how many will come with you (Slider), the festival's preparation (ProgressSteps), its
   times (TimePicker), the answers received in a span of days (RelativeDateInput), feedback on last year's festival (an
   interactive Rating), and a Wizard in a Dialog to set up another event.
   Plenix parts: SitePage, PageContent, RecordPage, DateBadge, Badge, Panel, Columns, RadioTiles, Spotlight, Slider,
   ProgressSteps, TimePicker, RelativeDateInput, resolveRelativeDate, Rating, Textarea, Field, Input, Select, Wizard,
   Dialog, Button, Stack, Inline, Text, EmptyState, useToast. */
import { Badge, Button, Columns, DateBadge, Dialog, EmptyState, Field, Inline, Input, PageContent, Panel, ProgressSteps, RadioTiles, Rating,
  RecordPage, RelativeDateInput, Select, Slider, Spotlight, Stack, Text, Textarea, TimePicker, Wizard, formatDate, formatTime,
  resolveRelativeDate, useToast } from 'plenix-platform';
import { EVENTS, MEMBERS, save } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useEffect, useId } = React;

const NOW = new Date(2026, 9, 25);
// the answers received so far (made up): one a day or so over the last five weeks
const REPLIES = MEMBERS.slice(0, 60).map((m, i) => ({ id: 'r' + i, name: m.name, answer: i % 7 === 0 ? 'maybe' : i % 11 === 0 ? 'no' : 'yes',
  guests: i % 4, date: new Date(2026, 9, 25 - Math.floor(i * 0.6)) }));
const PREP = [{ label: 'Book the hall', description: 'Done in September' }, { label: 'Plan the menu', description: 'Agape Kitchen' },
  { label: 'Sign up servants', description: '31 of 40 places filled' }, { label: 'Set up the hall', description: 'The eve of the feast' }, { label: 'Festival day', description: 'The feast day' }];

export function EventScreen({ screen, chrome }) {
  const ev = EVENTS.find((e) => e.id === (screen.id || 'e10'));
  const toast = useToast();
  const rsvpId = 'rsvp-' + useId().replace(/:/g, '');
  const [answer, setAnswer] = useState('');
  const [guests, setGuests] = useState(3);
  const [spot, setSpot] = useState(false);
  const [target, setTarget] = useState(null);
  const [setup, setSetup] = useState('15:00');
  const [doors, setDoors] = useState('17:00');
  const [span, setSpan] = useState('last-7-days');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [wizard, setWizard] = useState(false);
  const [draft, setDraft] = useState({ title: '', place: 'Parish hall', date: '', start: '18:00', servants: 6 });
  useEffect(() => { setTarget(document.getElementById(rsvpId)); }, [rsvpId]);

  if (!ev) {
    return <SitePage chrome={chrome} page="detail"><PageContent>
      <EmptyState size="page" kind="not-found" title="This event is not on the calendar"
        action={<Button onClick={() => screen.navigate('/calendar')}>Open the calendar</Button>}>It may have been moved or cancelled.</EmptyState>
    </PageContent></SitePage>;
  }
  const start = new Date(ev.start), end = new Date(ev.end);
  const { from, to } = resolveRelativeDate(span, NOW) || {};
  const inSpan = REPLIES.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));
  const steps = [
    { id: 'what', label: 'What', validate: () => (draft.title.trim() ? '' : 'Give the event a name.'), content: (
      <Stack gap="sm">
        <Field label="Name"><Input value={draft.title} onChange={(e) => set('title')(e.target.value)} /></Field>
        <Field label="Place"><Select value={draft.place} onChange={(e) => set('place')(e.target.value)}
          options={['Church', 'Parish hall', 'Fellowship hall', 'Youth room', 'Library'].map((p) => ({ value: p, label: p }))} /></Field>
      </Stack>) },
    { id: 'when', label: 'When', validate: () => (draft.date ? '' : 'Choose the day of the event.'), content: (
      <Stack gap="sm">
        <Field label="Day"><Input type="date" value={draft.date} onChange={(e) => set('date')(e.target.value)} /></Field>
        <Field label="Starts at"><TimePicker value={draft.start} onChange={set('start')} step={30} min="07:00" max="22:00" /></Field>
      </Stack>) },
    { id: 'who', label: 'Servants', content: (
      <Slider label="Servants needed" value={draft.servants} min={0} max={40} step={1} onChange={set('servants')} />) },
  ];

  return (
    <SitePage chrome={chrome} page="detail">
      <PageContent>
        <RecordPage
          header={<RecordPage.Header title={ev.title}
            media={<DateBadge day={start.getDate()} weekday={new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(start)} dateTime={ev.start.slice(0, 10)} />}
            description={formatDate(start, { dateStyle: 'full' }) + ', ' + formatTime(start) + '–' + formatTime(end) + ' · ' + ev.place}
            meta={<Badge tone="success" icon="check">{ev.rsvp} coming</Badge>}
            actions={<Button icon="add" onClick={() => setWizard(true)}>Set up another event</Button>} />}>
          <Stack gap="lg">
            <Panel title="Will you come?" description="The Agape Kitchen plans the food by these answers."
              actions={<Button size="sm" variant="ghost" icon="circle-info" onClick={() => setSpot(true)}>Where do I answer?</Button>}>
              <Stack gap="md">
                <RadioTiles id={rsvpId} legend="Your answer" value={answer} onChange={(v) => { setAnswer(v); setSpot(false); save('events/' + ev.id + '/rsvps', 'POST', { answer: v }).catch(() => {}); }}
                  options={[{ value: 'yes', label: 'Yes, we will come', description: 'Count us for the dinner' },
                    { value: 'maybe', label: 'Maybe', description: 'We will answer by January 5' },
                    { value: 'no', label: 'We cannot come', description: 'Keep us in your prayers' }]} />
                <Spotlight target={target} open={spot} onDismiss={() => setSpot(false)} />
                <Slider label="People coming with you" value={guests} min={0} max={10} step={1} marks={[0, 2, 4, 6, 8, 10]} onChange={(v) => setGuests(v)} disabled={answer === 'no'} />
                <Inline justify="end"><Button variant="primary" icon="check" disabled={!answer}
                  onClick={() => toast.show(answer === 'no' ? 'Thank you for letting us know' : 'Your answer is saved: ' + (1 + guests) + ' coming', { tone: 'success' })}>Send my answer</Button></Inline>
              </Stack>
            </Panel>

            <Columns count={2} collapseBelow="wide">
              <Panel title="Preparation">
                <ProgressSteps label="Festival preparation" current={2} orientation="vertical" steps={PREP} />
              </Panel>
              <Panel title="Times" description="The hall is ours from noon.">
                <Stack gap="sm">
                  <Field label="Servants arrive"><TimePicker value={setup} onChange={setSetup} step={15} min="12:00" max={doors} /></Field>
                  <Field label="Doors open"><TimePicker value={doors} onChange={setDoors} step={15} min={setup} max="20:00" /></Field>
                </Stack>
              </Panel>
            </Columns>

            <Panel title="Answers received" description="How many families answered in a span of days.">
              <Stack gap="sm">
                <Field label="Received"><RelativeDateInput value={span} onChange={(v) => setSpan(v)} now={NOW} /></Field>
                <Text>{inSpan.length} answers: {inSpan.filter((r) => r.answer === 'yes').length} yes, {inSpan.filter((r) => r.answer === 'maybe').length} maybe,
                  {' '}{inSpan.filter((r) => r.answer === 'no').length} no, with {inSpan.reduce((n, r) => n + (r.answer === 'yes' ? r.guests : 0), 0)} guests.</Text>
              </Stack>
            </Panel>

            <Panel title="How was last year’s festival?" description="Your answer helps the servants plan this year.">
              <Stack gap="sm">
                <Rating label="Last year’s festival" value={stars} onChange={setStars} />
                <Field label="What should we keep or change?"><Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
                <Inline><Button icon="message" disabled={!stars} onClick={() => { toast.show('Thank you for your feedback', { tone: 'success' }); setComment(''); }}>Send feedback</Button></Inline>
              </Stack>
            </Panel>
          </Stack>
        </RecordPage>
      </PageContent>
      <Dialog open={wizard} onClose={() => setWizard(false)} title="Set up an event" size="md">
        <Wizard label="New event" steps={steps}
          summary={<Stack gap="xs"><Text>{draft.title || 'No name yet'} · {draft.place}</Text><Text>{draft.date || 'No day yet'} at {draft.start}</Text><Text>{draft.servants} servants needed</Text></Stack>}
          onCancel={() => setWizard(false)}
          onComplete={() => { setWizard(false); toast.show(draft.title + ' is on the calendar', { tone: 'success' }); setDraft({ title: '', place: 'Parish hall', date: '', start: '18:00', servants: 6 }); }} />
      </Dialog>
    </SitePage>
  );
}
