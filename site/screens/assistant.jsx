/* St. John the Beloved test site · Parish assistant (site/screens/assistant.jsx): an AI helper for the church office
   that drafts announcements, finds members and summarizes the week. Every answer is canned (made up for the test site)
   and labeled as AI-generated. It shows AIChat (the conversation, with PromptSuggestions and SuggestedAction beside it),
   the AssistantPanel in the page's side panel, AIButton (a menu of quick requests), AIDisclaimer, AILabel; drafting an
   announcement with PromptInput, StreamingText, GeneratedContent (versions), RefineMenu, SuggestedEdit, Citation,
   ConfidenceIndicator and AIExplanation; finding members with AISearch and Recommendation; and PromptHistory. */
import { AIButton, AIChat, AIDisclaimer, AIExplanation, AILabel, AISearch, AssistantPanel, Button, Citation, Columns, ConfidenceIndicator,
  GeneratedContent, Inline, PageContent, Panel, PromptHistory, PromptInput, PromptSuggestions, Recommendation, RecordPage, RefineMenu, Stack,
  StreamingText, SuggestedAction, SuggestedEdit, Tabs, Text } from 'plenix-platform';
import { DOCUMENTS, MEMBERS, SERVING_SLOTS } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useEffect, useRef } = React;

// the site documents the answers cite (never scripture)
const SRC = {
  bulletin: { id: 'd1', title: DOCUMENTS[0].name, href: '#/document/d1', excerpt: 'This week’s services, meetings and serving needs.', author: 'Church office' },
  menu: { id: 'd2', title: DOCUMENTS[1].name, href: '#/document/d2', excerpt: 'Vegan Agape meals for every Sunday of the fast.', author: 'Agape Kitchen' },
  guide: { id: 'd4', title: DOCUMENTS[3].name, href: '#/document/d4', excerpt: 'How servants sign up and swap a serving slot.', author: 'Fr. Daniel Boulos' },
  calendar: { id: 'cal', title: 'Parish calendar', href: '#/calendar', excerpt: 'Services and events from October 25 to October 31.' },
};
const SOUND = SERVING_SLOTS.find((s) => s.ministry === 'media');
const FREE = MEMBERS.filter((m) => m.servant && m.status === 'active').slice(0, 4).map((m) => m.name);

// the canned answers (made up), chosen by the words of the request
function answerFor(text) {
  const q = String(text).toLowerCase();
  if (/summar|week/.test(q)) return { sources: [SRC.bulletin, SRC.calendar], text: 'This week: the Divine Liturgy and the Agape meal on Sunday (118 families answered), Servants’ Preparation on Tuesday, '
    + 'Bible Study on the Gospel of St. John on Wednesday, the Youth Meeting on Friday, and the Food Pantry and Vespers on Saturday. '
    + 'Two things need the office: the Food Pantry is three servants short for Saturday’s sorting, and the sound desk has no one for November 1.' };
  if (/draft|announce|fast/.test(q)) return { sources: [SRC.menu], text: 'Draft: The Nativity Fast begins on Wednesday, November 25, and continues until the Feast of the Nativity on January 7. '
    + 'The Agape meals during the fast are vegan; the fasting menu is in the parish documents. The Divine Liturgy keeps its Sunday time, 8:00 AM.' };
  if (/find|member|servant|sound/.test(q)) return { sources: [SRC.guide], text: 'Servants who are active and free on November 1: ' + FREE.join(', ')
    + '. The sound desk slot (' + (SOUND ? SOUND.time : '7:30') + ') still needs one servant; the Media and Sound lead can train a new one.' };
  return { sources: [], text: 'I can draft announcements, find members and families, and summarize the week for the church office. Try one of the suggestions.' };
}
const SHORTER = 'The Nativity Fast runs from November 25 to January 7. Agape meals are vegan; the menu is in the documents.';
const FORMAL = 'The faithful are reminded that the Holy Nativity Fast begins on Wednesday, November 25, and concludes with the Feast of the Nativity on January 7.';

// a made-up stream: the words of a canned answer arrive a few at a time
function useStream() {
  const timer = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => clearInterval(timer.current), []);
  const stop = () => { clearInterval(timer.current); timer.current = null; setBusy(false); };
  const run = (full, step, done) => {
    stop(); setBusy(true);
    const words = full.split(' ');
    let i = 0;
    timer.current = setInterval(() => {
      i = Math.min(words.length, i + 3);
      step(words.slice(0, i).join(' '));
      if (i >= words.length) { clearInterval(timer.current); timer.current = null; setBusy(false); if (done) done(); }
    }, 80);
  };
  return { run, stop, busy };
}

function useConversation(initial) {
  const [messages, setMessages] = useState(initial);
  const stream = useStream();
  const set = (id, patch) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const send = async (text) => {
    const answer = answerFor(text);
    const id = 'a' + Date.now();
    setMessages((list) => list.concat({ id: id + '-q', role: 'user', text }, { id, role: 'assistant', text: '', state: 'streaming', sources: answer.sources }));
    stream.run(answer.text, (part) => set(id, { text: part }), () => set(id, { state: 'done',
      onFeedback: () => Promise.resolve(),
      onRefine: ({ action }) => { set(id, { text: action === 'shorter' ? answer.text.split('. ')[0] + '.' : answer.text }); return Promise.resolve(); } }));
  };
  const stop = () => { stream.stop(); setMessages((list) => list.map((m) => (m.state === 'streaming' ? { ...m, state: 'stopped' } : m))); };
  return { messages, send, stop, streaming: stream.busy };
}

const SUGGESTIONS = [
  { id: 's1', label: 'Summarize this week', prompt: 'Summarize this week for the parish council', description: 'Services, meetings and serving needs' },
  { id: 's2', label: 'Draft the Nativity Fast announcement', prompt: 'Draft the Nativity Fast announcement for the bulletin', description: 'From the fasting menu' },
  { id: 's3', label: 'Find a servant for the sound desk', prompt: 'Find a servant for the sound desk on November 1', description: 'Active servants who are free' },
];
const HISTORY = [
  { id: 'p1', prompt: 'Summarize last week for Fr. Daniel', createdAt: '2026-10-18T19:30:00' },
  { id: 'p2', prompt: 'Draft a thank-you note for the Feast of the Cross servants', createdAt: '2026-09-28T10:05:00' },
  { id: 'p3', prompt: 'Find families in the North district without a Sunday School child', createdAt: '2026-09-20T15:40:00' },
  { id: 'p4', prompt: 'Draft the Nayrouz announcement', createdAt: '2026-09-02T09:12:00' },
];
const RECOMMENDED = [
  { id: 'r1', title: 'Ask the Media and Sound servants about November 1', description: 'The sound desk has no servant yet.', reason: 'The slot starts in 7 days and nobody has signed up.', href: '#/servants' },
  { id: 'r2', title: 'Put the Food Pantry need in the bulletin', description: 'Three servants short for Saturday’s sorting.', reason: 'The bulletin goes to print on Thursday.', href: '#/announcements' },
  { id: 'r3', title: 'Welcome the visitors from last Sunday', description: 'Four visitors filled in the welcome card.', reason: 'Visitors who hear from the parish within a week come back more often.', href: '#/members' },
  { id: 'r4', title: 'Send the Kiahk hymns to the choir', description: 'The Hymns of Kiahk are in the documents.', reason: 'Kiahk begins on December 10.', href: '#/document/d7' },
];
const versionOf = (n, text, label) => ({ id: 'v' + n, label: label || 'Version ' + n, text, content: <Text as="p">{text}</Text> });

export function AssistantScreen({ screen, chrome }) {
  const [tab, setTab] = useState('chat');
  const [panelOpen, setPanelOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const chat = useConversation([
    { id: 'w1', role: 'assistant', text: 'Good morning. I can draft announcements, find members and summarize the week. Every answer here is made up for the test site.', state: 'done' },
  ]);
  const side = useConversation([]);

  // drafting an announcement
  const [draftPrompt, setDraftPrompt] = useState('A short announcement for the start of the Nativity Fast');
  const [model, setModel] = useState('careful');
  const [live, setLive] = useState(null);
  const [versions, setVersions] = useState([versionOf(1, answerFor('draft').text.replace(/^Draft: /, ''))]);
  const [versionId, setVersionId] = useState('v1');
  const draftStream = useStream();
  const count = useRef(1);
  const addVersion = (text, label) => { const n = ++count.current; setVersions((list) => list.concat(versionOf(n, text, label))); setVersionId('v' + n); };
  const current = versions.find((v) => v.id === versionId) || versions[versions.length - 1];
  const sendDraft = async () => {
    const full = answerFor('draft').text.replace(/^Draft: /, '');
    setLive({ text: '', state: 'streaming' });
    draftStream.run(full, (part) => setLive({ text: part, state: 'streaming' }), () => { setLive(null); addVersion(full); });
  };

  const [edits, setEdits] = useState([
    { id: 'e1', before: 'The fast runs until the Feast of the Nativity', after: 'The fast continues until the Feast of the Nativity', status: 'pending' },
    { id: 'e2', before: 'A fasting menu is posted in the documents.', after: 'The fasting menu for the vegan Agape meals is in the parish documents.', status: 'pending' },
  ]);
  const ask = (text) => { setTab('chat'); chat.send(text); };

  const panel = (
    <AssistantPanel open={panelOpen} onOpenChange={setPanelOpen} title="Ask about this page"
      context={<Text variant="secondary">The assistant sees this week’s calendar and the Agape sign-up sheet (made-up data).</Text>}
      messages={side.messages} onSend={side.send} streaming={side.streaming} onStop={side.stop} />
  );

  return (
    <SitePage chrome={chrome} page="workspace" panel={panel}>
      <PageContent>
        <RecordPage header={<RecordPage.Header title="Parish assistant"
          description="An AI helper for the church office: it drafts announcements, finds members and summarizes the week."
          meta={<AILabel variant="explanation" explanation="Every answer on this page is canned text written for the test site, not a real model." />}
          actions={<Inline gap="sm">
            <AIButton label="Ask the assistant" mode="menu" actions={SUGGESTIONS.map((s) => ({ id: s.id, label: s.label }))}
              onAction={(id) => { const s = SUGGESTIONS.find((x) => x.id === id); if (s) ask(s.prompt); return Promise.resolve(); }} />
            {panelOpen ? null : <Button icon="panel-right-open" onClick={() => setPanelOpen(true)}>Show the side panel</Button>}
          </Inline>} />}>
          <Stack gap="lg">
            <AIDisclaimer variant="inline" href="#/settings/general">Check names, dates and times before anything goes to the families.</AIDisclaimer>
            <Tabs variant="folder" label="Assistant" value={tab} onChange={setTab} items={[
              { value: 'chat', label: 'Conversation', icon: 'message', content: (
                <Columns ratio="sidebar-end" collapseBelow="wide">
                  <AIChat variant="page" title="Parish assistant" messages={chat.messages} onSend={chat.send} streaming={chat.streaming} onStop={chat.stop}
                    prompt={prompt} onPromptChange={setPrompt} suggestions={SUGGESTIONS.map((s) => ({ id: s.id, label: s.label, prompt: s.prompt }))} />
                  <Stack gap="md">
                    <Panel title="Try asking">
                      <PromptSuggestions variant="cards" options={SUGGESTIONS} onSelect={(o) => setPrompt(o.prompt)} />
                    </Panel>
                    <Panel title="Suggested for today">
                      <Stack gap="sm">
                        <SuggestedAction variant="card" description="Fills in the services, meetings and serving needs." onAction={() => { ask('Summarize this week'); return Promise.resolve(); }}>Summarize this week</SuggestedAction>
                        <SuggestedAction onAction={() => { ask('Find a servant for the sound desk'); return Promise.resolve(); }}>Find a sound desk servant</SuggestedAction>
                      </Stack>
                    </Panel>
                  </Stack>
                </Columns>
              ) },
              { value: 'draft', label: 'Draft an announcement', icon: 'edit', content: (
                <Columns ratio="sidebar-end" collapseBelow="wide">
                  <Stack gap="md">
                    <PromptInput multiline value={draftPrompt} onChange={setDraftPrompt} onSend={sendDraft} streaming={draftStream.busy}
                      onStop={() => { draftStream.stop(); setLive((l) => (l ? { ...l, state: 'stopped' } : l)); }}
                      models={[{ id: 'quick', label: 'Quick draft' }, { id: 'careful', label: 'Careful draft' }]} model={model} onModelChange={setModel}
                      strings={{ label: 'What should the announcement say?', placeholder: 'Describe the announcement' }} />
                    {live ? <StreamingText text={live.text} state={live.state} /> : (
                      <GeneratedContent versions={versions} versionId={versionId} onVersionChange={setVersionId}
                        onRegenerate={() => { addVersion(FORMAL, 'Version ' + (count.current + 1) + ' (regenerated)'); return Promise.resolve(); }}
                        onFeedback={() => Promise.resolve()} />
                    )}
                    <Inline wrap gap="sm">
                      <RefineMenu onRefine={({ action, tone, prompt: p }) => { addVersion(action === 'shorter' ? SHORTER : action === 'tone' && tone === 'formal' ? FORMAL : (p ? 'Revised (' + p + '): ' : '') + current.text); return Promise.resolve(); }} />
                      <Button icon="open" onClick={() => screen.navigate('/announcement/a1')}>Open the announcement</Button>
                    </Inline>
                    <Text as="p" variant="secondary">Drafted from the fasting menu <Citation source={SRC.menu} index={1} /> and the weekly bulletin <Citation source={SRC.bulletin} index={2} />.</Text>
                  </Stack>
                  <Stack gap="md">
                    <Panel title="Why this draft">
                      <Stack gap="sm">
                        <Inline gap="sm" wrap><AILabel variant="badge" /><ConfidenceIndicator level="medium" /></Inline>
                        <AIExplanation summary="It follows last year’s Nativity Fast announcement and adds this year’s dates."
                          factors={[{ id: 'f1', label: 'Dates', detail: 'From the parish calendar: November 25 to January 7.' }, { id: 'f2', label: 'Agape', detail: 'From the fasting menu in the documents.' }]}
                          confidence={{ level: 'medium' }} />
                        <Citation variant="card" source={SRC.menu} />
                      </Stack>
                    </Panel>
                    <Panel title="Suggested edits to the published announcement">
                      <SuggestedEdit variant="all" edits={edits}
                        onDecision={({ ids, decision }) => { setEdits((list) => list.map((e) => (ids.indexOf(e.id) >= 0 ? { ...e, status: decision } : e))); return Promise.resolve(); }} />
                    </Panel>
                  </Stack>
                </Columns>
              ) },
              { value: 'find', label: 'Find members', icon: 'search', content: (
                <Stack gap="lg">
                  <AISearch defaultQuery="servant"
                    onSearch={({ query }) => {
                      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
                      const hits = MEMBERS.filter((m) => words.some((w) => m.name.toLowerCase().includes(w) || (w.startsWith('servant') && m.servant) || m.district.toLowerCase() === w));
                      return Promise.resolve({
                        answer: <Text as="p">Made-up summary: {hits.length} members match “{query}”; {hits.filter((m) => m.servant).length} of them serve in a ministry.</Text>,
                        sources: [{ id: 'members', title: 'Member directory', href: '#/members', excerpt: 'Every member, family and ministry of the parish.' }],
                        results: hits.slice(0, 8).map((m) => ({ id: m.id, title: m.name, description: m.role + ' · ' + m.district + ' district', href: '#/member/' + m.id })),
                      });
                    }} />
                  <Recommendation strings={{ label: 'Recommended next steps' }} items={RECOMMENDED} variant="reason" perView={2} />
                </Stack>
              ) },
              { value: 'history', label: 'History', icon: 'clock', content: (
                <PromptHistory items={HISTORY} onSelect={(item) => { setPrompt(item.prompt); setTab('chat'); return Promise.resolve(); }} />
              ) },
            ]} />
          </Stack>
        </RecordPage>
      </PageContent>
    </SitePage>
  );
}
