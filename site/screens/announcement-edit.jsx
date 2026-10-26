/* St. John the Beloved test site · Edit announcement (site/screens/announcement-edit.jsx): the church office writes
   one parish announcement. A SinglePaneWorkspace: the title and the body in a RichTextEditor (mentions of servants), the
   preview as members see it (RichText of the person's own formatted text: plx-user-content), saving as it goes
   (useAutosave with Autosave, SaveStatus and DraftState), Save as a copy (SaveAs in a Dialog), Publish, the priest's
   review (ReviewFlow), the comments (CommentThread, a pinned Comment, a MentionInput note to a servant), who else is
   editing (PresenceBar), the announcement's ID (Code, CopyButton) and link (useClipboard), the embed snippet for the
   parish website (CodeBlock), and its words for screen readers (VisuallyHidden, LiveRegion). Every name is made up. */
import { Autosave, Badge, Button, Code, CodeBlock, Columns, Comment, CommentThread, CopyButton, Dialog, DraftState, Field, Inline, Input, Link,
  LiveRegion, MentionInput, Panel, PresenceBar, Publish, ReviewFlow, RichText, RichTextEditor, SaveAs, SaveStatus, SinglePaneWorkspace, Stack, Text,
  VisuallyHidden, useAutosave, useClipboard } from 'plenix-platform';
import { ANNOUNCEMENTS, CHURCH, CLERGY, MEMBERS } from '../data.js';
const { useState, useMemo } = React;

// the announcement's public ID: a1 is ANN-2026-104, a2 ANN-2026-103, …
const codeOf = (id) => 'ANN-2026-' + (104 - Math.max(0, ANNOUNCEMENTS.findIndex((a) => a.id === id)));
const SERVANTS = MEMBERS.filter((m) => m.servant).slice(0, 40).map((m) => ({ value: m.id, label: m.name, description: m.email }));
const EDITORS = [
  { id: 'me', name: 'Church office', role: 'editor' },
  { id: 'c1', name: CLERGY[0].name, role: 'editor', cursor: 'Reading the second paragraph' },
  { id: 's1', name: 'Marina Girgis', role: 'viewer' },
];
const LOCATIONS = [
  { id: 'announcements', label: 'Announcements', icon: 'folder', children: [
    { id: 'bulletin', label: 'Weekly bulletin', icon: 'folder' },
    { id: 'website', label: 'Parish website', icon: 'folder' },
  ] },
  { id: 'templates', label: 'Templates', icon: 'folder' },
];

// the starting body: the person's own formatting (a centered heading, a colored lead-in) is kept as user content
function bodyOf(a) {
  return "<h2 style='text-align: center'>" + a.title + '</h2>'
    + '<p>' + a.body + '</p>'
    + "<p><span style='color: maroon'><strong>Please note:</strong></span> the Divine Liturgy keeps its Sunday time, 8:00 AM. "
    + 'Questions go to the church office, ' + CHURCH.phone + '.</p>'
    + '<ul><li>Fasting menu: in the documents</li><li>Agape meals during the fast are vegan</li></ul>';
}

export function AnnouncementEditScreen({ screen, chrome }) {
  const a = ANNOUNCEMENTS.find((x) => x.id === screen.id) || ANNOUNCEMENTS[0];
  const code = codeOf(a.id);
  const link = 'https://stjohn-beloved.example/announcements/' + code;
  const [title, setTitle] = useState(a.title);
  const [html, setHtml] = useState(() => bodyOf(a));
  const [status, setStatus] = useState(a.status === 'Published' ? 'published' : a.status === 'Scheduled' ? 'scheduled' : 'draft');
  const [when, setWhen] = useState(a.status === 'Scheduled' ? '2026-12-05T08:00' : '2026-10-24T09:00');
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [copies, setCopies] = useState([]);
  const [note, setNote] = useState('');
  const [mentioned, setMentioned] = useState([]);
  const [message, setMessage] = useState('');
  const [review, setReview] = useState({ status: 'in-review', history: [] });
  const [comments, setComments] = useState([
    { id: 'k1', author: { name: CLERGY[0].name }, body: 'Please add the vegan Agape note for the fasting Sundays.', time: '2026-10-24T08:40:00Z' },
    { id: 'k2', author: { name: 'Church office' }, body: 'Added it as the second item of the list.', time: '2026-10-24T08:52:00Z', own: true },
  ]);
  const clip = useClipboard();

  const value = useMemo(() => ({ title, html }), [title, html]);
  const save = useAutosave(value, () => new Promise((resolve) => setTimeout(resolve, 400)));
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const now = () => new Date().toISOString().slice(0, 16);

  const sendNote = () => {
    if (!note.trim()) { setMessage('Write a note first.'); return; }
    setComments((list) => list.concat({ id: 'k' + (list.length + 1), author: { name: 'Church office' }, body: note.trim(), time: new Date().toISOString(), own: true }));
    setMessage('Note added to the comments' + (mentioned.length ? ' for ' + mentioned.join(', ') : '') + '.');
    setNote(''); setMentioned([]);
  };

  return (
    <SinglePaneWorkspace {...chrome} title="Edit announcement"
      description={'For ' + a.audience.toLowerCase() + ' · written by ' + a.author}
      actions={<Inline gap="sm">
        <Button icon="save-doc" onClick={() => setSaveAsOpen(true)}>Save as a copy</Button>
        <Button icon="arrow-left" variant="ghost" onClick={() => screen.navigate('/announcements')}>All announcements</Button>
      </Inline>}
      toolbar={<Inline wrap gap="md" justify="between">
        <Inline wrap gap="sm">
          <DraftState version="3" saveState={save.state} onResume={() => Promise.resolve()}
            onDiscard={() => new Promise((resolve) => { setTitle(a.title); setHtml(bodyOf(a)); setEditorKey((k) => k + 1); resolve(); })} />
          <Autosave state={save.state} onRetry={save.retry} />
        </Inline>
        <PresenceBar people={EDITORS} mode="editors" />
      </Inline>}>
      <Columns ratio="sidebar-end" collapseBelow="wide">
        <Stack gap="lg">
          <Panel title="Announcement">
            <Stack gap="md">
              <Field label="Title" required error={title.trim() ? undefined : 'Give the announcement a title.'}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Stack gap="xs">
                <Text variant="label">Body</Text>
                <RichTextEditor key={editorKey} label="Announcement body" toolbar="full" defaultValue={html} onChange={setHtml}
                  placeholder="Write the announcement; type @ to mention a servant"
                  mentions={{ search: (q) => SERVANTS.filter((p) => p.label.toLowerCase().startsWith(String(q).toLowerCase())).slice(0, 8) }} />
                <Text variant="secondary"><Text variant="data">{words}</Text> words<VisuallyHidden> in the announcement body</VisuallyHidden></Text>
              </Stack>
            </Stack>
          </Panel>
          <Panel title="Preview" description="How families see it on the parish website and in the email.">
            <Stack gap="sm">
              <RichText variant="article" html={html} />
            </Stack>
          </Panel>
          <Panel title="Comments">
            <Stack gap="md">
              <Comment author={{ name: 'Fr. Antony Wahba' }} body="Pinned: announcements during the fast go out on Thursdays, so they are in the Sunday bulletin." time="2026-10-20T10:00:00Z" resolved />
              <CommentThread title="Discussion" comments={comments}
                onReply={(text) => setComments((list) => list.concat({ id: 'k' + (list.length + 1), author: { name: 'Church office' }, body: text, time: new Date().toISOString(), own: true }))} />
              <Stack gap="sm">
                <MentionInput label="Note to a servant (type @ to mention one)" value={note} onChange={setNote} options={SERVANTS}
                  onMention={(option) => setMentioned((list) => list.concat(option.label))} />
                <Inline><Button icon="message" onClick={sendNote}>Add the note</Button></Inline>
                <LiveRegion kind="status" visible>{message}</LiveRegion>
              </Stack>
            </Stack>
          </Panel>
        </Stack>
        <Stack gap="lg">
          <Panel title="Publishing">
            <Stack gap="md">
              <Publish name={title || 'this announcement'} status={status} audience={a.audience === 'Servants' ? 'the parish servants' : 'every family of the parish'}
                publishedAt={status === 'published' ? when : undefined} scheduledFor={status === 'scheduled' ? when : undefined} by={a.author}
                onPublish={() => { setStatus('published'); setWhen(now()); }} onSchedule={(at) => { setStatus('scheduled'); setWhen(at); }}
                onCancelSchedule={() => setStatus('draft')} onUnpublish={() => setStatus('draft')} />
              <Inline gap="sm"><Text variant="secondary">Last saved</Text><SaveStatus state={save.state} /></Inline>
            </Stack>
          </Panel>
          <Panel title="Review">
            <ReviewFlow title={title || 'Announcement'} detail="Sent to the parish priest for approval" status={review.status} history={review.history}
              reviewers={[{ id: 'c1', name: CLERGY[0].name, decision: review.history[0] ? review.history[0].decision : undefined }]}
              onDecision={(decision, comment) => setReview((r) => ({ status: decision, history: [{ id: 'r' + (r.history.length + 1), name: CLERGY[0].name, decision, comment, time: 'Just now', dateTime: now() }].concat(r.history) }))} />
          </Panel>
          <Panel title="Sharing">
            <Stack gap="md">
              <Inline gap="sm" wrap>
                <Text>Announcement ID <Code>{code}</Code></Text>
                <CopyButton value={code} label="Copy announcement ID" size="xs" />
              </Inline>
              <Inline gap="sm" wrap>
                <Button size="sm" icon={clip.copied ? 'check' : 'link'} onClick={() => clip.copy(link)}>{clip.copied ? 'Copied' : 'Copy the announcement link'}</Button>
                <Link href={link} external>Open on the website</Link>
              </Inline>
              <CodeBlock title="Embed on the parish website" language="html">{'<div class="stjohn-announcement" data-id="' + code + '"></div>\n<script src="https://stjohn-beloved.example/embed.js" async></script>'}</CodeBlock>
              <Link href="#/announcements" back>Announcements</Link>
            </Stack>
          </Panel>
          {copies.length ? (
            <Panel title="Copies">
              <Stack gap="xs">{copies.map((c) => <Inline key={c.name} gap="sm"><Text>{c.name}</Text><Badge icon="check" tone="success">Saved</Badge></Inline>)}</Stack>
            </Panel>
          ) : null}
        </Stack>
      </Columns>
      <Dialog open={saveAsOpen} onClose={() => setSaveAsOpen(false)} title="Save a copy" description="The copy starts as a draft; this announcement stays as it is.">
        <SaveAs locations={LOCATIONS} initialName={title + ' (copy)'} initialLocation="announcements"
          formats={[{ value: 'announcement', label: 'Announcement' }, { value: 'template', label: 'Template' }]}
          onSave={(copy) => new Promise((resolve) => { setCopies((list) => list.concat(copy)); setSaveAsOpen(false); resolve(); })}
          onCancel={() => setSaveAsOpen(false)} />
      </Dialog>
    </SinglePaneWorkspace>
  );
}
