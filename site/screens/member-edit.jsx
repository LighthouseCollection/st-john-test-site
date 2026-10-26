/* St. John the Beloved test site · Edit member (site/screens/member-edit.jsx): the office corrects a member's details.
   An EditPage (FormFlow in edit mode on a page) with FormSections of Fields (Input, Select, Combobox of ministries, Switch);
   useUnsavedGuard asks, naming the member, before the person leaves for another screen with changes not saved. */
import { Combobox, EditPage, EmptyState, Field, FormSection, Input, Select, Switch, Button, PageContent, useUnsavedGuard } from 'plenix-platform';
import { MINISTRIES, MEMBER_STATUS, memberById, save } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState, useMemo } = React;

export function MemberEditScreen({ screen, chrome }) {
  const m = memberById(screen.id);
  const initial = useMemo(() => (m ? { first: m.first, last: m.last, email: m.email, phone: m.phone, status: m.status, district: m.district,
    ministries: m.ministries.slice(), directory: m.directory !== false } : null), [screen.id]);
  const [dirty, setDirty] = useState(false);
  // leaving with changes not saved asks first, naming the member
  useUnsavedGuard(dirty, 'Your changes to ' + (m ? m.name : 'this member') + ' will be lost.');

  if (!m) {
    return <SitePage chrome={chrome} page="form"><PageContent>
      <EmptyState kind="not-found" title="This member is not in the parish list" action={<Button onClick={() => screen.navigate('/members')}>Go to members</Button>}>
        There is nothing to edit.</EmptyState></PageContent></SitePage>;
  }
  const fields = ({ value: v, setValue }) => {
    const set = (patch) => { setDirty(true); setValue(Object.assign({}, v, patch)); };
    const on = (k) => (e) => set({ [k]: e.target.value });
    return (
      <>
        <FormSection title="Name">
          <Field label="First name" required error={v.first.trim() ? undefined : 'Enter the first name'}><Input value={v.first} onChange={on('first')} /></Field>
          <Field label="Last name" required error={v.last.trim() ? undefined : 'Enter the last name'}><Input value={v.last} onChange={on('last')} /></Field>
        </FormSection>
        <FormSection title="Contact">
          <Field label="Email"><Input type="email" value={v.email} onChange={on('email')} /></Field>
          <Field label="Phone"><Input type="tel" data value={v.phone} onChange={on('phone')} /></Field>
        </FormSection>
        <FormSection title="Parish">
          <Field label="Status"><Select value={v.status} onChange={on('status')} options={Object.keys(MEMBER_STATUS).map((k) => ({ value: k, label: MEMBER_STATUS[k] }))} /></Field>
          <Field label="District"><Select value={v.district} onChange={on('district')} options={['North', 'South', 'East', 'West'].map((d) => ({ value: d, label: d }))} /></Field>
          <Field label="Ministries"><Combobox multiple options={MINISTRIES.map((x) => ({ value: x.id, label: x.name, group: x.group }))} values={v.ministries}
            onChange={(ministries) => set({ ministries })} placeholder="Add a ministry" /></Field>
          <Switch label="List in the parish directory" checked={v.directory} onChange={(e) => set({ directory: e.target.checked })} />
        </FormSection>
      </>
    );
  };
  return (
    <EditPage {...chrome} title={'Edit ' + m.name} description="Changes show at once in lists, the directory and the member card."
      initialValue={initial} sessionKey={screen.id} fields={fields}
      validate={(v) => (v.first.trim() && v.last.trim() ? '' : 'Enter the first and the last name.')}
      onSubmit={(v) => save('members/' + m.id, 'PATCH', { first: v.first, last: v.last, email: v.email, phone: v.phone, status: v.status, district: v.district })
        .then(() => { Object.assign(m, v, { name: v.first.trim() + ' ' + v.last.trim() }); })}
      onSuccess={() => { setDirty(false); setTimeout(() => screen.navigate('/member/' + screen.id), 0); }}
      onCancel={() => { setDirty(false); setTimeout(() => screen.navigate('/member/' + screen.id), 0); }}
      strings={{ saved: 'Member saved' }} />
  );
}
