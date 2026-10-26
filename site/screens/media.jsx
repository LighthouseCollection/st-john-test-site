/* St. John the Beloved test site · Sermons and media (site/screens/media.jsx): the parish's recorded sermons and hymns,
   the photos of its feasts and events, and the downloads the Media and Sound servants prepare.
   Plenix parts: EntityHeader; MediaPlayer (audio, with a transcript) for the chosen sermon; a list of recordings with
   Thumbnail and Time, filtered by a SearchField, with an Illustration and EmptyState when nothing matches; a Carousel of
   event photos, each a Figure with an Image and a caption; a Preview that opens the MediaViewer; AssetGallery (masonry,
   with its lightbox); RenditionList of the Nayrouz photo's sizes; RelatedAssets that open the photo's page.
   No audio file is in the repository: the player plays a short silent recording made in the page (a WAV data address),
   and the pictures are the drawings in assets/pictures/ (from the Plenix Asset Manager's samples) standing in for photos. */
import {
  AssetGallery, Button, Carousel, EmptyState, EntityHeader, Figure, Illustration, Image, Inline, MediaPlayer, MediaViewer,
  PageContent, Preview, RelatedAssets, RenditionList, SearchField, SectionHeading, Stack, Text, Thumbnail, Time, Columns, Icon,
} from 'plenix-platform';
import { MEDIA } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useMemo } = React;

// a short silent recording (8 kHz, 8-bit mono WAV) as a data address, standing in for a sermon's audio
function silentWav(seconds) {
  const rate = 8000, n = rate * seconds, bytes = new Uint8Array(44 + n);
  const text = (at, s) => { for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i); };
  const u32 = (at, v) => { bytes[at] = v & 255; bytes[at + 1] = (v >> 8) & 255; bytes[at + 2] = (v >> 16) & 255; bytes[at + 3] = (v >> 24) & 255; };
  const u16 = (at, v) => { bytes[at] = v & 255; bytes[at + 1] = (v >> 8) & 255; };
  text(0, 'RIFF'); u32(4, 36 + n); text(8, 'WAVE'); text(12, 'fmt '); u32(16, 16); u16(20, 1); u16(22, 1); u32(24, rate); u32(28, rate); u16(32, 1); u16(34, 8);
  text(36, 'data'); u32(40, n); bytes.fill(128, 44);
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

const ART = (n) => 'assets/pictures/picture-' + n + '.svg';
// the event photos (made up; drawings stand in for the pictures)
const PHOTOS = [
  { id: 'p1', src: ART(17), title: 'Nayrouz celebration', caption: 'The Nayrouz table after the Divine Liturgy, with red dates for the new Coptic year.', credit: 'Photo: Media and Sound', date: '2026-09-11', ratio: '4-3' },
  { id: 'p2', src: ART(5), title: 'Feast of the Cross procession', caption: 'The deacons lead the procession around the church on the Feast of the Cross.', credit: 'Photo: Media and Sound', date: '2026-09-27', ratio: '4-3' },
  { id: 'p3', src: ART(22), title: 'Sunday School opening day', caption: 'The Sunday School classes gather in the lower hall for the first lesson of the year.', credit: 'Photo: Marina Girgis', date: '2026-09-13', ratio: '4-3' },
  { id: 'p4', src: ART(18), title: 'Agape lunch', caption: 'The Agape Kitchen serves lunch in the fellowship hall after the Liturgy.', credit: 'Photo: Nevine Mikhail', date: '2026-10-04', ratio: '4-3' },
  { id: 'p5', src: ART(21), title: 'Youth meeting retreat', caption: 'The Youth Meeting at its fall retreat, praying the Agpeya together.', credit: 'Photo: Mina Habib', date: '2026-10-10', ratio: '4-3' },
];
const alt = (p) => 'A drawing standing in for the photo: ' + p.title;
const GALLERY = PHOTOS.concat([
  { id: 'p6', src: ART(23), title: 'Kiahk hymns practice', date: '2026-10-15' }, { id: 'p7', src: ART(24), title: 'Food Pantry Saturday', date: '2026-10-17' },
  { id: 'p8', src: ART(27), title: 'Deacons’ School', date: '2026-10-18' },
]).map((p) => ({ id: p.id, src: p.src, alt: alt(p), title: p.title, meta: p.date }));

// what the sermon says, a few lines (made up)
const TRANSCRIPT = [
  { start: 0, text: 'In the name of the Father, and of the Son, and of the Holy Spirit, one God. Amen.' },
  { start: 0.5, text: 'Saint John tells us: little children, let us love one another.' },
  { start: 1, text: 'Love is not a word only; it is a service we give.' },
  { start: 1.5, text: 'Let us carry this love to our families this week.' },
];

export function MediaScreen({ screen, chrome }) {
  const src = useMemo(() => silentWav(2), []);
  const recordings = MEDIA.filter((m) => m.kind !== 'image');
  const [playing, setPlaying] = useState(recordings[0].id);
  const [q, setQ] = useState('');
  const [viewer, setViewer] = useState(null);
  const sermon = recordings.find((m) => m.id === playing) || recordings[0];
  const found = recordings.filter((m) => (m.title + ' ' + m.speaker).toLowerCase().includes(q.trim().toLowerCase()));
  const minutes = (s) => Math.round(s / 60) + ' min';
  const nayrouz = MEDIA.find((m) => m.id === 'v5');

  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <Stack gap="lg">
          <EntityHeader media={{ icon: 'headphones', hue: 'purple' }} title="Sermons and media" subtitle="Recorded sermons, hymns and the photos of the parish’s feasts"
            facts={[{ label: 'Recordings', value: recordings.length, data: true }, { label: 'Photos', value: GALLERY.length, data: true }, { label: 'Latest', value: recordings[0].date, data: true }]} />

          <Columns ratio="sidebar-end" collapseBelow="wide">
            <Stack gap="sm">
              <SectionHeading level={2}>{sermon.title}</SectionHeading>
              <Text variant="secondary">{sermon.speaker} · <Time value={sermon.date + 'T12:00'} format="date" dateStyle="long" /> · {minutes(sermon.duration)}</Text>
              <MediaPlayer key={sermon.id} kind="audio" src={src} label={sermon.title} transcript={TRANSCRIPT} showTranscript rates={[0.75, 1, 1.25, 1.5]} />
              <Text variant="caption">Test recording: a short silent clip stands in for the sermon’s audio.</Text>
            </Stack>
            <Stack gap="sm">
              <SectionHeading level={2}>Recordings</SectionHeading>
              <SearchField label="Search the recordings" placeholder="Search by title or speaker" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
              {found.length ? found.map((m) => (
                <Inline key={m.id} justify="between">
                  <Inline>
                    <Thumbnail icon={m.kind === 'video' ? 'settings-camera' : 'audio'} />
                    <Stack gap="none">
                      <Text variant="strong">{m.title}</Text>
                      <Text variant="secondary">{m.speaker} · <Time value={m.date + 'T12:00'} format="label" now={new Date('2026-10-25T09:00')} /></Text>
                    </Stack>
                  </Inline>
                  <Button size="sm" icon="headphones" aria-pressed={m.id === sermon.id} onClick={() => setPlaying(m.id)}>{m.id === sermon.id ? 'Playing' : 'Play'}</Button>
                </Inline>
              )) : (
                <Stack align="center">
                  <Illustration name="no-results" size="sm" />
                  <EmptyState title={'No recordings match “' + q + '”'} action={<Button onClick={() => setQ('')}>Clear the search</Button>}>Try a speaker’s name or a word from the title.</EmptyState>
                </Stack>
              )}
            </Stack>
          </Columns>

          <Stack gap="sm">
            <SectionHeading level={2}>Feasts and events</SectionHeading>
            <Carousel label="Photos of the parish’s feasts and events" perView={3}>
              {PHOTOS.map((p) => (
                <Figure key={p.id} caption={p.caption} credit={p.credit}>
                  <Image src={p.src} alt={alt(p)} ratio="4-3" />
                </Figure>
              ))}
            </Carousel>
          </Stack>

          <Columns collapseBelow="wide">
            <Stack gap="sm">
              <SectionHeading level={2}>Feast of the Cross procession</SectionHeading>
              <Preview as="button" ratio="16-9" aria-label="Open the photos of the procession" onClick={() => setViewer(1)} bottomEnd={<Icon name="expand" />}>
                <Image src={PHOTOS[1].src} alt="" ratio="16-9" />
              </Preview>
              <Text variant="secondary">Open the photos one at a time, full screen.</Text>
            </Stack>
            <Stack gap="sm">
              <SectionHeading level={2}>Sizes of the Nayrouz photo</SectionHeading>
              <RenditionList variant="table" items={[
                { id: 'r1', name: 'Original', format: 'SVG', size: 2304551, href: PHOTOS[0].src, fileName: 'nayrouz-original.svg' },
                { id: 'r2', name: 'Bulletin (print)', format: 'SVG', size: 812000, href: PHOTOS[0].src, fileName: 'nayrouz-bulletin.svg' },
                { id: 'r3', name: 'Website', format: 'SVG', size: 240000, href: PHOTOS[0].src, fileName: 'nayrouz-web.svg' },
              ]} />
              <Button icon="open" onClick={() => screen.navigate('/photo/' + nayrouz.id)}>Open the Nayrouz photo</Button>
            </Stack>
          </Columns>

          <Stack gap="sm">
            <SectionHeading level={2}>Photo library</SectionHeading>
            <AssetGallery label="Photo library" items={GALLERY} layout="masonry" lightbox />
          </Stack>

          <SectionHeading level={2}>More from this fall</SectionHeading>
          <RelatedAssets label="More from this fall" variant="grid" onOpen={() => screen.navigate('/photo/v5')}
            items={GALLERY.slice(0, 4).map((g) => ({ id: g.id, src: g.src, alt: g.alt, title: g.title, meta: g.meta }))} />
        </Stack>
      </PageContent>
      <MediaViewer open={viewer !== null} onClose={() => setViewer(null)} index={viewer || 0} onIndexChange={setViewer} label="Event photos"
        items={PHOTOS.map((p) => ({ src: p.src, alt: alt(p), title: p.title, meta: ['SVG', p.date] }))} />
    </SitePage>
  );
}
