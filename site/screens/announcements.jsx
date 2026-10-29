/* St. John the Beloved test site · Announcements (site/screens/announcements.jsx): the church office's list of
   parish announcements. A ContentManagementPage of the ANNOUNCEMENTS (one card each, opening its editor), filtered by
   status with a SegmentedControl; a page Banner for the Nativity Fast, a pinned Announcement card (Kiahk), a Notice about the draft
   waiting for review, the review itself (ReviewFlow), each announcement's publishing state (Publish) and the office's
   NotificationList, and the parish council's vote (VoteTally) with a line that keeps an email and a case number in their own direction (Isolate).
   Every name and message is made up. */
import { Announcement, Banner, Button, Columns, ContentManagementPage, Heading, Isolate, Link, Notice, NotificationList, Panel, Publish, ReviewFlow, SegmentedControl, Stack, Text, VoteTally } from 'plenix-platform';
import { ANNOUNCEMENTS, CLERGY } from '../data.js';
const { useState } = React;

const STATUS = { Published: 'published', Scheduled: 'scheduled', Draft: 'draft' };
const WHEN = { a1: '2026-10-24T09:00', a2: '2026-10-22T18:30', a4: '2026-12-05T08:00' };

const NOTIFICATIONS = [
  { id: 'n1', text: 'Fr. Antony Wahba asked for changes to “Fellowship hall: the next building milestone”', time: '2026-10-25T09:12', unread: true },
  { id: 'n2', text: 'Mina Habib published “Servants needed for the parish festival”', time: '2026-10-22T18:30', unread: true },
  { id: 'n3', text: '“Kiahk Midnight Praises schedule” is scheduled for December 5', time: '2026-10-15T14:02', unread: false },
  { id: 'n4', text: '120 families were sent “The Nativity Fast begins on November 25”', time: '2026-10-24T09:01', unread: false },
];

export function AnnouncementsScreen({ screen, chrome }) {
  const [items, setItems] = useState(() => ANNOUNCEMENTS.map((a) => ({ ...a, state: STATUS[a.status] || 'draft', at: WHEN[a.id] })));
  const [tab, setTab] = useState('all');
  const [fastBanner, setFastBanner] = useState(true);
  const [draftNotice, setDraftNotice] = useState(true);
  // the parish council's vote on the Fellowship hall announcement (VoteTally): three members vote, one is away; the votes live in this page only
  const [votes, setVotes] = useState({ c1: 'approve', c2: null, c3: null });
  const [notes, setNotes] = useState(NOTIFICATIONS);
  const [review, setReview] = useState({ status: 'in-review', history: [
    { id: 'h1', name: 'Fr. Antony Wahba', decision: 'changes-requested', comment: 'Please add the amount still needed for the roof.', time: 'Oct 25, 9:12 AM', dateTime: '2026-10-25T09:12' },
  ] });
  const open = (id) => screen.navigate('/announcement/' + id);
  const setState = (id, state, at) => setItems((list) => list.map((a) => (a.id === id ? { ...a, state, at } : a)));
  const now = () => new Date().toISOString().slice(0, 16);

  const count = (s) => items.filter((a) => s === 'all' || a.state === s).length;
  const shown = items.filter((a) => tab === 'all' || a.state === tab);
  const cards = shown.map((a) => ({ id: a.id, title: a.title, description: a.body + ' · ' + a.author + ' · ' + a.audience, icon: 'hdr-bell', href: '#/announcement/' + a.id }));
  const draft = items.find((a) => a.id === 'a3');

  return (
    <ContentManagementPage {...chrome} title="Announcements"
      description="What the parish hears from the church office: the weekly bulletin, the website and the families’ email."
      actions={<Button variant="primary" icon="add" onClick={() => open('a1')}>New announcement</Button>}
      items={cards} onOpen={(item) => open(item.id)}
      strings={{ empty: 'No announcements with this status', emptyDescription: 'Choose another tab to see the others.' }}>
      <Stack gap="lg">
        {fastBanner ? (
          <Banner tone="info" title="The Nativity Fast begins on November 25." onDismiss={() => setFastBanner(false)}
            actions={<Button size="sm" onClick={() => open('a1')}>Open the announcement</Button>}>
            The fast runs until the Feast of the Nativity on January 7. Check that the fasting menu is in the bulletin.
          </Banner>
        ) : null}
        {draftNotice && draft && draft.state === 'draft' ? (
          <Notice tone="warning" title="A draft is waiting for review" onDismiss={() => setDraftNotice(false)}
            actions={<Button size="xs" onClick={() => open('a3')}>Open the draft</Button>}>
            “{draft.title}” needs the parish priest’s approval before it goes to the families.
          </Notice>
        ) : null}
        <Heading level={2}>Pinned</Heading>
        <Announcement id="kiahk-2026" variant="card" title="Kiahk Midnight Praises"
          actions={<Link href="#/announcement/a4" variant="standalone">See the schedule</Link>}
          onDismiss={() => Promise.resolve()}>
          Every Saturday of Kiahk the Midnight Praises begin at 8:00 PM, after Vespers. This note stays at the top of the
          parish website until the Feast of the Nativity.
        </Announcement>
        <Columns ratio="sidebar-end" collapseBelow="wide">
          <Stack gap="md">
            <Panel title="Publishing" description="Each announcement’s state. Publishing sends it to the website and the families’ email.">
              <Stack gap="md">
                {items.map((a) => (
                  <Stack gap="xs" key={a.id}>
                    <Link href={'#/announcement/' + a.id} variant="standalone">{a.title}</Link>
                    <Publish name={a.title} status={a.state} audience={a.audience === 'Servants' ? 'the parish servants' : 'every family of the parish'}
                      publishedAt={a.state === 'published' ? a.at : undefined} scheduledFor={a.state === 'scheduled' ? a.at : undefined} by={a.author}
                      onPublish={() => setState(a.id, 'published', now())} onSchedule={(at) => setState(a.id, 'scheduled', at)}
                      onCancelSchedule={() => setState(a.id, 'draft')} onUnpublish={() => setState(a.id, 'draft')} />
                  </Stack>
                ))}
              </Stack>
            </Panel>
            <Panel title="Waiting for review">
              <ReviewFlow title={draft ? draft.title : 'Fellowship hall'} detail="Submitted by the parish council on October 18"
                status={review.status} history={review.history}
                reviewers={[{ id: 'c1', name: CLERGY[0].name, decision: review.status === 'approved' ? 'approved' : undefined }, { id: 'c2', name: CLERGY[1].name, decision: 'changes-requested' }]}
                onDecision={(decision, comment) => setReview((r) => ({ status: decision, history: [{ id: 'h' + (r.history.length + 1), name: CLERGY[0].name, decision, comment, time: 'Just now', dateTime: now() }].concat(r.history) }))} />
            </Panel>
            <Panel title="Parish council vote" description="The council approves the Fellowship hall announcement before it is published.">
              <Stack gap="sm">
                <VoteTally label="Fellowship hall announcement: approve for publishing" members={[
                  { memberId: 'c1', name: CLERGY[0].name, role: CLERGY[0].role, vote: votes.c1 },
                  { memberId: 'c2', name: CLERGY[1].name, role: CLERGY[1].role, vote: votes.c2 },
                  { memberId: 'c3', name: 'Mariam Boules', role: 'Council secretary', vote: votes.c3 },
                  { memberId: 'c4', name: 'Fr. Daniel (visiting)', role: 'Guest priest', disabledReason: 'Absent' },
                ]} onVote={(id, option) => setVotes((v) => ({ ...v, [id]: option }))} />
                <Text>Send questions about the vote to <Isolate kind="email">council@stjohn.example.org</Isolate> and quote the case number <Isolate>FH-2026-10-18</Isolate>.</Text>
              </Stack>
            </Panel>
          </Stack>
          <Panel title="Notifications">
            <NotificationList items={notes} onChange={setNotes} onOpen={() => open('a3')} label="Announcement notifications" />
          </Panel>
        </Columns>
        <SegmentedControl label="Show announcements" value={tab} onChange={setTab} options={[
          { value: 'all', label: 'All (' + count('all') + ')' },
          { value: 'published', label: 'Published (' + count('published') + ')' },
          { value: 'scheduled', label: 'Scheduled (' + count('scheduled') + ')' },
          { value: 'draft', label: 'Drafts (' + count('draft') + ')' },
        ]} />
      </Stack>
    </ContentManagementPage>
  );
}
