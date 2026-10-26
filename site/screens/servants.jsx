/* St. John the Beloved test site · Servants and sign-ups (site/screens/servants.jsx): the serving places of the
   coming days (SERVING_SLOTS) with how full each is, the servants assigned to one place (TransferList) and its lead
   (AssignControl), removing a servant with Undo (useUndo), what a new servant does before serving (Checklist), sign-up
   requests waiting for the office (ReviewQueue, WorkflowStatus), a new servant's approval by the ministry lead, the office
   and the priest (ApprovalWorkflow), and the page's actions (ActionBar).
   Plenix parts: SitePage, PageContent, RecordPage.Header, Panel, Columns, Stack, Inline, Text, ProgressBar, Select, Field,
   TransferList, AssignControl, Button, useUndo, useToast, Checklist, ReviewQueue, WorkflowStatus, ApprovalWorkflow,
   ActionBar, RowButton. */
import { ActionBar, ApprovalWorkflow, AssignControl, Button, Checklist, Columns, Field, Inline, PageContent, Panel, ProgressBar, RecordPage,
  ReviewQueue, RowButton, Select, Stack, Text, TransferList, WorkflowStatus, formatDate, useToast, useUndo } from 'plenix-platform';
import { MEMBERS, MINISTRIES, ME, SERVING_SLOTS, memberById, save } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState } = React;

const SERVANTS = MEMBERS.filter((m) => m.servant);
const day = (iso) => new Date(iso + 'T00:00');
const ministryName = (id) => (MINISTRIES.find((m) => m.id === id) || {}).name || '';
const STEPS_BEFORE = [
  { id: 'prep', label: 'Attend Servants’ Preparation', description: 'Four Tuesday evenings with Fr. Daniel Boulos.' },
  { id: 'safety', label: 'Finish the child safety course', description: 'Online, about an hour; the office keeps the certificate.' },
  { id: 'conduct', label: 'Sign the servants’ code of conduct', description: 'In the church office or at the bookstore table.' },
  { id: 'shadow', label: 'Serve once beside an experienced servant', description: 'Choose any open place below.' },
];
const FIRST_REQUESTS = [
  { id: 'rq1', name: 'Usher · Nov 1, Divine Liturgy', type: 'Ushers', submittedBy: 'Peter Habib', submitted: '2026-10-22', status: 'in-review' },
  { id: 'rq2', name: 'Agape kitchen · Nov 1', type: 'Agape Kitchen', submittedBy: 'Martha Fahmy', submitted: '2026-10-23', status: 'in-review' },
  { id: 'rq3', name: 'Sound desk · Nov 1', type: 'Media and Sound', submittedBy: 'Fady Mikhail', submitted: '2026-10-23', status: 'in-review' },
  { id: 'rq4', name: 'Food pantry: sorting · Oct 31', type: 'Food Pantry', submittedBy: 'Sophia Ibrahim', submitted: '2026-10-24', status: 'in-review' },
  { id: 'rq5', name: 'Visitation: hospital · Nov 3', type: 'Visitation', submittedBy: 'Hany Boutros', submitted: '2026-10-24', status: 'changes-requested' },
];
const FIRST_APPROVAL = [
  { id: 'lead', label: 'Ministry lead', reviewers: [{ id: 'r-marina', name: 'Marina Girgis', decision: 'approved' }],
    history: [{ id: 'h1', name: 'Marina Girgis', decision: 'approved', comment: 'She helped in Grades 3–4 all summer.', time: 'Oct 20', dateTime: '2026-10-20' }] },
  { id: 'office', label: 'Church office', reviewers: [{ id: ME.id, name: ME.name }], history: [] },
  { id: 'priest', label: 'Parish priest', reviewers: [{ id: 'c1', name: 'Fr. Daniel Boulos' }], history: [] },
];

export function ServantsScreen({ chrome }) {
  const toast = useToast();
  const undoable = useUndo();
  const [slots, setSlots] = useState(() => SERVING_SLOTS.map((s) => ({ ...s, lead: s.signed[0] || null })));
  const [current, setCurrent] = useState('sl1');
  const [done, setDone] = useState(['prep']);
  const [requests, setRequests] = useState(FIRST_REQUESTS);
  const [approval, setApproval] = useState(FIRST_APPROVAL);
  const slot = slots.find((s) => s.id === current);
  // a change to who is signed up is saved in the parish database (PUT api/slots/<id>/signups)
  const update = (id, change) => {
    setSlots((list) => list.map((s) => (s.id === id ? { ...s, ...change } : s)));
    if (change.signed) save('slots/' + id + '/signups', 'PUT', { members: change.signed }).catch((e) => toast.show(e.message, { tone: 'danger' }));
  };
  const people = SERVANTS.concat(slot.signed.filter((id) => !SERVANTS.some((m) => m.id === id)).map(memberById).filter(Boolean));
  const remove = (memberId) => {
    const before = slot.signed, who = memberById(memberId);
    update(slot.id, { signed: before.filter((x) => x !== memberId), lead: slot.lead === memberId ? null : slot.lead });
    undoable((who ? who.name : 'The servant') + ' removed from ' + slot.role, { onUndo: () => update(slot.id, { signed: before, lead: slot.lead }) });
  };
  const decideRequests = (ids, decision) => setRequests((list) => list.map((r) => (ids.indexOf(r.id) >= 0 ? { ...r, status: decision } : r)));
  const waiting = requests.filter((r) => r.status === 'in-review').length;
  const decideApproval = ({ stepId, reviewerId, decision, comment }) => setApproval((steps) => steps.map((s) => (s.id !== stepId ? s : {
    ...s,
    reviewers: s.reviewers.map((r) => (r.id === reviewerId ? { ...r, decision } : r)),
    history: [{ id: 'h' + Date.now(), name: ME.name, decision, comment, time: 'Today', dateTime: '2026-10-25' }].concat(s.history),
  })));

  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <Stack gap="lg">
          <RecordPage.Header title="Servants and sign-ups" headingLevel={1}
            description={SERVANTS.length + ' servants serve the parish. Fill the open places of the coming week, and approve the new sign-ups.'} />

          <Columns ratio="sidebar-start" collapseBelow="wide">
            <Panel title="Open places" description="Choose a place to see who serves there." flush>
              <Stack as="ul" gap="none" aria-label="Serving places">
                {slots.map((s) => (
                  <li key={s.id}>
                    <RowButton selected={s.id === current} onClick={() => setCurrent(s.id)}>
                      <Stack gap="xs" inset="sm">
                        <Text variant="strong">{s.role}</Text>
                        <Text variant="secondary">{formatDate(day(s.date))} · {s.time} · {ministryName(s.ministry)}</Text>
                        <ProgressBar value={Math.min(s.signed.length, s.needed)} max={s.needed} size="sm" tone={s.signed.length >= s.needed ? 'success' : 'warning'}
                          label={s.signed.length + ' of ' + s.needed + ' servants'} />
                      </Stack>
                    </RowButton>
                  </li>
                ))}
              </Stack>
            </Panel>

            <Panel title={slot.role} description={formatDate(day(slot.date)) + ' at ' + slot.time + ' · ' + ministryName(slot.ministry)}
              actions={<Field label="Place" hideLabel><Select value={current} onChange={(e) => setCurrent(e.target.value)}
                options={slots.map((s) => ({ value: s.id, label: s.role + ' · ' + s.date }))} /></Field>}>
              <Stack gap="md">
                <AssignControl label="Lead servant" me={ME.id} value={slot.lead}
                  people={people.filter((p) => slot.signed.indexOf(p.id) >= 0 || p.id === ME.id).map((p) => ({ value: p.id, label: p.name, description: p.district + ' district' }))}
                  onChange={(value) => update(slot.id, { lead: value })} />
                <TransferList label={'Servants for ' + slot.role} search size="sm"
                  titles={{ source: 'Servants', target: 'Serving here (' + slot.signed.length + ' of ' + slot.needed + ')' }}
                  options={people.map((p) => ({ value: p.id, label: p.name, meta: p.id }))}
                  value={slot.signed} onChange={(values) => update(slot.id, { signed: values })} />
                <Stack gap="xs">
                  <Text variant="label">Serving here</Text>
                  {slot.signed.length ? slot.signed.map((id) => {
                    const who = memberById(id);
                    return (
                      <Inline key={id} gap="sm" justify="between">
                        <Text>{who ? who.name : id}{slot.lead === id ? ' · lead' : ''}</Text>
                        <Button size="xs" variant="ghost" icon="trash" onClick={() => remove(id)} label={'Remove ' + (who ? who.name : id)}>Remove</Button>
                      </Inline>
                    );
                  }) : <Text variant="secondary">Nobody yet.</Text>}
                </Stack>
              </Stack>
            </Panel>
          </Columns>

          <Panel title="Sign-up requests" description="Servants who asked for a place. Select requests to approve them, ask for changes or turn them down."
            actions={<Inline gap="xs"><WorkflowStatus status="in-review" label={waiting + ' waiting'} />
              <WorkflowStatus status="approved" label={requests.filter((r) => r.status === 'approved').length + ' approved'} /></Inline>}>
            <ReviewQueue label="Sign-up requests" noun="request" items={requests} onDecision={(ids, decision) => decideRequests(ids, decision)} />
          </Panel>

          <Columns count={2} collapseBelow="wide">
            <Panel title="Before you serve" description="What every new servant finishes before serving alone.">
              <Checklist title="New servant steps" items={STEPS_BEFORE} completed={done} onChange={(ids) => setDone(ids)} />
            </Panel>
            <Panel title="New servant: Mariam Fahmy" description="Asked to serve in Sunday School, Grades 3–4.">
              <ApprovalWorkflow title="Sunday School servant" steps={approval} reviewerId={ME.id} onDecision={decideApproval} />
            </Panel>
          </Columns>

          <ActionBar label="Sign-up actions">
            <Button icon="download-arrow" onClick={() => toast.show('The serving schedule is ready to print')}>Print the schedule</Button>
            <Button icon="mail" onClick={() => toast.show('Reminders sent to ' + slots.reduce((n, s) => n + s.signed.length, 0) + ' servants', { tone: 'success' })}>Send reminders</Button>
          </ActionBar>
        </Stack>
      </PageContent>
    </SitePage>
  );
}
