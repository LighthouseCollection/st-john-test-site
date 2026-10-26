/* St. John the Beloved test site · Families and households (site/screens/families.jsx): the households of the parish
   as a list and its detail. A MasterDetailPage: the pane lists the families (a SearchField over a NavList); the detail shows
   the chosen household as a PeopleGroup with an AvatarGroup of its members, the head of household's UserCard and the
   newsletter list with its SelectionSummary; under it every household in a DataGrid in pages mode (fetchRows serves
   the pages, sorted, as a server would), with tall rows and wrapped headers. */
import {
  AvatarGroup, Badge, Button, Checkbox, DataGrid, Fieldset, Inline, MasterDetailPage, NavList, Panel, PeopleGroup, RecordPage, SearchField,
  SelectionSummary, Stack, Text, UserCard,
} from 'plenix-platform';
import { FAMILIES, familyById, membersOf } from '../data.js';
const { useState } = React;

const HOUSEHOLDS = FAMILIES.map((f) => ({ id: f.id, name: f.name, town: f.address.city, district: f.district, size: f.members.length, since: f.since, phone: f.phone,
  street: f.address.line1 }));
const COLUMNS = [
  { title: 'Household', field: 'name', kind: 'name' },
  { title: 'Street address', field: 'street' },
  { title: 'Town', field: 'town' },
  { title: 'District', field: 'district' },
  { title: 'People in the household', field: 'size', type: 'number', kind: 'data' },
  { title: 'Parishioners since', field: 'since', type: 'number', kind: 'data' },
  { title: 'Home phone', field: 'phone', kind: 'data' },
];
// the households one page at a time, as the parish server would send them
const fetchHouseholds = ({ page, size, sort }) => new Promise((resolve) => {
  const list = HOUSEHOLDS.slice();
  const s = (sort || [])[0];
  if (s) list.sort((a, b) => (a[s.field] < b[s.field] ? -1 : a[s.field] > b[s.field] ? 1 : 0) * (s.dir === 'desc' ? -1 : 1));
  setTimeout(() => resolve({ rows: list.slice((page - 1) * size, page * size), total: list.length }), 200);
});

export function FamiliesScreen({ screen, chrome }) {
  const [q, setQ] = useState('');
  const id = screen.params.f || 'f1';
  const fam = familyById(id) || FAMILIES[0];
  const people = membersOf(fam.id);
  const head = people.find((p) => p.role === 'Head of household') || people[0];
  const [news, setNews] = useState(() => people.filter((p) => p.role !== 'Child').map((p) => p.id));
  const [newsFor, setNewsFor] = useState(fam.id);
  if (newsFor !== fam.id) { setNewsFor(fam.id); setNews(people.filter((p) => p.role !== 'Child').map((p) => p.id)); }
  const open = (fid) => screen.navigate('/families', { f: fid });
  const list = FAMILIES.filter((f) => !q.trim() || f.name.toLowerCase().indexOf(q.trim().toLowerCase()) >= 0 || f.address.city.toLowerCase().indexOf(q.trim().toLowerCase()) >= 0);

  return (
    <MasterDetailPage {...chrome} paneTitle="Families" detailOpen={!!screen.params.f} onBack={() => screen.navigate('/families')}
      pane={<Stack gap="sm">
        <SearchField value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Find a family or town" label="Find a family" />
        <NavList label="Families" value={fam.id} onSelect={open}
          items={list.map((f) => ({ id: f.id, label: f.name, icon: 'home', count: f.members.length }))} />
      </Stack>}>
      <Stack gap="lg">
        <RecordPage.Header title="Families and households" description={FAMILIES.length + ' households in the parish. Choose one in the list to see it here.'} />
        <Panel title={fam.name} icon="home" description={fam.address.line1 + ', ' + fam.address.city + ', ' + fam.address.region + ' ' + fam.address.postal}
          actions={<Button size="sm" icon="open" onClick={() => screen.navigate('/family/' + fam.id)}>Open the household</Button>}>
          <Stack gap="md">
            <PeopleGroup name={fam.name} description={fam.district + ' district · parishioners since ' + fam.since} count={people.length}
              members={people.map((p) => ({ id: p.id, name: p.name }))} strings={{ team: 'Household' }} href={'#/family/' + fam.id} />
            <Inline gap="sm"><Text variant="label">Everyone at home</Text>
              <AvatarGroup label={'Members of ' + fam.name} people={people.map((p) => ({ id: p.id, name: p.name }))} max={6} size="md" /></Inline>
          </Stack>
        </Panel>
        {head ? <UserCard name={head.name} secondary={head.role} role={head.servant ? 'Servant' : undefined} href={'#/member/' + head.id}
          details={[{ icon: 'mail', label: head.email }, { icon: 'phone', label: head.phone, data: true }, { icon: 'home', label: fam.address.city }]}
          actions={<><Button variant="secondary" icon="message" onClick={() => screen.navigate('/messages')}>Message</Button>
            <Button variant="ghost" icon="person" onClick={() => screen.navigate('/member/' + head.id)}>Profile</Button></>} /> : null}
        <Panel title="Weekly newsletter" description="Who in this household receives the parish newsletter by email.">
          <Stack gap="sm">
            <SelectionSummary count={news.length} total={people.length} noun="person" plural="people"
              onSelectAll={() => setNews(people.map((p) => p.id))} onClear={() => setNews([])} />
            <Fieldset legend="Receives the newsletter" hideLegend gap="sm">
              {people.map((p) => <Checkbox key={p.id} label={p.name} description={p.email} checked={news.indexOf(p.id) >= 0}
                onChange={(e) => setNews(e.target.checked ? news.concat(p.id) : news.filter((x) => x !== p.id))} />)}
            </Fieldset>
            {people.some((p) => p.status !== 'active') ? <Inline gap="sm"><Badge tone="waiting" icon="clock">Check the list</Badge>
              <Text variant="secondary">Some people here are not active members.</Text></Inline> : null}
          </Stack>
        </Panel>
        <Panel title="Every household" description="All households of the parish, a page at a time." flush>
          <DataGrid label="Every household" columns={COLUMNS} data={[]} mode="pages" pageSize={10} pageSizes={[10, 20, 50]} fetchRows={fetchHouseholds}
            rowHeight="tall" wrapHeaders onRowClick={(h) => open(h.id)} />
        </Panel>
      </Stack>
    </MasterDetailPage>
  );
}
