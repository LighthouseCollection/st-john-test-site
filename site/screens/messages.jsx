/* St. John the Beloved test site · Messages (site/screens/messages.jsx): the church office inbox. The conversations
   in an ActivityList (unread ones marked), the open one in Chat (its header, the thread, the typing dots and the
   composer; a sent message gets a made-up reply), who in the office is also reading it (PresenceBar), and the Agape
   sign-up the Habib family is asking about, which the office can update from here. Every name and message is made up. */
import { ActivityList, Avatar, Badge, Button, Chat, Columns, Inline, PageContent, Panel, PresenceBar, RecordPage, Stack, Text } from 'plenix-platform';
import { CLERGY, SERVING_SLOTS, memberById } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useEffect, useRef } = React;

const AGAPE = SERVING_SLOTS.find((s) => s.ministry === 'agape');
const START = [
  { id: 'habib', title: 'The Habib family', meta: 'Agape sign-up for November 1', unread: true, reply: 'Thank you! We will bring the lentil soup.', messages: [
    { id: 1, author: 'Nevine Habib', time: '9:02 AM', dateTime: '2026-10-25T09:02', text: 'Good morning! Can our family serve at the Agape meal on November 1? We are four.' },
    { id: 2, author: 'Nevine Habib', time: '9:03 AM', dateTime: '2026-10-25T09:03', text: 'The kids can set the tables, and I can help in the kitchen.' },
    { id: 3, mine: true, time: '9:20 AM', dateTime: '2026-10-25T09:20', text: 'Good morning, Nevine. The kitchen has six servants already; setting the tables still needs hands.' },
    { id: 4, author: 'Nevine Habib', time: '9:24 AM', dateTime: '2026-10-25T09:24', text: 'Tables it is. What time should we come?' },
  ] },
  { id: 'pantry', title: 'Sarah Ibrahim', meta: 'Food Pantry: Saturday sorting', unread: true, reply: 'Perfect, I will tell the sorting team.', messages: [
    { id: 1, author: 'Sarah Ibrahim', time: '8:15 AM', dateTime: '2026-10-25T08:15', text: 'We are three servants short for Saturday’s sorting. Could the office put it in the bulletin?' },
  ] },
  { id: 'bulletin', title: CLERGY[1].name, meta: 'This week’s bulletin', unread: false, reply: 'Good. Send me the final copy on Thursday.', messages: [
    { id: 1, author: CLERGY[1].name, time: 'Yesterday', dateTime: '2026-10-24T16:40', text: 'Please add the Bible Study on the Gospel of St. John to the bulletin.' },
    { id: 2, mine: true, time: 'Yesterday', dateTime: '2026-10-24T16:55', text: 'Added, Abouna, on page two with the room and the time.' },
  ] },
  { id: 'girgis', title: 'The Girgis family', meta: 'Sunday School for a new child', unread: false, reply: 'Thank you, we will be there on Sunday.', messages: [
    { id: 1, author: 'Mark Girgis', time: 'Oct 22', dateTime: '2026-10-22T19:10', text: 'Our daughter turns six this month. Which Sunday School class should she join?' },
    { id: 2, mine: true, time: 'Oct 22', dateTime: '2026-10-22T19:30', text: 'Kindergarten, with Marina Girgis, in classroom 2 after the Divine Liturgy.' },
  ] },
];
const OFFICE = [
  { id: 'o1', name: 'Church office', role: 'viewer' },
  { id: 'o2', name: CLERGY[0].name, role: 'viewer' },
];
const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function MessagesScreen({ chrome }) {
  const [convs, setConvs] = useState(START);
  const [openId, setOpenId] = useState('habib');
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const signed = AGAPE ? AGAPE.signed.length : 0;
  const [added, setAdded] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const conv = convs.find((c) => c.id === openId);
  const update = (id, fn) => setConvs((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  const open = (id) => { setOpenId(id); setTyping(false); update(id, (c) => ({ ...c, unread: false })); };
  const send = (value) => {
    const body = String(value || '').trim();
    if (!body) return;
    const id = openId;
    update(id, (c) => ({ ...c, messages: c.messages.concat({ id: c.messages.length + 1, mine: true, time: clock(), text: body }) }));
    setText('');
    timers.current.push(setTimeout(() => setTyping(true), 800));
    timers.current.push(setTimeout(() => {
      setTyping(false);
      update(id, (c) => ({ ...c, messages: c.messages.concat({ id: c.messages.length + 1, author: c.messages.find((m) => !m.mine).author, time: clock(), text: c.reply }) }));
    }, 2600));
  };
  const unread = convs.filter((c) => c.unread).length;
  const theirs = conv.messages.find((m) => !m.mine).author;

  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <RecordPage header={<RecordPage.Header title="Messages" description="The church office inbox: families, servants and clergy."
          meta={<Badge tone={unread ? 'active' : 'neutral'} icon="mail">{unread ? unread + ' unread' : 'All read'}</Badge>} />}>
          <Columns ratio="sidebar-start" collapseBelow="wide">
            <Panel title="Inbox" flush>
              <ActivityList label="Conversations" stacked>
                {convs.map((c) => {
                  const last = c.messages[c.messages.length - 1];
                  return (
                    <ActivityList.Item key={c.id} leading={<Avatar name={c.title.replace(/^The | family$/g, '')} size="sm" />}
                      title={c.title} meta={c.meta + ' · ' + last.text} time={last.time} dateTime={last.dateTime}
                      unread={c.unread} selected={c.id === openId} onOpen={() => open(c.id)} />
                  );
                })}
              </ActivityList>
            </Panel>
            <Stack gap="md">
              <Chat.Header title={conv.title} meta={conv.meta} avatar={<Avatar name={theirs} />}
                actions={<PresenceBar people={OFFICE} mode="viewers" max={3} />} />
              <Chat.Thread label={'Conversation with ' + conv.title}>
                {conv.messages.map((m) => (
                  <Chat.Message key={m.id} mine={!!m.mine} author={m.mine ? undefined : m.author} time={m.time} dateTime={m.dateTime}
                    avatar={m.mine ? undefined : <Avatar name={m.author} size="xs" />}>{m.text}</Chat.Message>
                ))}
                {typing ? <Chat.Typing label={theirs + ' is typing'} /> : null}
              </Chat.Thread>
              <Chat.Composer value={text} onChange={setText} onSend={send} label={'Message to ' + conv.title} placeholder="Write a message" />
              {conv.id === 'habib' && AGAPE ? (
                <Panel title="Agape sign-up · November 1" description="Kitchen and tables after the Divine Liturgy, from 10:30 AM.">
                  <Stack gap="sm">
                  <Inline wrap gap="md" justify="between">
                    <Text><Text variant="data">{signed}</Text> of <Text variant="data">{AGAPE.needed}</Text> kitchen servants signed up{added ? ', plus the Habib family on tables' : ''}.</Text>
                    {added
                      ? <Badge tone="success" icon="circle-check">Habib family added</Badge>
                      : <Button size="sm" icon="add" onClick={() => setAdded(true)}>Add the Habib family to tables</Button>}
                  </Inline>
                  {AGAPE.signed.length ? <Text variant="secondary">Kitchen: {AGAPE.signed.map((id) => (memberById(id) || {}).name).filter(Boolean).join(', ')}</Text> : null}
                  </Stack>
                </Panel>
              ) : null}
            </Stack>
          </Columns>
        </RecordPage>
      </PageContent>
    </SitePage>
  );
}
