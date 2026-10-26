/* St. John the Beloved test site · Feast planning (site/screens/planning.jsx): the preparation of the festival of
   St. John the Beloved on January 12 (GanttChart: tasks, what waits on what, today), the season it falls in (TimelineChart:
   the Nativity Fast, the month of Kiahk and the feasts), and the planning team's milestones (Timeline) beside the
   meeting notes, which people widen by the edge between them (PanelSplitter) or by the notes' own edges (Resizable).
   Plenix parts: SitePage, PageContent, RecordPage.Header, GanttChart, TimelineChart, Timeline, Resizable, PanelSplitter,
   Panel, Heading, Field, Textarea, Badge, Stack, Inline, Text, Button, useToast. */
import { Badge, Button, Field, GanttChart, Heading, Inline, PageContent, Panel, PanelSplitter, RecordPage, Resizable, Stack, Text, Textarea,
  Timeline, TimelineChart, useToast } from 'plenix-platform';
import { FEASTS } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState } = React;

const TODAY = new Date(2026, 9, 25);
const feast = (id) => FEASTS.find((f) => f.id === id).date;
const TASKS = [
  { id: 'hall', label: 'Book the hall', start: '2026-09-14', end: '2026-09-25', progress: 1, status: 'Done' },
  { id: 'theme', label: 'Choose the theme', start: '2026-09-28', end: '2026-10-09', progress: 1, status: 'Done' },
  { id: 'menu', label: 'Plan the menu', start: '2026-10-12', end: '2026-11-06', progress: 0.6, dependsOn: ['theme'], status: 'On track' },
  { id: 'servants', label: 'Sign up servants', start: '2026-10-19', end: '2026-12-18', progress: 0.4, dependsOn: ['theme'], status: 'On track' },
  { id: 'play', label: 'Play rehearsals', start: '2026-11-08', end: '2027-01-10', progress: 0, dependsOn: ['theme'], status: 'Not started' },
  { id: 'hymns', label: 'Feast hymns', start: '2026-11-12', end: '2027-01-07', progress: 0.1, status: 'On track' },
  { id: 'flyer', label: 'Flyer', start: '2026-11-30', end: '2026-12-11', progress: 0, dependsOn: ['theme'], status: 'Not started' },
  { id: 'shop', label: 'Buy the food', start: '2027-01-04', end: '2027-01-10', progress: 0, dependsOn: ['menu'], status: 'Not started' },
  { id: 'setup', label: 'Set up the hall', start: '2027-01-11', end: '2027-01-12', progress: 0, dependsOn: ['hall', 'shop'], status: 'Not started' },
  { id: 'festival', label: 'Festival', start: feast('patron'), milestone: true, dependsOn: ['setup', 'play'] },
];
const SEASON = [
  { id: 'fast', lane: 'fast', label: 'Nativity Fast', start: feast('nativity-fast'), end: '2027-01-06' },
  { id: 'kiahk', lane: 'kiahk', label: 'Kiahk', start: feast('kiahk'), end: '2027-01-08' },
  { id: 'praises', lane: 'praises', label: 'Kiahk praises', start: '2026-12-12', end: '2027-01-02' },
  { id: 'nativity', lane: 'nativity', label: 'Nativity', start: feast('nativity') },
  { id: 'patron', lane: 'patron', label: 'Patron feast', start: feast('patron') },
  { id: 'theophany', lane: 'theophany', label: 'Theophany', start: feast('theophany') },
];
const MILESTONES = [
  { id: 1, time: 'Sep 25, 2026', dateTime: '2026-09-25', title: 'The parish hall is booked', icon: 'home', badge: <Badge tone="success" icon="check">Done</Badge> },
  { id: 2, time: 'Oct 9, 2026', dateTime: '2026-10-09', title: 'Theme chosen: the beloved disciple and his love for the Church', icon: 'star', badge: <Badge tone="success" icon="check">Done</Badge> },
  { id: 3, time: 'Nov 6, 2026', dateTime: '2026-11-06', title: 'The menu is settled', description: 'Fasting dishes, since the festival falls after the Nativity.', icon: 'checklist', badge: <Badge tone="active" icon="progress">In progress</Badge> },
  { id: 4, time: 'Dec 18, 2026', dateTime: '2026-12-18', title: 'Every servant place is filled', icon: 'settings-users', badge: <Badge tone="waiting" icon="clock">Not started</Badge> },
  { id: 5, time: 'Jan 12, 2027', dateTime: '2027-01-12', title: 'Feast of St. John the Beloved: the festival', icon: 'calendar' },
];

export function PlanningScreen({ chrome }) {
  const toast = useToast();
  const [width, setWidth] = useState(400);
  const [notes, setNotes] = useState('Oct 20 meeting: the youth will run the games. Ask the bookstore for a table of icons and the Kiahk hymn books. Fr. Daniel will bless the hall at 4:30 PM.');

  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <Stack gap="lg">
          <RecordPage.Header title="Feast planning" headingLevel={1}
            description="The festival of the Feast of St. John the Beloved, January 12, 2027, in the parish hall." />

          <GanttChart title="Festival preparation" today={TODAY} tasks={TASKS}
            description="The menu and the servant sign-ups are under way; buying the food waits on the menu, and the setup on the shopping." />

          <TimelineChart title="The Nativity Fast and Kiahk" today={TODAY} items={SEASON}
            lanes={SEASON.map((x) => ({ id: x.id, label: x.label }))} labels={false}
            description="The festival comes five days after the Nativity, when the fast is over and the month of Kiahk has ended." />

          <Inline gap="md" align="stretch">
            <Stack gap="sm" grow>
              <Heading level={2}>Milestones</Heading>
              <Timeline label="Festival milestones" items={MILESTONES} />
            </Stack>
            <Resizable label="Notes" axis="horizontal" width={width} onResize={({ width: w }) => setWidth(w)} minWidth={240} maxWidth={560}>
              <PanelSplitter label="Resize the notes" edge="start" value={width} min={240} max={() => 560} onChange={(w) => setWidth(w)} />
              <Panel title="Meeting notes" description="The planning team meets on the first Tuesday of the month.">
                <Stack gap="sm">
                  <Field label="Notes" hideLabel><Textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                  <Text variant="secondary">{notes.trim() ? notes.trim().split(/\s+/).length : 0} words</Text>
                  <Inline justify="end"><Button icon="save" onClick={() => toast.show('Notes saved', { tone: 'success' })}>Save notes</Button></Inline>
                </Stack>
              </Panel>
            </Resizable>
          </Inline>
        </Stack>
      </PageContent>
    </SitePage>
  );
}
