/* St. John the Beloved test site · Readings and hymns (site/screens/readings.jsx): the readings of the day's Divine
   Liturgy in a list beside the chosen reading (the SplitWorkspace template: the list in a reading pane, the reading in the
   second pane), with a toolbar for the text size, copying and sharing (Toolbar), shortcuts to move between readings
   (useHotkey, shown with Kbd), each reading summed up in our own words (Blockquote: the site never quotes a Bible
   translation) and the recordings of hymns and sermons (MediaCard in a ContentGrid).
   Plenix parts: SplitWorkspace, Toolbar, Toolbar.Group, Toolbar.Spacer, Button, Heading, Blockquote, Text, Kbd, RowButton,
   MediaCard, ContentGrid, Stack, Inline, useHotkey, copyText, useToast, formatDuration. */
import { Blockquote, Button, ContentGrid, Heading, Inline, Kbd, MediaCard, RowButton, SplitWorkspace, Stack, Text, Toolbar, copyText,
  formatDuration, useHotkey, useToast } from 'plenix-platform';
import { CHURCH, MEDIA } from '../data.js';
const { useState } = React;

// the readings of Sunday, October 25, 2026 (an example order); every text is a short summary in the site's own words
const READINGS = [
  { id: 'pauline', title: 'The Pauline Epistle', ref: '1 Corinthians 13:1–13', summary: [
    'St. Paul writes that speaking every language, knowing every mystery and giving everything away are worth nothing without love.',
    'Love is patient and kind, does not boast, and keeps no record of wrongs. Knowledge will pass away; faith, hope and love remain, and love is the greatest of them.'] },
  { id: 'catholic', title: 'The Catholic Epistle', ref: '1 John 4:7–21', summary: [
    'St. John asks his children to love one another, because love comes from God, and God showed His love by sending His Son for us.',
    'Whoever says he loves God while he hates his brother is not telling the truth: the love of God and of our neighbor go together.'] },
  { id: 'acts', title: 'The Acts of the Apostles', ref: 'Acts 3:1–10', summary: [
    'Peter and John meet a man at the gate of the temple who has never been able to walk. They have no money to give him.',
    'Peter tells him to rise in the name of Jesus Christ; the man stands up, walks into the temple with them and praises God.'] },
  { id: 'psalm', title: 'The Psalm', ref: 'Psalm 23', summary: [
    'The psalmist calls the Lord his shepherd, who leads him to rest and to still water, and who stays with him even in the darkest valley.'] },
  { id: 'gospel', title: 'The Holy Gospel', ref: 'John 15:9–17', summary: [
    'Christ asks His disciples to remain in His love by keeping His commandments, and to love one another as He has loved them.',
    'He calls them His friends rather than servants, and sends them out to bear fruit that lasts.'] },
];
const HYMNS = MEDIA.filter((m) => m.kind === 'audio');

export function ReadingsScreen({ chrome }) {
  const toast = useToast();
  const [current, setCurrent] = useState('gospel');
  const [large, setLarge] = useState(false);
  const at = READINGS.findIndex((r) => r.id === current), r = READINGS[at];
  const move = (step) => setCurrent(READINGS[(at + step + READINGS.length) % READINGS.length].id);
  useHotkey('J', () => move(1), { label: 'Next reading', group: 'Readings' });
  useHotkey('K', () => move(-1), { label: 'Previous reading', group: 'Readings' });
  const text = r.title + ' (' + r.ref + '), in brief: ' + r.summary.join(' ');
  const copy = () => copyText(text).then(() => toast.show('The summary is copied', { tone: 'success' }), () => toast.show('The summary could not be copied', { tone: 'warning' }));
  const share = () => {
    const link = location.href;
    if (navigator.share) navigator.share({ title: r.title + ' · ' + CHURCH.short, text, url: link }).catch(() => {});
    else copyText(link).then(() => toast.show('The link to this page is copied'));
  };

  const list = (
    <Stack gap="sm">
      <Text variant="secondary">Sunday, October 25, 2026 · the Divine Liturgy</Text>
      <Stack as="ol" gap="none" aria-label="Today’s readings">
        {READINGS.map((x) => (
          <li key={x.id}>
            <RowButton selected={x.id === current} onClick={() => setCurrent(x.id)}>
              <Stack gap="none" inset="xs"><Text variant="strong">{x.title}</Text><Text variant="data">{x.ref}</Text></Stack>
            </RowButton>
          </li>
        ))}
      </Stack>
      <Text variant="secondary">Press <Kbd>J</Kbd> for the next reading and <Kbd>K</Kbd> for the one before.</Text>
    </Stack>
  );
  const toolbar = (
    <Toolbar label="Reading tools">
      <Toolbar.Group>
        <Button size="sm" icon="ed-zoom-out" iconOnly label="Smaller text" pressed={!large} onClick={() => setLarge(false)} />
        <Button size="sm" icon="ed-zoom-in" iconOnly label="Larger text" pressed={large} onClick={() => setLarge(true)} />
      </Toolbar.Group>
      <Toolbar.Group>
        <Button size="sm" icon="chevron-up" iconOnly label="Previous reading" shortcut="K" onClick={() => move(-1)} />
        <Button size="sm" icon="chevron-down" iconOnly label="Next reading" shortcut="J" onClick={() => move(1)} />
      </Toolbar.Group>
      <Toolbar.Spacer />
      <Toolbar.Group>
        <Button size="sm" icon="ed-copy" onClick={copy}>Copy</Button>
        <Button size="sm" icon="share" onClick={share}>Share</Button>
      </Toolbar.Group>
    </Toolbar>
  );

  return (
    <SplitWorkspace {...chrome} paneTitle="Readings" title={r.title} pane={list} actions={toolbar} defaultSize={360}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Heading level={1}>{r.title}</Heading>
          <Text variant="data">{r.ref}</Text>
        </Stack>
        <Blockquote citation={'In brief: ' + r.ref + '. A summary in our own words; read the full text in your Bible.'}>
          {r.summary.map((p, i) => <Text key={i} as="p" variant={large ? 'lead' : 'body'}>{p}</Text>)}
        </Blockquote>
        <Stack gap="sm">
          <Heading level={2}>Hymns and sermons to listen to</Heading>
          <ContentGrid size="md" label="Recordings">
            {HYMNS.map((h) => <MediaCard key={h.id} icon="headphones" aspect="16/9" title={h.title} href="#/media"
              meta={formatDuration(h.duration, { display: 'clock' }) + ' · ' + h.speaker} />)}
          </ContentGrid>
        </Stack>
      </Stack>
    </SplitWorkspace>
  );
}
