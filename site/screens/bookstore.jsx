/* St. John the Beloved test site · Bookstore (site/screens/bookstore.jsx): the Library and Bookstore ministry's table
   after the Divine Liturgy, online. Tabs: Shop (ProductDiscovery, a product opens ProductDetail with ProductOptions, the
   servants' picks as ProductCards, and an icon print ordered with ProductOptions and ProductPrice in a panel that claims
   its page kind with useCommercePage), Catalog (ProductListing as a list), Cart (Cart with Undo and a promo code) and
   Orders (the servants' view: OrderStatus counts, OrderManagement, an order's OrderDetail, and Returns for a picked-up
   order). Orders are picked up at the bookstore table; nothing is charged or shipped. Every order and person is made up. */
import {
  Button, Cart, ContentGrid, Heading, Inline, ORDER_STATUSES, OrderDetail, OrderManagement, OrderStatus, PageContent, Panel,
  ProductCard, ProductDetail, ProductDiscovery, ProductListing, ProductOptions, ProductPrice, Returns, Stack, Tabs, Text, formatNumber,
  formatDate, useCommercePage, useToast,
} from 'plenix-platform';
import { BOOKSTORE, MEMBERS } from '../data.js';
import { SitePage } from '../site.jsx';
const { useState } = React;

const day = (iso) => formatDate(iso + 'T12:00:00');
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');
const MORE = {
  b1: { description: 'The seven prayer hours of the Coptic Orthodox Church, in English and Arabic, with the Psalms and Gospels of each hour.', rating: 4.8, reviewCount: 41,
    specs: [['Pages', '512', true], ['Languages', 'English and Arabic'], ['Binding', 'Hardcover']] },
  b2: { description: 'The hymns of the month of Kiahk with the Midnight Praises, in Coptic, English and Arabic.', rating: 4.6, reviewCount: 12,
    specs: [['Pages', '288', true], ['Languages', 'Coptic, English and Arabic']] },
  b3: { description: 'A print of the parish icon of St. John the Beloved, written by a Coptic iconographer, on heavy matte paper.', rating: 4.9, reviewCount: 23,
    options: [{ name: 'size', label: 'Size', kind: 'buttons', values: [{ value: '8x10', label: '8 × 10 in' }, { value: '11x14', label: '11 × 14 in', price: 35 }, { value: '16x20', label: '16 × 20 in', price: 55, available: false, note: 'Back in December' }] }] },
  b4: { description: 'Forty stories from the Old and New Testaments for children of Sunday School age, with pictures.', rating: 4.7, reviewCount: 30 },
  b5: { description: 'A Coptic cross carved by hand from olive wood.', rating: 4.5, reviewCount: 9,
    options: [{ name: 'size', label: 'Size', kind: 'buttons', values: [{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large', price: 32, note: 'Only 3 left', stock: 3 }] }] },
  b6: { description: 'The lives of the saints remembered in the Coptic month of Tobi, from the Synaxarium.', rating: 4.4, reviewCount: 6 },
};
const DELIVERY = 'Pick up your order at the bookstore table after the Divine Liturgy on Sunday. Unopened items can be returned within 30 days.';
const PRODUCTS = BOOKSTORE.map((b) => Object.assign({ id: b.id, title: b.name, meta: b.category, category: slug(b.category), price: b.price, stock: b.stock, outOfStock: b.stock === 0, delivery: DELIVERY }, MORE[b.id]));
const CATEGORIES = [...new Set(BOOKSTORE.map((b) => b.category))].map((c) => ({ value: slug(c), label: c }));
const productById = (id) => PRODUCTS.find((p) => p.id === id);
const PICKS = ['b1', 'b4', 'b3'].map(productById);

// the order statuses, worded for pickup at the bookstore table
const STATUSES = Object.assign({}, ORDER_STATUSES, {
  fulfilled: Object.assign({}, ORDER_STATUSES.fulfilled, { label: 'Ready for pickup' }),
  delivered: Object.assign({}, ORDER_STATUSES.delivered, { label: 'Picked up' }),
});
const line = (p, q, options, price) => ({ id: p.id + (options ? '-' + slug(options) : ''), title: p.title, options, price: price || p.price, quantity: q, max: p.stock || 99 });
const ORDER_KINDS = ['unfulfilled', 'unfulfilled', 'fulfilled', 'delivered', 'delivered', 'delivered', 'canceled', 'unfulfilled', 'delivered', 'fulfilled', 'refunded', 'delivered'];
const FIRST_ORDERS = ORDER_KINDS.map((status, i) => {
  const m = MEMBERS[(i * 37) % MEMBERS.length];
  const items = [line(PRODUCTS[i % 5], 1 + (i % 2)), i % 3 ? null : line(PRODUCTS[(i + 2) % 5], 1)].filter(Boolean);
  const total = items.reduce((s, x) => s + x.price * x.quantity, 0);
  const date = '2026-10-' + String(24 - i).padStart(2, '0');
  return { id: 'o' + (i + 1), number: 'BK-' + (1042 - i), date, customer: m.name, email: m.email, items, total, currency: 'USD', status, payment: i % 2 ? 'Paid at the table' : 'Visa ending 4242 (test card)',
    delivery: { address: 'Bookstore table, fellowship hall', method: 'Pickup after the Divine Liturgy' },
    events: [{ id: 1, time: day(date), dateTime: date, title: 'Order placed', icon: 'add' }].concat(status === 'delivered' ? [{ id: 2, time: day('2026-10-25'), dateTime: '2026-10-25', title: 'Picked up', icon: 'circle-check' }] : []) };
});

// the icon print, ordered from its own panel: the size sets the price
function IconPrintPanel({ onAdd }) {
  useCommercePage('product-discovery');
  const p = productById('b3');
  const [choice, setChoice] = useState({ size: '8x10' });
  const [qty, setQty] = useState(1);
  const picked = p.options[0].values.find((v) => v.value === choice.size) || {};
  const price = typeof picked.price === 'number' ? picked.price : p.price;
  return (
    <Panel icon="star" title="The parish icon, for your home" description="Prints of the icon of St. John the Beloved, blessed on his feast.">
      <Stack gap="md">
        <ProductPrice price={price} currency="USD" compareAtPrice={choice.size === '8x10' ? 30 : undefined} />
        <ProductOptions product={p.title} options={p.options} value={choice} onChange={(next) => setChoice(next)} quantity={qty} onQuantityChange={(n) => setQty(n || 1)} max={p.stock} />
        <Inline><Button icon="add" onClick={() => onAdd(p, choice, qty, price)}>Add the print to the cart</Button></Inline>
      </Stack>
    </Panel>
  );
}

export function BookstoreScreen({ chrome }) {
  const toast = useToast();
  const [tab, setTab] = useState('shop');
  const [open, setOpen] = useState(null);         // the product shown
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(FIRST_ORDERS);
  const [orderId, setOrderId] = useState(null);   // the order shown
  const [returning, setReturning] = useState(null);
  const order = orders.find((o) => o.id === orderId);
  const setStatus = (ids, status) => setOrders((list) => list.map((o) => (ids.indexOf(o.id) >= 0 ? Object.assign({}, o, { status }) : o)));

  const add = (p, choice, qty, price) => {
    const opt = p.options && choice && choice[p.options[0].name] ? (p.options[0].values.find((v) => v.value === choice[p.options[0].name]) || {}) : null;
    const unit = price || (opt && typeof opt.price === 'number' ? opt.price : p.price);
    const item = line(p, qty || 1, opt ? opt.label || opt.value : undefined, unit);
    setCart((c) => (c.some((x) => x.id === item.id) ? c.map((x) => (x.id === item.id ? Object.assign({}, x, { quantity: x.quantity + item.quantity }) : x)) : c.concat([item])));
    toast.show(p.title + ' added to your cart.', { tone: 'success', action: { label: 'View cart', onAction: () => setTab('cart') } });
  };
  const quickAdd = (p) => { if (p.options) { setOpen(p.id); setTab('shop'); } else add(p, null, 1); };
  const checkout = () => {
    const total = cart.reduce((s, x) => s + x.price * x.quantity, 0);
    const number = 'BK-' + (1043 + orders.length - FIRST_ORDERS.length);
    setOrders([{ id: 'o' + (orders.length + 1), number, date: '2026-10-25', customer: MEMBERS[0].name, email: MEMBERS[0].email, items: cart, total, currency: 'USD', status: 'unfulfilled',
      payment: 'Pay at the table', delivery: { address: 'Bookstore table, fellowship hall', method: 'Pickup after the Divine Liturgy' },
      events: [{ id: 1, time: day('2026-10-25'), dateTime: '2026-10-25', title: 'Order placed', icon: 'add' }] }].concat(orders));
    setCart([]);
    toast.show('Order ' + number + ' placed. Pick it up at the bookstore table after the Divine Liturgy.', { tone: 'success' });
  };

  const product = open ? productById(open) : null;
  const shop = product ? (
    <Stack gap="md">
      <Inline><Button variant="ghost" icon="arrow-left" onClick={() => setOpen(null)}>Back to the bookstore</Button></Inline>
      <ProductDetail key={product.id} product={product} headingLevel={2} onAddToCart={(p, choice, qty) => add(p, choice, qty)}
        related={PRODUCTS.filter((p) => p.id !== product.id && !p.outOfStock).slice(0, 3)} onOpen={(p) => setOpen(p.id)} />
    </Stack>
  ) : (
    <Stack gap="section">
      <ProductDiscovery products={PRODUCTS} categories={CATEGORIES} recommended={PRODUCTS.filter((p) => p.rating >= 4.7)} headingLevel={2}
        title="Books, icons and gifts" onOpen={(p) => setOpen(p.id)} onAddToCart={quickAdd} suggestions={['Agpeya', 'Kiahk', 'Icon', 'Children']} />
      <Stack gap="sm">
        <Heading level={2}>Fr. Daniel's picks for the Nativity Fast</Heading>
        <ContentGrid size="md" label="Fr. Daniel's picks">
          {PICKS.map((p) => <ProductCard key={p.id} title={p.title} meta={p.meta} price={p.price} compareAtPrice={p.id === 'b3' ? 30 : undefined}
            rating={p.rating} reviewCount={p.reviewCount} onOpen={() => setOpen(p.id)} onAddToCart={() => quickAdd(p)} />)}
        </ContentGrid>
      </Stack>
      <IconPrintPanel onAdd={add} />
    </Stack>
  );

  const counts = Object.keys(STATUSES).map((k) => [k, orders.filter((o) => o.status === k).length]).filter((x) => x[1]);
  const office = returning ? (
    <Stack gap="md">
      <Inline><Button variant="ghost" icon="arrow-left" onClick={() => setReturning(null)}>Back to order {returning.number}</Button></Inline>
      <Returns order={returning} headingLevel={2}
        reasons={[{ value: 'damaged', label: 'It arrived damaged' }, { value: 'duplicate', label: 'We already have it' }, { value: 'wrong', label: 'The wrong item' }, { value: 'other', label: 'Another reason' }]}
        resolutions={[{ value: 'refund', label: 'A refund', description: 'To the card or as cash at the table.' }, { value: 'exchange', label: 'An exchange', description: 'Another copy or another item.' }]}
        methods={[{ value: 'table', label: 'Bring it to the bookstore table', description: 'After any Divine Liturgy.' }, { value: 'office', label: 'Leave it at the church office', description: 'Weekdays, 9 AM to 3 PM.' }]}
        status={returning.status === 'returning' ? [{ id: 1, time: day('2026-10-25'), dateTime: '2026-10-25', title: 'Return requested', icon: 'ed-undo' }] : undefined}
        onSubmit={async () => { setStatus([returning.id], 'returning'); setReturning(Object.assign({}, returning, { status: 'returning' })); toast.show('Return requested for order ' + returning.number + '.', { tone: 'success' }); }}
        onCancel={() => setReturning(null)} />
    </Stack>
  ) : order ? (
    <Stack gap="md">
      <Inline><Button variant="ghost" icon="arrow-left" onClick={() => setOrderId(null)}>Every order</Button></Inline>
      <OrderDetail order={order} statuses={STATUSES} headingLevel={2}
        onFulfill={(o) => { setStatus([o.id], 'fulfilled'); toast.show('Order ' + o.number + ' is ready for pickup.', { tone: 'success' }); }}
        onRefund={(o) => { setStatus([o.id], 'refunded'); toast.show('Order ' + o.number + ' refunded.', { tone: 'info' }); }}
        onCancel={(o) => setStatus([o.id], 'canceled')}
        onReturn={(o) => setReturning(o)} />
    </Stack>
  ) : (
    <Stack gap="md">
      <Inline gap="sm" wrap>
        {counts.map(([k, n]) => <Inline key={k} gap="xs"><OrderStatus status={k} statuses={STATUSES} /><Text variant="data">{formatNumber(n)}</Text></Inline>)}
      </Inline>
      <OrderManagement orders={orders} statuses={STATUSES} strings={{ label: 'Bookstore orders', fulfill: 'Ready for pickup' }}
        onOpen={(o) => setOrderId(o.id)} onFulfill={(list) => setStatus(list.map((o) => o.id), 'fulfilled')}
        onCancel={(list) => setStatus(list.map((o) => o.id), 'canceled')} onRefund={(o) => setStatus([o.id], 'refunded')} />
    </Stack>
  );

  const count = cart.reduce((s, x) => s + x.quantity, 0);
  return (
    <SitePage chrome={chrome} page="workspace">
      <PageContent>
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading level={1}>Bookstore</Heading>
            <Text as="p" variant="secondary">Prayer books, hymns, icons and gifts from the Library and Bookstore ministry. Orders are ready at the bookstore table after the Divine Liturgy.</Text>
          </Stack>
          <Tabs variant="folder" label="Bookstore" value={tab} onChange={setTab} items={[
            { value: 'shop', label: 'Shop', icon: 'bookmark', content: shop },
            { value: 'catalog', label: 'Catalog', icon: 'list-lines', content: (
              <ProductListing products={PRODUCTS} categories={CATEGORIES} title="Every item" headingLevel={2} description="Everything the bookstore carries, with what is in stock."
                defaultView={{ layout: 'list' }} onOpen={(p) => { setOpen(p.id); setTab('shop'); }} onAddToCart={quickAdd} />) },
            { value: 'cart', label: 'Cart', icon: 'briefcase', count: count || undefined, content: (
              <Cart items={cart} headingLevel={2} taxRate={0.06625}
                onQuantityChange={(item, n) => setCart((c) => c.map((x) => (x.id === item.id ? Object.assign({}, x, { quantity: n }) : x)))}
                onRemove={(item) => setCart((c) => c.filter((x) => x.id !== item.id))}
                onRestore={(item) => setCart((c) => (c.some((x) => x.id === item.id) ? c : c.concat([item])))}
                onApplyPromo={async (code) => {
                  if (code.toUpperCase() !== 'SERVANT10') throw new Error('This code cannot be used. Servants of the parish use SERVANT10.');
                  return { discount: Math.round(cart.reduce((s, x) => s + x.price * x.quantity, 0) * 10) / 100, label: 'SERVANT10 · 10% off' };
                }}
                onCheckout={checkout} />) },
            { value: 'orders', label: 'Orders', icon: 'checklist', content: office },
          ]} />
        </Stack>
      </PageContent>
    </SitePage>
  );
}
