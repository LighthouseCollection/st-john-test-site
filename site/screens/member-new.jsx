/* St. John the Beloved test site · New member (site/screens/member-new.jsx): the church office registers a member.
   A CreatePage (FormFlow on a page) with FormSections of Fields: Input, InputGroup (phone), Textarea, Select, Checkbox,
   Radio and RadioGroup (household), ChoiceList (membership), Switch, Combobox (the family), DatePicker, CountrySelect,
   NumberInput (an optional monthly pledge), a Fieldset address row and TagInput for the languages spoken; a failed save
   shows an ErrorSummary over the fields (required fields are checked there, so their controls skip the browser’s own check). "Quick visitor" in the page header opens a WizardDialog for a first-time visitor. */
import {
  Checkbox, ChoiceList, Combobox, CountrySelect, CreatePage, DatePicker, ErrorSummary, Field, Fieldset, FormSection, Input, InputGroup,
  NumberInput, Radio, RadioGroup, Select, Stack, Switch, Tag, TagInput, TagList, Text, Textarea, WizardDialog, Button, useToast,
} from 'plenix-platform';
import { FAMILIES, MEMBERS, MINISTRIES, CLERGY, familyById, save } from '../data.js';
const { useState } = React;

const BLANK = { first: '', last: '', email: '', phone: '', born: '', household: 'existing', family: '', role: 'Child', street: '', city: '', region: 'NJ',
  postal: '', country: 'US', joined: '2026-10-25', district: '', membership: 'active', ministries: [], languages: ['English'], pledge: null,
  directory: true, newsletter: true, contact: 'email', notes: '' };
const STATES = ['NJ', 'NY', 'PA', 'CT', 'DE'].map((s) => ({ value: s, label: s }));
const DISTRICTS = [{ value: '', label: 'Choose a district' }].concat(['North', 'South', 'East', 'West'].map((d) => ({ value: d, label: d })));
const FAMILY_OPTIONS = FAMILIES.map((f) => ({ value: f.id, label: f.name, group: f.address.city }));

function problemsOf(v) {
  const out = [];
  if (!v.first.trim()) out.push({ target: 'new-first', message: 'Enter the first name' });
  if (!v.last.trim()) out.push({ target: 'new-last', message: 'Enter the last name' });
  if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) out.push({ target: 'new-email', message: 'Enter an email address, such as name@example.com' });
  if (v.household === 'existing' && !v.family) out.push({ target: 'new-family', message: 'Choose the family they belong to' });
  if (v.household === 'new' && !v.street.trim()) out.push({ target: 'new-street', message: 'Enter the street address of the new household' });
  if (!v.district) out.push({ target: 'new-district', message: 'Choose a district' });
  return out;
}

// a new member, saved in the parish database (POST api/members: the server gives the member's and a new family's id), then
// added to the lists of this page
async function addMember(v) {
  const existing = v.household === 'existing' ? familyById(v.family) || FAMILIES[0] : null;
  const saved = await save('members', 'POST', { first: v.first, last: v.last, family: existing ? existing.id : null, role: existing ? v.role : 'Head of household',
    born: v.born || null, email: v.email, phone: v.phone, status: v.membership, joined: v.joined || null, district: v.district || (existing && existing.district) || 'North', ministries: v.ministries,
    address: existing ? null : { line1: v.street, city: v.city, region: v.region, postal: v.postal, country: v.country } });
  const id = saved.id;
  let fam = existing;
  if (!fam) {
    fam = { id: saved.family, name: 'The ' + v.last.trim() + ' family', last: v.last.trim(), members: [], since: 2026, phone: v.phone,
      district: v.district || 'North', address: { line1: v.street.trim(), city: v.city.trim(), region: v.region, postal: v.postal.trim(), country: v.country } };
    FAMILIES.push(fam);
  }
  fam.members.push(id);
  MEMBERS.push({ id, family: fam.id, name: v.first.trim() + ' ' + v.last.trim(), first: v.first.trim(), last: v.last.trim(),
    role: v.household === 'existing' ? v.role : 'Head of household', born: v.born || '2000-01-01', email: v.email, phone: v.phone, status: v.membership, joined: v.joined || '2026-10-25',
    ministries: v.ministries, servant: false, district: v.district || fam.district, giving: 0 });
  return id;
}

function VisitorWizard({ open, onClose, onDone }) {
  const [w, setW] = useState({ first: '', last: '', email: '', visited: '2026-10-25', heard: 'friend', service: 's1', follow: CLERGY[1].id });
  const set = (k) => (e) => setW(Object.assign({}, w, { [k]: e && e.target ? e.target.value : e }));
  const dirty = !!(w.first || w.last || w.email);
  return (
    <WizardDialog open={open} title="Welcome a first-time visitor" dirty={dirty} onClose={onClose}
      onComplete={() => new Promise((resolve) => setTimeout(() => { onDone(w); setW(Object.assign({}, w, { first: '', last: '', email: '' })); resolve(); }, 300))}
      summary={<Text as="p">{(w.first || 'The visitor') + ' ' + w.last} is added as a visitor, and the Visitation ministry is asked to call this week.</Text>}
      steps={[
        { id: 'who', label: 'Visitor', validate: () => (w.first.trim() && w.last.trim() ? '' : 'Enter the visitor’s first and last name.'), content: <Stack>
          <Field label="First name" required><Input value={w.first} onChange={set('first')} /></Field>
          <Field label="Last name" required><Input value={w.last} onChange={set('last')} /></Field>
          <Field label="Email" description="For the welcome letter"><Input type="email" value={w.email} onChange={set('email')} /></Field></Stack> },
        { id: 'visit', label: 'Visit', content: <Stack>
          <Field label="First visited"><DatePicker value={w.visited} onChange={set('visited')} max="2026-10-25" /></Field>
          <Field label="Service"><Select value={w.service} onChange={set('service')} options={[{ value: 's1', label: 'Sunday Divine Liturgy' }, { value: 's2', label: 'Vespers and Midnight Praises' }, { value: 's5', label: 'Youth Meeting' }]} /></Field>
          <RadioGroup label="How they heard of the parish" value={w.heard} onChange={set('heard')}
            options={[{ value: 'friend', label: 'A friend or relative' }, { value: 'web', label: 'The parish website' }, { value: 'moved', label: 'Moved to the area' }]} /></Stack> },
        { id: 'follow', label: 'Follow-up', content: <Stack>
          <Field label="Who calls them"><Select value={w.follow} onChange={set('follow')} options={CLERGY.map((c) => ({ value: c.id, label: c.name + ' · ' + c.role })).concat([{ value: 'visitation', label: 'Visitation ministry' }])} /></Field></Stack> },
      ]} />
  );
}

export function MemberNewScreen({ screen, chrome }) {
  const toast = useToast();
  const [errors, setErrors] = useState([]);
  const [tried, setTried] = useState(false);
  const [wizard, setWizard] = useState(false);
  const err = (target) => (tried ? (errors.find((x) => x.target === target) || {}).message : undefined);

  const fields = ({ value: v, setValue }) => {
    const set = (patch) => { setValue(Object.assign({}, v, patch)); if (tried) setErrors(problemsOf(Object.assign({}, v, patch))); };
    const on = (k) => (e) => set({ [k]: e.target.value });
    return (
      <>
        {tried && errors.length ? <ErrorSummary title="The member was not saved" errors={errors} /> : null}
        <FormSection title="Name" description="As they would like it in the directory.">
          <Field label="First name" required error={err('new-first')}><Input id="new-first" required={false} aria-required="true" autoComplete="given-name" value={v.first} onChange={on('first')} /></Field>
          <Field label="Last name" required error={err('new-last')}><Input id="new-last" required={false} aria-required="true" autoComplete="family-name" value={v.last} onChange={on('last')} /></Field>
          <Field label="Date of birth" description="Used for Sunday School grades"><Input type="date" value={v.born} onChange={on('born')} /></Field>
        </FormSection>
        <FormSection title="Contact">
          <Field label="Email" error={err('new-email')}><Input id="new-email" type="email" value={v.email} onChange={on('email')} /></Field>
          <Field label="Mobile phone"><InputGroup prefix="+1" data><Input type="tel" data autoComplete="tel-national" value={v.phone} onChange={on('phone')} /></InputGroup></Field>
          <Fieldset legend="Preferred way to reach them">
            <Radio name="contact" value="email" label="Email" checked={v.contact === 'email'} onChange={() => set({ contact: 'email' })} />
            <Radio name="contact" value="phone" label="Phone call" checked={v.contact === 'phone'} onChange={() => set({ contact: 'phone' })} />
            <Radio name="contact" value="text" label="Text message" checked={v.contact === 'text'} onChange={() => set({ contact: 'text' })} />
          </Fieldset>
        </FormSection>
        <FormSection title="Household" description="Every member belongs to one household; the address is the household’s.">
          <RadioGroup label="Household" value={v.household} onChange={(household) => set({ household })} layout="row"
            options={[{ value: 'existing', label: 'Joins a family in the parish' }, { value: 'new', label: 'Starts a new household' }]} />
          {v.household === 'existing' ? <>
            <Field label="Family" required error={err('new-family')}><Combobox id="new-family" required={false} aria-required="true" options={FAMILY_OPTIONS} value={v.family} placeholder="Type a family name"
              onChange={(family) => set({ family, district: v.district || (familyById(family) || {}).district || '' })} /></Field>
            <Field label="Place in the household"><Select value={v.role} onChange={on('role')} options={['Head of household', 'Spouse', 'Child', 'Other relative'].map((r) => ({ value: r, label: r }))} /></Field>
          </> : <>
            <Fieldset legend="Address" layout="row">
              <Field label="Street" required error={err('new-street')}><Input id="new-street" required={false} aria-required="true" autoComplete="address-line1" value={v.street} onChange={on('street')} /></Field>
              <Field label="City"><Input autoComplete="address-level2" value={v.city} onChange={on('city')} /></Field>
              <Field label="State"><Select width="xs" value={v.region} onChange={on('region')} options={STATES} /></Field>
              <Field label="ZIP code"><Input width="xs" data inputMode="numeric" autoComplete="postal-code" value={v.postal} onChange={on('postal')} /></Field>
            </Fieldset>
            <Field label="Country"><CountrySelect value={v.country} onChange={(country) => set({ country })} priority={['US', 'CA', 'EG']} /></Field>
          </>}
        </FormSection>
        <FormSection title="Parish">
          <ChoiceList legend="Membership" value={v.membership} onChange={(membership) => set({ membership })} options={[
            { value: 'active', label: 'Member', description: 'Registered with the parish and listed in the directory.' },
            { value: 'visitor', label: 'Visitor', description: 'Attends; the Visitation ministry keeps in touch.' }]} />
          <Field label="Joined the parish"><DatePicker value={v.joined} onChange={(joined) => set({ joined })} presets={[{ label: 'Today', value: '2026-10-25' }]} /></Field>
          <Field label="District" required error={err('new-district')} description="Districts plan visitation and the food pantry routes">
            <Select id="new-district" required={false} aria-required="true" value={v.district} onChange={on('district')} options={DISTRICTS} /></Field>
          <Fieldset legend="Ministries" gap="sm">
            {MINISTRIES.slice(0, 6).map((x) => <Checkbox key={x.id} label={x.name} description={x.meets} checked={v.ministries.indexOf(x.id) >= 0}
              onChange={(e) => set({ ministries: e.target.checked ? v.ministries.concat(x.id) : v.ministries.filter((id) => id !== x.id) })} />)}
          </Fieldset>
          <Field label="Languages spoken">
            <TagList label="Languages spoken">
              {v.languages.map((l) => <Tag key={l} onRemove={() => set({ languages: v.languages.filter((x) => x !== l) })}>{l}</Tag>)}
              <TagInput label="Add a language" onAdd={(text) => { if (v.languages.indexOf(text) < 0) set({ languages: v.languages.concat(text) }); }} />
            </TagList>
          </Field>
          <Field label="Monthly pledge" description="Optional; the family can change it any time"><NumberInput value={v.pledge} onChange={(pledge) => set({ pledge })} format="currency" currency="USD" min={0} step={5} width="sm" /></Field>
          <Switch label="List in the parish directory" checked={v.directory} onChange={(e) => set({ directory: e.target.checked })} />
          <Checkbox label="Send the weekly parish newsletter by email" checked={v.newsletter} onChange={(e) => set({ newsletter: e.target.checked })} />
          <Field label="Notes for the office" counter={300}><Textarea rows={3} value={v.notes} onChange={on('notes')} /></Field>
        </FormSection>
      </>
    );
  };

  return (
    <>
      <CreatePage {...chrome} title="New member" description="Register a member of the parish. Fields with * are required."
        actions={<Button icon="person" onClick={() => setWizard(true)}>Quick visitor</Button>}
        initialValue={BLANK} sessionKey="new-member" fields={fields}
        validate={(v) => { const list = problemsOf(v); setErrors(list); setTried(true); return list.length ? 'Check the fields marked below.' : ''; }}
        onSubmit={(v) => addMember(v)}
        onSuccess={(id) => setTimeout(() => screen.navigate('/member/' + id), 0)}
        onCancel={() => screen.navigate('/members')}
        strings={{ create: 'Add member', saved: 'Member added' }} />
      <VisitorWizard open={wizard} onClose={() => setWizard(false)}
        onDone={(w) => { addMember(Object.assign({}, BLANK, { first: w.first, last: w.last, email: w.email, membership: 'visitor', family: FAMILIES[0].id, household: 'existing', role: 'Other relative', district: 'North', joined: w.visited }))
          .then(() => toast.show(w.first + ' ' + w.last + ' added as a visitor', { tone: 'success' }), (e) => toast.show(e.message, { tone: 'danger' })); setWizard(false); }} />
    </>
  );
}
