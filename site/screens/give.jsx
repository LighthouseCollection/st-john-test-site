/* St. John the Beloved test site · Give online (site/screens/give.jsx): how a member gives from home. Three tabs:
   Give once (the gift's lines as CommerceLine items with the OrderSummary, then the Checkout wizard, then the
   OrderConfirmation), Quick gift (Payment with a saved card) and Monthly giving (SubscriptionManagement, whose Update
   payment method opens PaymentFields in a Dialog). Test mode only: the page takes the payment provider's published test
   card numbers (4242 4242 4242 4242 is accepted, 4000 0000 0000 0002 is declined); nothing is charged, sent or kept. */
import {
  Button, Checkbox, Checkout, Columns, CommerceLine, Dialog, Field, Heading, NumberInput, Notice, OrderConfirmation, OrderSummary,
  PageContent, Payment, PaymentFields, Select, Stack, SubscriptionManagement, Tabs, Text, formatCurrency, orderTotals, useToast,
} from 'plenix-platform';
import { CHURCH, FUNDS, ME } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState } = React;

const usd = (n) => formatCurrency(n, 'USD');
const FUND_OPTIONS = FUNDS.map((f) => ({ value: f.id, label: f.name }));
const fundName = (id) => (FUNDS.find((f) => f.id === id) || { name: id }).name;
const DECLINE = '4000000000000002';   // the provider's published card that is always declined
const SAVED = [{ id: 'visa-4242', label: 'Visa ending 4242', description: 'Test card · expires 12/30' }];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function TestCards() {
  return (
    <Notice tone="info" title="Test mode">
      Only the payment provider's published test cards work here: 4242 4242 4242 4242 is accepted and 4000 0000 0000 0002 is
      declined, with any future expiry date and any three digits. Nothing is charged.
    </Notice>
  );
}

// Give once: the gift, then checkout, then the confirmation
function GiveOnce() {
  const [step, setStep] = useState('choose');
  const [fund, setFund] = useState('general');
  const [amount, setAmount] = useState(100);
  const [fee, setFee] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const items = [{ id: 'gift', title: 'Gift to the ' + fundName(fund), options: 'One-time gift', price: amount || 0, quantity: 1 }]
    .concat(fee && amount ? [{ id: 'fee', title: 'Processing fee, covered by you', options: '2.9% of the gift', price: Math.round(amount * 2.9) / 100, quantity: 1 }] : []);
  const totals = orderTotals(items);
  const next = () => { if (!amount || amount < 1) { setError('Enter a gift of at least $1.00.'); return; } setStep('checkout'); };
  if (step === 'done' && order) {
    return (
      <Stack gap="md">
        <OrderConfirmation orderNumber={order.number} email={order.email} items={items} totals={totals} orderHref="#/gifts" continueHref="#/give" headingLevel={2}
          strings={{ title: 'Thank you. Your gift is received.', number: 'Gift number', copy: 'Copy the gift number', view: 'See the giving history', continue: 'Give again' }}
          steps={[
            { id: 1, time: 'Today', dateTime: '2026-10-25', title: 'Receipt emailed', description: 'A receipt for ' + usd(totals.total) + ' went to ' + order.email + '.', icon: 'mail' },
            { id: 2, time: 'January 2027', dateTime: '2027-01-15', title: 'On your giving statement', description: 'The church office sends every family its statement for the year.', icon: 'document' }]} />
        <Button onClick={() => { setOrder(null); setStep('choose'); }}>Give another gift</Button>
      </Stack>
    );
  }
  if (step === 'checkout') {
    return (
      <Stack gap="md">
        <TestCards />
        <Checkout items={items} onCancel={() => setStep('choose')}
          strings={{ label: 'Give online', delivery: 'Receipt address', placeOrder: 'Give ' + usd(totals.total), cancel: 'Back to your gift', summary: 'Your gift', placed: 'Gift received', emailHint: 'For your receipt.', method: 'Receipt by' }}
          onPlaceOrder={async (d) => {
            await wait(300);
            if (d.payment && d.payment.number === DECLINE) throw new Error('The card was declined. Try the test card 4242 4242 4242 4242.');
            setOrder({ number: 'GV-' + (20000 + Math.round(amount)), email: d.email || ME.email });
            setStep('done');
          }} />
      </Stack>
    );
  }
  return (
    <Columns count={2} ratio="sidebar-end" collapseBelow="wide">
      <Stack gap="md">
        <Field label="Fund"><Select value={fund} onChange={(e) => setFund(e.target.value)} options={FUND_OPTIONS} /></Field>
        <Field label="Gift" required error={error} description="Every gift is tax deductible. Your receipt comes by email.">
          <NumberInput value={amount} onChange={(n) => { setAmount(n); setError(''); }} format="currency" currency="USD" min={0} width="sm" />
        </Field>
        <Checkbox label="Cover the 2.9% processing fee, so the whole gift reaches the fund" checked={fee} onChange={(e) => setFee(e.target.checked)} />
        <Stack as="ul" gap="none" aria-label="Your gift">
          {items.map((x) => <CommerceLine key={x.id} item={x} />)}
        </Stack>
      </Stack>
      <OrderSummary items={items} totals={totals} title="Your gift" strings={{ subtotal: 'Gift and fee', shipping: 'Receipt', free: 'By email', tax: 'Tax (gifts are not taxed)' }}>
        <Button variant="primary" onClick={next}>Continue to payment</Button>
      </OrderSummary>
    </Columns>
  );
}

// Quick gift: a saved card, one press
function QuickGift() {
  const toast = useToast();
  const [amount, setAmount] = useState(50);
  return (
    <Stack gap="md">
      <TestCards />
      <Field label="Gift to the general fund"><NumberInput value={amount} onChange={setAmount} format="currency" currency="USD" min={1} width="sm" /></Field>
      <Payment amount={amount || 0} savedMethods={SAVED} title="Quick gift"
        strings={{ description: 'Give to the general fund with your saved card. Nothing is charged until you press Give.', pay: 'Give {amount}', paid: 'Gift received' }}
        onPay={async (d) => {
          await wait(300);
          if (d.method === 'card' && d.number === DECLINE) throw new Error('The test card 4000 0000 0000 0002 is always declined. Use 4242 4242 4242 4242.');
          toast.show('Thank you. ' + usd(amount || 0) + ' given to the general fund.', { tone: 'success' });
        }} />
    </Stack>
  );
}

const PLANS = [
  { id: 'm25', name: '$25 a month', price: 25, period: 'month' },
  { id: 'm50', name: '$50 a month', price: 50, period: 'month' },
  { id: 'm100', name: '$100 a month', price: 100, period: 'month' },
  { id: 'm250', name: '$250 a month', price: 250, period: 'month' },
];
const HISTORY = ['2026-10-01', '2026-09-01', '2026-08-01', '2026-07-01', '2026-06-01', '2026-05-01'].map((date, i) => ({
  id: 'mg' + i, date, description: 'Monthly gift to the general fund', amount: 100, status: i === 3 ? 'failed' : 'paid' }));

// Monthly giving: the plan, its card, pause or cancel
function MonthlyGiving() {
  const toast = useToast();
  const [sub, setSub] = useState({ plan: 'm100', status: 'active', nextBilling: '2026-11-01', since: '2024-01-01', paymentMethod: { label: 'Visa ending 4242', description: 'Test card · expires 12/30' } });
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState({ billingSame: true });
  const [error, setError] = useState('');
  const saveCard = () => {
    const n = String(card.number || '');
    if (n.length < 15 || !card.expiry || !card.cvc || !card.name) { setError('Fill in the card number, expiry date, security code and name.'); return; }
    if (n === DECLINE) { setError('The test card 4000 0000 0000 0002 is always declined. Use 4242 4242 4242 4242.'); return; }
    setSub(Object.assign({}, sub, { paymentMethod: { label: 'Card ending ' + n.slice(-4), description: 'Test card · expires ' + card.expiry.slice(0, 2) + '/' + card.expiry.slice(2) } }));
    setEditing(false); setError(''); toast.show('Your monthly gift now uses the card ending ' + n.slice(-4) + '.', { tone: 'success' });
  };
  return (
    <>
      <SubscriptionManagement subscription={sub} plans={PLANS} history={HISTORY}
        strings={{ plan: 'Your monthly gift', planName: 'Gift', price: 'Amount', next: 'Next gift', since: 'Giving monthly since', change: 'Change the amount', plans: 'Amounts',
          pause: 'Pause monthly giving', resume: 'Resume monthly giving', cancel: 'Stop monthly giving', history: 'Monthly gifts', keep: 'Keep giving',
          manageText: 'Pause to skip the gifts for a while, or stop them. Gifts already given stay on your statement.' }}
        onChangePlan={async (p) => { await wait(200); setSub(Object.assign({}, sub, { plan: p.id })); }}
        onPause={async () => { await wait(200); setSub(Object.assign({}, sub, { status: 'paused' })); }}
        onResume={() => setSub(Object.assign({}, sub, { status: 'active' }))}
        onCancel={async () => { await wait(200); setSub(Object.assign({}, sub, { status: 'canceled', endsAt: '2026-11-01' })); }}
        onUpdatePayment={() => { setCard({ billingSame: true }); setError(''); setEditing(true); }} />
      <Dialog open={editing} onClose={() => setEditing(false)} title="Update the card" size="md"
        footer={<><Button onClick={() => setEditing(false)}>Cancel</Button><Button variant="primary" onClick={saveCard}>Save card</Button></>}>
        <Stack gap="md">
          <TestCards />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <PaymentFields value={card} onChange={setCard} billing={false} />
        </Stack>
      </Dialog>
    </>
  );
}

export function GiveScreen({ chrome }) {
  const [tab, setTab] = useState('once');
  return (
    <SitePage chrome={chrome} page="form">
      <PageContent>
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading level={1}>Give online</Heading>
            <Text as="p" variant="secondary">Support the work of {CHURCH.short}: the general fund, the fellowship hall, the food pantry and more.</Text>
          </Stack>
          <Tabs label="Ways to give" value={tab} onChange={setTab}
            items={[{ value: 'once', label: 'Give once', icon: 'field-currency', content: <GiveOnce /> }, { value: 'quick', label: 'Quick gift', icon: 'star', content: <QuickGift /> },
              { value: 'monthly', label: 'Monthly giving', icon: 'calendar', content: <MonthlyGiving /> }]} />
        </Stack>
      </PageContent>
    </SitePage>
  );
}
