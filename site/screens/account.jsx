/* St. John the Beloved test site · My account (#/account): the signed-in office administrator's own settings. The person
   comes from the session (SessionProvider, useSession): the profile (name, email, and the parish role, read only), two-step
   verification (a Notice asks for it until it is on; Set up opens the step in the Auth card: MfaChallenge checks the
   code, and 000000 is always wrong), and the sign-ins linked to the account (ConnectedAccounts). Every group is a
   SettingsSection card in a SettingsLayout. The account area hands the shell its own navigation pane (SideNavPortal): the
   person's own places, and the way back to the parish. */
import { Auth, Badge, Button, ConnectedAccounts, Field, Input, MfaChallenge, NavList, NavPane, Notice, SessionProvider, SideNavPortal, SettingsLayout, SettingsRow, SettingsSection,
  Stack, Text, useSession, useToast } from 'plenix-platform';
import { SitePage } from '../site.jsx';
import { ME } from '../data.js';
const { useState } = React;

const [FIRST, ...REST] = ME.name.split(' ');
const SESSION = {
  account: { name: ME.name, firstName: FIRST, lastName: REST.join(' '), email: ME.email },
  notifications: [{ id: 'n1', text: 'Your two-step verification codes were last used on Oct 20', time: 'Oct 20', unread: false }],
};
const METHODS = [{ id: 'app', kind: 'app', label: 'Authenticator app', detail: 'the app on your phone' }];

export function AccountScreen({ screen, chrome }) {
  return (
    <SessionProvider session={SESSION}>
      <SitePage chrome={Object.assign({}, chrome, { sideNav: null })} page="settings">
        <SideNavPortal>
          <NavPane label="My account" title="My account" as="div" footer={<Button size="sm" variant="ghost" icon="arrow-left" onClick={() => screen.navigate('/')}>Back to the parish</Button>}>
            <NavList label="My account" value="account" items={[
              { id: 'account', label: 'Profile and sign-in', icon: 'settings-profile', href: '#/account' },
              { id: 'welcome', label: 'Getting started', icon: 'star', href: '#/welcome' },
              { id: 'settings', label: 'Parish settings', icon: 'gear', href: '#/settings/general' },
            ]} />
          </NavPane>
        </SideNavPortal>
        <MyAccount />
      </SitePage>
    </SessionProvider>
  );
}

function MyAccount() {
  const toast = useToast();
  const { account } = useSession();
  const [first, setFirst] = useState(account.firstName || '');
  const [last, setLast] = useState(account.lastName || '');
  const [email, setEmail] = useState(account.email || '');
  const [errors, setErrors] = useState({});
  const [setup, setSetup] = useState(false);
  const [mfaOn, setMfaOn] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signIns, setSignIns] = useState([
    { id: 'google', service: 'Google', icon: 'person', description: 'Sign in with your Google account.', status: 'connected', account: ME.email, connectedAt: '2026-03-14',
      scopes: ['See your name and email address'], loses: 'You sign in with your email and password only.' },
    { id: 'microsoft', service: 'Microsoft', icon: 'person', description: 'Sign in with a work or school account.', status: 'disconnected', scopes: ['See your name and email address'] },
  ]);
  const save = () => {
    const e = {};
    if (!first.trim()) e.first = 'Enter your first name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter an email address, like name@example.com.';
    setErrors(e);
    if (!Object.keys(e).length) toast.show('Your profile was saved', { tone: 'success' });
  };
  const verify = (code) => {
    setBusy(true); setMfaError('');
    setTimeout(() => {
      setBusy(false);
      if (code === '000000') { setMfaError('That code didn’t work. Enter the newest code from the app.'); return; }
      setMfaOn(true); setSetup(false); toast.show('Two-step verification is on', { tone: 'success' });
    }, 500);
  };
  const link = (id, status) => setSignIns((list) => list.map((a) => (a.id === id ? { ...a, status, account: status === 'connected' ? (a.account || ME.email) : a.account, connectedAt: status === 'connected' ? '2026-10-25' : a.connectedAt } : a)));
  if (setup) {
    return (
      <Auth title="Set up two-step verification" headingLevel={1}
        description="Add St. John the Beloved to your authenticator app with the setup key from the church office, then enter the 6-digit code it shows."
        footer={<Button variant="ghost" icon="arrow-left" onClick={() => setSetup(false)}>Back to My account</Button>}>
        <MfaChallenge methods={METHODS} onVerify={verify} error={mfaError || undefined} busy={busy} remember={false} autoFocus />
      </Auth>
    );
  }
  return (
    <SettingsLayout>
      <Stack gap="md">
        {mfaOn ? null : <Notice tone="warning" title="Turn on two-step verification">The church office keeps members’ addresses and phone numbers. The parish asks every office account to use it.</Notice>}
        <SettingsSection title="Profile" description="How you appear to the clergy and the other servants in the office." actions={<Button variant="primary" onClick={save}>Save profile</Button>}>
          <Field label="First name" layout="row" required error={errors.first}><Input value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" /></Field>
          <Field label="Last name" layout="row"><Input value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" /></Field>
          <Field label="Email" layout="row" required error={errors.email} description="Sign-in links and office notices come here."><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <SettingsRow label="Role" description="The parish priest changes roles in the parish settings."><Text variant="strong">{ME.role}</Text></SettingsRow>
        </SettingsSection>
        <SettingsSection title="Two-step verification" description="After your password, a code from an app on your phone confirms it is you.">
          <SettingsRow label="Authenticator app" description={mfaOn ? 'Asked for at each sign-in on a new computer.' : 'Not set up yet.'}>
            {mfaOn ? <Badge tone="success" icon="check">On</Badge> : <Button onClick={() => { setMfaError(''); setSetup(true); }}>Set up</Button>}
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="Sign-in methods" description="Accounts you can sign in with instead of your password.">
          <ConnectedAccounts label="Sign-in methods" accounts={signIns} onConnect={(a) => link(a.id, 'connected')} onDisconnect={(a) => link(a.id, 'disconnected')} onReconnect={(a) => link(a.id, 'connected')} />
        </SettingsSection>
      </Stack>
    </SettingsLayout>
  );
}
