/* St. John the Beloved test site · Welcome (#/welcome): the first-run page for a new office servant. Onboarding draws the
   welcome dialog (shown after the first sign-in: #/welcome?first=1), the setup checklist and its own short tour; a second
   Tour walks through the members list's controls; FeatureIntro introduces servant sign-ups (a New badge and a what-is-new
   dialog); a TeachingBubble points at the Help button once; HelpPanel holds the office's help articles in the inspector
   pane, searchable. Progress is kept in the page's state (the caller owns it, as the patterns ask). */
import { Button, FeatureIntro, HelpPanel, Inline, List, Onboarding, PageContent, Panel, Stack, TeachingBubble, Text, Tour, useToast } from 'plenix-platform';
import { SitePage } from '../site.jsx';
import { CHURCH, MEMBERS } from '../data.js';
const { useState } = React;

const TASKS = [
  { id: 'profile', label: 'Check your profile', description: 'Your name and email in My account.' },
  { id: 'mfa', label: 'Turn on two-step verification', description: 'The office keeps members’ phone numbers and addresses.' },
  { id: 'members', label: 'Look up a family', description: 'Open Families and households and find the Girgis family.' },
  { id: 'servants', label: 'Read the servant guidelines', description: 'In Documents, under Servants.' },
  { id: 'bulletin', label: 'Print a weekly bulletin', description: 'From the dashboard’s quick actions.' },
];
const ARTICLES = [
  { id: 'h1', title: 'Add a new member', summary: 'From a visitor card or a family that just joined.', content: <List ordered variant="steps" items={[{ children: 'Press New member in the header, or N.' }, { children: 'Choose the family, or start a new household.' }, { children: 'Save. The member appears in the directory the next day.' }]} /> },
  { id: 'h2', title: 'Record a gift', summary: 'Checks and cash from the Sunday collection.', content: <Text as="p">Open Donations and pledges, choose Record a gift, then the member, the fund and the method. A receipt is emailed when the member has an email.</Text> },
  { id: 'h3', title: 'Sign servants up for a service', summary: 'Ushers, readers, the Agape kitchen and the sound desk.', content: <Text as="p">Servants and sign-ups lists every open slot. Choose a slot, then the servant; the ministry lead is told.</Text> },
  { id: 'h4', title: 'Print the directory', summary: 'Only for members of the parish.', content: <Text as="p">Directory › Print. Giving and private notes are never printed.</Text> },
];

export function WelcomeScreen({ screen, chrome }) {
  const toast = useToast();
  const [done, setDone] = useState(['profile']);
  const [help, setHelp] = useState(true);
  const [tour, setTour] = useState(false);
  const [tip, setTip] = useState(true);
  const first = screen.params && screen.params.first === '1';
  const tourSteps = [
    { id: 'members', title: 'The members list', content: MEMBERS.length + ' people in ' + CHURCH.short + '. Filter by district, ministry or status.', target: <Button icon="settings-users" onClick={() => screen.navigate('/members')}>Members</Button> },
    { id: 'new', title: 'A new member', content: 'From a visitor card: the form asks for the family first.', target: <Button icon="add" onClick={() => screen.navigate('/members/new')}>New member</Button> },
    { id: 'search', title: 'Search the parish', content: 'Find a member, a family or a document from anywhere with the search in the header.', target: <Button icon="search" onClick={() => screen.navigate('/search', { q: 'girgis' })}>Search</Button> },
  ];
  const onboardingSteps = [
    { id: 'calendar', title: 'The calendar', content: 'Services, feasts and every ministry’s meetings, in one place.', target: <Button icon="calendar" onClick={() => screen.navigate('/calendar')}>Calendar</Button> },
    { id: 'giving', title: 'Giving', content: 'Gifts, pledges and the funds, with each family’s statement.', target: <Button icon="field-currency" onClick={() => screen.navigate('/giving')}>Giving</Button> },
  ];
  return (
    <SitePage chrome={chrome} page="dashboard"
      panel={<HelpPanel open={help} onOpenChange={setHelp} title="Office help" articles={ARTICLES} />}>
      <PageContent>
        <Stack gap="lg">
          <Stack gap="xs">
            <Text as="h1" variant="title">Welcome to the parish office</Text>
            <Text as="p" variant="lead">A few steps to get you ready to serve. You can come back to this page from the navigation at any time.</Text>
          </Stack>
          <Panel icon="checklist" title="Get started" description="Check off each step as you go.">
            <Onboarding title={'Welcome to ' + CHURCH.short} welcome={first} tasks={TASKS} completed={done} onChange={setDone} steps={onboardingSteps}
              onDismiss={() => toast.show('The checklist is hidden. It stays in Welcome.')} onTourFinish={(r) => r === 'complete' && toast.show('Tour finished', { tone: 'success' })}
              strings={{ tour: 'Take the quick tour', checklist: 'Your first week' }}>
              <Text as="p">Thank you for serving in the church office. This site keeps the members, families, servants and giving of {CHURCH.name}.</Text>
            </Onboarding>
          </Panel>
          <Panel icon="settings-users" title="Tour the members list" description="Three stops, a minute each."
            actions={<Button size="sm" onClick={() => setTour(true)}>Start the tour</Button>}>
            <Tour open={tour} onOpenChange={setTour} steps={tourSteps} onFinish={(r) => toast.show(r === 'complete' ? 'Members tour finished' : 'Tour skipped. Resume it any time.')} />
          </Panel>
          <Panel icon="sparkle" title="New this month">
            <Stack gap="md">
              <FeatureIntro title="Servant sign-ups" target={<Button icon="checklist" onClick={() => screen.navigate('/servants')}>Open sign-ups</Button>}
                onDismiss={() => toast.show('Got it: we won’t show this again')}>
                Servants now sign up for ushering, readings and the Agape kitchen themselves. The ministry lead sees each sign-up at once.
              </FeatureIntro>
              <Inline gap="sm">
                <TeachingBubble open={tip && !help} onDismiss={() => setTip(false)} title="Help is always here" placement="bottom" spotlight={false}
                  primaryAction={{ label: 'Got it', onClick: () => setTip(false) }}
                  target={<Button icon="circle-info" onClick={() => setHelp(true)}>Help</Button>}>
                  Open the office help from here, or search it, while you work.
                </TeachingBubble>
                <Text variant="secondary">Close the help pane to see where it lives.</Text>
              </Inline>
            </Stack>
          </Panel>
        </Stack>
      </PageContent>
    </SitePage>
  );
}
