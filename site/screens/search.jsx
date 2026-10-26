/* St. John the Beloved test site · Search (site/screens/search.jsx): the results of the parish search for the query
   in the address (?q=girgis) over members, families, documents and events. A SearchResultsPage: the members in its
   DataGrid, the other kinds as SearchResultGroups of SearchResults with the words searched for in bold, and a new
   search in a SearchField whose recent searches (useSearchHistory, seeded on the first load) are a grid popup with a
   remove button on each row. Advanced member search is a SearchWorkspace (filters, sort) around a QueryBuilder of rules
   and an EntityPicker of members to always include. Every person, family and document is made up. */
import { Badge, Button, EntityPicker, Inline, PageContent, Panel, QueryBuilder, SearchField, SearchResult, SearchResultGroup,
  SearchResultsPage, SearchWorkspace, Stack, Text, matchesFilter, useSearchHistory } from 'plenix-platform';
import { DOCUMENTS, EVENTS, FAMILIES, MEMBERS, MEMBER_STATUS, MINISTRIES, familyById } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useEffect } = React;

const SEEDS = ['Agape kitchen', 'Habib', 'Sunday School curriculum'];
const TONE = { active: 'success', visitor: 'active', moved: 'neutral', inactive: 'waiting' };
const ICON = { active: 'circle-check', visitor: 'person', moved: 'home', inactive: 'clock' };
const statusBadge = (s) => <Badge tone={TONE[s]} icon={ICON[s]}>{MEMBER_STATUS[s]}</Badge>;
const COLUMNS = [
  { title: 'Name', field: 'name', kind: 'name' },
  { title: 'Family', field: 'familyName' },
  { title: 'Role', field: 'role' },
  { title: 'District', field: 'district' },
  { title: 'Email', field: 'email', kind: 'data' },
  { title: 'Status', field: 'status', kind: 'center', render: (m) => statusBadge(m.status) },
];
const has = (text, q) => String(text || '').toLowerCase().includes(q);
const words = (q) => q.toLowerCase().split(/\s+/).filter(Boolean);
const matchAll = (q, ...texts) => { const w = words(q); return w.length > 0 && w.every((x) => texts.some((t) => has(t, x))); };

const OPTIONS = (map) => Object.keys(map).map((k) => ({ value: k, label: map[k] }));
const DISTRICTS = ['North', 'South', 'East', 'West'].map((d) => ({ value: d, label: d }));
const FIELDS = [
  { value: 'name', label: 'Name', kind: 'text' },
  { value: 'status', label: 'Status', kind: 'select', options: OPTIONS(MEMBER_STATUS) },
  { value: 'district', label: 'District', kind: 'select', options: DISTRICTS },
  { value: 'ministries', label: 'Ministries', kind: 'multi', options: MINISTRIES.map((m) => ({ value: m.id, label: m.name })) },
  { value: 'servant', label: 'Serves', kind: 'select', options: [{ value: 'yes', label: 'Serves' }, { value: 'no', label: 'Does not serve' }], get: (m) => (m.servant ? 'yes' : 'no') },
  { value: 'joined', label: 'Joined', kind: 'date' },
];
const PEOPLE = MEMBERS.map((m) => ({ value: m.id, label: m.name, description: m.email }));

// the new search with its recent searches (a grid popup with a remove button on each row)
function NewSearch({ screen, current }) {
  const history = useSearchHistory('st-john-search');
  const [text, setText] = useState('');
  useEffect(() => {
    if (history.items.length < 3) SEEDS.slice().reverse().forEach((s) => history.add(s));
    if (current) history.add(current);
  }, []);
  const run = (q) => { const t = String(q || '').trim(); if (!t) return; history.add(t); setText(''); screen.navigate('/search', { q: t }); };
  return (
      <SearchField label="Search the parish again" placeholder="Search members, families, documents, events" width="lg"
        value={text} onChange={(e) => setText(e.target.value)} onClear={() => setText('')}
        recent={history.items} onSubmitSearch={run} onSelect={(item) => run(item.value)}
        onRemoveRecent={history.remove} onClearRecent={history.clear} />
  );
}

function AdvancedSearch({ chrome, onBack }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('active');
  const [district, setDistrict] = useState(null);
  const [sort, setSort] = useState('name');
  const [rules, setRules] = useState({ join: 'and', items: [
    { id: 'q1', field: 'servant', op: 'any', value: ['yes'] },
    { id: 'q2', field: 'ministries', op: 'any', value: ['agape', 'food-pantry'] },
  ] });
  const [always, setAlways] = useState([]);
  const [limit, setLimit] = useState(10);
  const found = MEMBERS.filter((m) => (!text.trim() || matchAll(text, m.name, m.email)) && (!status || m.status === status)
    && (!district || m.district === district) && matchesFilter(rules, m, FIELDS));
  const extra = always.map((id) => MEMBERS.find((m) => m.id === id)).filter((m) => m && found.indexOf(m) < 0);
  const list = extra.concat(found).sort((a, b) => (sort === 'joined' ? b.joined.localeCompare(a.joined) : a.name.localeCompare(b.name)));
  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <SearchWorkspace title="Advanced member search" query={text} onQueryChange={setText} placeholder="Name or email"
          noun="member" count={list.length}
          headStart={<Button size="sm" variant="ghost" icon="arrow-left" onClick={onBack}>Back to the results</Button>}
          filters={[
            { id: 'status', label: 'Status', options: OPTIONS(MEMBER_STATUS), value: status },
            { id: 'district', label: 'District', options: DISTRICTS, value: district },
          ]}
          onFilterChange={(id, value) => (id === 'status' ? setStatus(value) : setDistrict(value))}
          onClearAll={() => { setStatus(null); setDistrict(null); }}
          sort={{ value: sort, options: [{ value: 'name', label: 'Name' }, { value: 'joined', label: 'Newest members' }], onChange: setSort }}>
          <Stack gap="lg">
            <Panel title="Rules" description="Members who match every rule. Read it back as one sentence in the Text view.">
              <QueryBuilder label="Member rules" fields={FIELDS} value={rules} onChange={setRules} matches={found.length} />
            </Panel>
            <Panel title="Always include">
              <EntityPicker kind="people" multiple label="Members to always include" options={PEOPLE} values={always} onChange={setAlways} />
            </Panel>
            <SearchResultGroup label="Members" onMore={list.length > limit ? () => setLimit((n) => n + 10) : undefined}
              moreLabel={'Show more of ' + list.length + ' members'}>
              {list.slice(0, limit).map((m) => (
                <SearchResult key={m.id} kind="person" title={m.name} href={'#/member/' + m.id} query={text}
                  path={[m.district + ' district', (familyById(m.family) || {}).name]} snippet={m.role + ' · joined ' + m.joined.slice(0, 4)}
                  meta={statusBadge(m.status)} />
              ))}
            </SearchResultGroup>
          </Stack>
        </SearchWorkspace>
      </PageContent>
    </SitePage>
  );
}

export function SearchScreen({ screen, chrome }) {
  const q = (screen.params && screen.params.q) || '';
  const [query, setQuery] = useState(q);
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => { setQuery(q); }, [q]);
  if (advanced) return <AdvancedSearch chrome={chrome} onBack={() => setAdvanced(false)} />;

  const rows = MEMBERS.filter((m) => matchAll(query, m.name, m.email)).map((m) => ({ ...m, familyName: (familyById(m.family) || {}).name }));
  const families = FAMILIES.filter((f) => matchAll(query, f.name, f.address.city, f.address.line1));
  const documents = DOCUMENTS.filter((d) => matchAll(query, d.name, d.folder, d.owner));
  const events = EVENTS.filter((e) => matchAll(query, e.title, e.place));

  return (
    <SearchResultsPage {...chrome} title={query ? 'Search results for “' + query + '”' : 'Search'} query={query} onQueryChange={setQuery}
      rows={rows} columns={COLUMNS}
      strings={{ empty: 'No members match', emptyDescription: 'Try another name, or use the advanced member search.' }}>
      <Stack gap="lg">
        <Inline wrap gap="md" justify="between">
          <NewSearch screen={screen} current={q} />
          <Button icon="filter" onClick={() => setAdvanced(true)}>Advanced member search</Button>
        </Inline>
        {rows.length ? (
          <SearchResultGroup heading="People" count={rows.length} moreHref="#/members" moreLabel={'Show all ' + rows.length + ' in the member list'}>
            {rows.slice(0, 3).map((m) => (
              <SearchResult key={m.id} kind="person" title={m.name} href={'#/member/' + m.id} query={query}
                path={[m.familyName]} meta={<Text variant="data">{m.email}</Text>} />
            ))}
          </SearchResultGroup>
        ) : null}
        {families.length ? (
          <SearchResultGroup heading="Families" count={families.length}>
            {families.slice(0, 5).map((f) => (
              <SearchResult key={f.id} icon="home" title={f.name} href={'#/family/' + f.id} query={query}
                path={[f.district + ' district']} snippet={f.address.line1 + ', ' + f.address.city}
                meta={<Text variant="data">{f.members.length} members · since {f.since}</Text>} />
            ))}
          </SearchResultGroup>
        ) : null}
        {documents.length ? (
          <SearchResultGroup heading="Documents" count={documents.length}>
            {documents.map((d) => (
              <SearchResult key={d.id} kind="file" title={d.name} href={'#/document/' + d.id} query={query}
                path={['Documents', d.folder]} meta={<Text variant="data">{d.owner} · version {d.version}</Text>} />
            ))}
          </SearchResultGroup>
        ) : null}
        {events.length ? (
          <SearchResultGroup heading="Events" count={events.length}>
            {events.map((e) => (
              <SearchResult key={e.id} icon="calendar" title={e.title} href={'#/event/' + e.id} query={query}
                path={['Calendar']} snippet={e.place} meta={<Text variant="data">{e.start.replace('T', ' ')}</Text>} />
            ))}
          </SearchResultGroup>
        ) : null}
        {rows.length ? <Text variant="label">Members</Text> : null}
      </Stack>
    </SearchResultsPage>
  );
}
