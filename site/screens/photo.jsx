/* St. John the Beloved test site · Photo (site/screens/photo.jsx): one photo of the media library, by default v5, the
   Nayrouz celebration. Looking at it, the Media and Sound servants mark who and what is where and talk about it; editing
   it, they replace or crop the picture for the bulletin.
   Plenix parts: FullScreenExperience (the photo with the site chrome) holding ImageAnnotation (pins and regions with
   their comment threads); FullScreenWorkspace (Edit: the whole window) with ImageUpload in its tools, the details in its
   inspector and ImageCrop in the middle. The picture is a drawing from assets/pictures/ standing in for the photo. */
import { Badge, Button, Field, FullScreenExperience, FullScreenWorkspace, Image, ImageAnnotation, ImageCrop, ImageUpload, Inline, Input, Stack, Text, Time, useToast } from 'plenix-platform';
import { MEDIA } from '../data.js';
const { useState } = React;

const PICTURE = 'assets/pictures/picture-17.svg';
const NOTES = [
  { id: 'a1', kind: 'pin', label: 'The Nayrouz table', location: 'Center, in front of the iconostasis', x: 320, y: 180,
    comments: [{ id: 'c1', author: 'Fady Iskander', body: 'The red dates and the guava are on this table: the Nayrouz colors.', time: '2026-09-11T13:10' }] },
  { id: 'a2', kind: 'region', label: 'Deacons’ choir', location: 'Left side, by the choir stand', x: 96, y: 120,
    comments: [{ id: 'c2', author: 'Kirollos Tadros', body: 'The Deacons’ School chanted the hymns of the new year here.', time: '2026-09-11T13:25' }] },
  { id: 'a3', kind: 'pin', label: 'Banner for the new year', location: 'Top right', x: 520, y: 48, comments: [] },
];

export function PhotoScreen({ screen, chrome }) {
  const toast = useToast();
  const item = MEDIA.find((m) => m.id === screen.id) || MEDIA.find((m) => m.id === 'v5');
  const [mode, setMode] = useState('view');
  const [notes, setNotes] = useState(NOTES);
  const [selected, setSelected] = useState('a1');
  const [images, setImages] = useState([{ id: 'i1', url: PICTURE, name: 'nayrouz-2026.svg', size: 2304551, alt: 'A drawing standing in for the photo of the Nayrouz celebration' }]);
  const [cropping, setCropping] = useState(false);
  const [caption, setCaption] = useState('The Nayrouz celebration, the first day of the Coptic year');
  const picture = images[0] || { url: PICTURE, alt: '' };
  const me = 'Church office';

  if (mode === 'edit') {
    return (
      <FullScreenWorkspace strings={{ tools: 'Picture', inspector: 'Details' }}
        toolbar={(
          <Inline justify="between" wrap>
            <Text variant="title" as="h1">Edit: {item.title}</Text>
            <Inline>
              <Button icon="ed-crop" onClick={() => setCropping(true)} disabled={cropping || !images.length}>Crop for the bulletin</Button>
              <Button onClick={() => { setCropping(false); setMode('view'); }}>Cancel</Button>
              <Button variant="primary" icon="check" onClick={() => { setMode('view'); toast.show('Photo saved', { tone: 'success' }); }}>Save</Button>
            </Inline>
          </Inline>
        )}
        tools={(
          <ImageUpload label="The photo" value={images} onChange={setImages} ratio="16-9" altText description="PNG, JPG or SVG, up to 20 MB" maxSize={20e6}
            accept="image/png,image/jpeg,image/svg+xml" />
        )}
        inspector={(
          <Stack gap="md">
            <Field label="Caption" description="Shown under the photo in the bulletin">
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
            </Field>
            <Stack gap="xs">
              <Text variant="label">Taken</Text>
              <Time value={item.date + 'T12:00'} format="date" dateStyle="long" />
            </Stack>
            <Stack gap="xs">
              <Text variant="label">By</Text>
              <Text>{item.speaker}</Text>
            </Stack>
          </Stack>
        )}>
        {cropping ? (
          <ImageCrop src={picture.url} ratio="16-9" output={1600}
            onApply={({ url }) => { setImages((all) => all.map((im, i) => (i === 0 ? { ...im, url } : im))); setCropping(false); toast.show('Cropped to 16:9', { tone: 'success' }); }}
            onCancel={() => setCropping(false)} />
        ) : (
          <Image src={picture.url} alt={picture.alt || ''} ratio="16-9" fit="contain" />
        )}
      </FullScreenWorkspace>
    );
  }

  return (
    <FullScreenExperience {...chrome} title={item.title} description={caption}
      actions={(
        <Inline>
          <Badge tone="success" icon="check">Approved for the bulletin</Badge>
          <Button icon="arrow-left" onClick={() => screen.navigate('/media')}>Sermons and media</Button>
          <Button icon="pencil" onClick={() => setMode('edit')}>Edit photo</Button>
        </Inline>
      )}>
      <Stack gap="md">
        <Text variant="secondary">{item.speaker} · <Time value={item.date + 'T12:00'} format="date" dateStyle="long" /> · {notes.length} notes</Text>
        <ImageAnnotation src={picture.url} alt={picture.alt || 'The Nayrouz celebration'} annotations={notes} selectedId={selected} onSelectionChange={setSelected}
          onAdd={async ({ kind, location, text }) => {
            const id = 'a' + Date.now();
            setNotes((all) => all.concat([{ id, kind, label: location, location, x: 200, y: 200, comments: [{ id: 'c' + id, author: me, body: text, time: new Date().toISOString(), own: true }] }]));
            setSelected(id);
          }}
          onReply={async (id, text) => setNotes((all) => all.map((a) => (a.id === id ? { ...a, comments: a.comments.concat([{ id: 'c' + Date.now(), author: me, body: text, time: new Date().toISOString(), own: true }]) } : a)))} />
      </Stack>
    </FullScreenExperience>
  );
}
