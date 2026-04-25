// store.jsx — Underground Gallery member store / merch + payments
// Uses globals: Mono, Hairline, ACCENTS, ScreenShell, TopBar, CTAButton, AILogo

const STORE_PRODUCTS = [
  { id: 'tee-mark',  cat: 'APPAREL',     name: 'UG MARK TEE',         sub: 'HEAVYWEIGHT · 230GSM · BLACK',   price: 48,  stock: 'IN STOCK',     limited: false, drop: 'CORE' },
  { id: 'crew-pit',  cat: 'APPAREL',     name: 'PIT CREW',            sub: 'BOX-CUT · BLOOD RED · M MEMBER',  price: 95,  stock: '12 LEFT',     limited: true,  drop: 'DROP 02' },
  { id: 'cap-tact',  cat: 'HEADWEAR',    name: 'TACTICAL CAP',        sub: '6-PANEL · UG ∕∕ MEMBERS PATCH',    price: 42,  stock: 'IN STOCK',    limited: false, drop: 'CORE' },
  { id: 'plate',     cat: 'PRINT',       name: 'BUILD PLATE · A3',    sub: 'MUSEUM PAPER · NUMBERED · /250',  price: 65,  stock: '47 LEFT',     limited: true,  drop: 'DROP 02' },
  { id: 'sticker',   cat: 'PRINT',       name: 'WINDSHIELD BAND',     sub: '600MM · MATTE BLACK ON CLEAR',     price: 18,  stock: 'IN STOCK',    limited: false, drop: 'CORE' },
  { id: 'pass',      cat: 'ACCESS',      name: 'NIGHTFALL PASS',      sub: 'OPERATION: NIGHTFALL · 04.24',     price: 80,  stock: '13 / 60',     limited: true,  drop: 'EVENT' },
  { id: 'mat',       cat: 'GARAGE',      name: 'PIT MAT · 4×6',       sub: 'RUBBER · UG MARK CENTER',          price: 220, stock: 'PRE-ORDER',   limited: true,  drop: 'DROP 03' },
  { id: 'patch',     cat: 'ACCESS',      name: 'MEMBER PATCH SET',    sub: 'HOOK-LOOP · UG / RANK / REGION',   price: 28,  stock: 'IN STOCK',    limited: false, drop: 'CORE' },
];

function ScreenStore({ tweaks, accent, onBack }) {
  const [cat, setCat] = React.useState('ALL');
  const [cart, setCart] = React.useState([{ id: 'tee-mark', qty: 1 }, { id: 'pass', qty: 2 }]);
  const [view, setView] = React.useState('list'); // list | checkout | confirm

  const cats = ['ALL', 'APPAREL', 'HEADWEAR', 'PRINT', 'ACCESS', 'GARAGE'];
  const filtered = cat === 'ALL' ? STORE_PRODUCTS : STORE_PRODUCTS.filter(p => p.cat === cat);

  const cartItems = cart.map(c => ({ ...STORE_PRODUCTS.find(p => p.id === c.id), qty: c.qty }));
  const subtotal = cartItems.reduce((n, i) => n + i.price * i.qty, 0);
  const memberDiscount = Math.round(subtotal * 0.10);
  const shipping = subtotal > 100 ? 0 : 12;
  const total = subtotal - memberDiscount + shipping;

  const addToCart = (id) => setCart(c => {
    const ex = c.find(x => x.id === id);
    if (ex) return c.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x);
    return [...c, { id, qty: 1 }];
  });

  if (view === 'checkout') {
    return (
      <ScreenCheckout
        tweaks={tweaks} accent={accent}
        items={cartItems} subtotal={subtotal} memberDiscount={memberDiscount}
        shipping={shipping} total={total}
        onBack={() => setView('list')}
        onPay={() => setView('confirm')}
      />
    );
  }
  if (view === 'confirm') {
    return <ScreenOrderConfirm tweaks={tweaks} accent={accent} total={total} items={cartItems} onBack={onBack} onContinue={() => { setCart([]); setView('list'); }}/>;
  }

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="STORE"/>

      {/* Hero */}
      <div style={{ padding: '14px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ MEMBER STORE · DROP 02 LIVE</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 30, fontWeight: 700,
          color: '#f5f6f7', margin: '10px 0 0', letterSpacing: '-0.025em', lineHeight: 0.98,
        }}>Built for the<br/><span style={{ color: accent.primary }}>members.</span></h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 8 }}>
          10% MEMBER DISCOUNT · FREE SHIP &gt; $100 · LIMITED RUNS NEVER REPRINTED
        </Mono>
      </div>

      {/* Category strip */}
      <div style={{ padding: '16px 0 0' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 24px' }} className="no-scrollbar">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              appearance: 'none', padding: '6px 10px', flexShrink: 0,
              background: c === cat ? accent.primary : 'transparent',
              border: `0.5px solid ${c === cat ? accent.primary : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
            }}>
              <Mono size={9.5} color={c === cat ? '#05060a' : 'rgba(201,204,209,0.65)'} weight={700} spacing="0.22em">{c}</Mono>
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filtered.map(p => <ProductCard key={p.id} p={p} accent={accent} onAdd={() => addToCart(p.id)}/>)}
      </div>

      <div style={{ height: 90 }}/>

      {/* Cart sticky bar */}
      {cart.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '12px 20px 18px',
          background: 'linear-gradient(180deg, transparent, #05060a 25%)',
        }}>
          <button onClick={() => setView('checkout')} style={{
            appearance: 'none', width: '100%', padding: '13px 16px',
            background: accent.primary, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 0 32px ${accent.soft}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, background: '#05060a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mono size={10} color={accent.primary} weight={700}>{cart.reduce((n,c) => n + c.qty, 0)}</Mono>
              </div>
              <Mono size={11} color="#05060a" weight={700} spacing="0.22em">CHECKOUT</Mono>
            </div>
            <Mono size={11} color="#05060a" weight={700} spacing="0.18em">${total} →</Mono>
          </button>
        </div>
      )}
    </ScreenShell>
  );
}

function ProductCard({ p, accent, onAdd }) {
  return (
    <div style={{
      background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* image area */}
      <div style={{
        height: 110, position: 'relative',
        background: `repeating-linear-gradient(135deg, #0a0b10 0 8px, #13141a 8px 9px), radial-gradient(circle at 60% 50%, ${accent.soft}, transparent 70%)`,
      }}>
        {/* corner brackets */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTop: `1px solid ${accent.primary}`, borderLeft: `1px solid ${accent.primary}`, opacity: 0.6 }}/>
        <div style={{ position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottom: `1px solid ${accent.primary}`, borderRight: `1px solid ${accent.primary}`, opacity: 0.6 }}/>
        {/* product silhouette */}
        <ProductSilhouette id={p.id} accent={accent}/>
        {/* drop badge */}
        {p.drop !== 'CORE' && (
          <div style={{
            position: 'absolute', top: 6, right: 6, padding: '2px 5px',
            background: p.drop === 'EVENT' ? '#05060a' : accent.primary,
            border: p.drop === 'EVENT' ? `0.5px solid ${accent.primary}` : 'none',
          }}>
            <Mono size={7.5} color={p.drop === 'EVENT' ? accent.primary : '#05060a'} weight={700} spacing="0.2em">{p.drop}</Mono>
          </div>
        )}
      </div>
      {/* details */}
      <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{p.cat}</Mono>
        <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 12.5, fontWeight: 700, color: '#f5f6f7', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          {p.name}
        </div>
        <Mono size={8.5} color="rgba(201,204,209,0.5)" style={{ display: 'block' }} spacing="0.1em">{p.sub}</Mono>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, color: accent.primary, fontVariantNumeric: 'tabular-nums' }}>
            ${p.price}
          </span>
          <Mono size={7.5} color={p.limited ? accent.primary : 'rgba(201,204,209,0.5)'} spacing="0.2em" weight={700}>{p.stock}</Mono>
        </div>
        <button onClick={onAdd} style={{
          appearance: 'none', marginTop: 6, padding: '6px 8px',
          background: 'transparent', border: `0.5px solid ${accent.primary}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <span style={{ color: accent.primary, fontSize: 11, lineHeight: 1, fontWeight: 700 }}>+</span>
          <Mono size={9} color={accent.primary} weight={700} spacing="0.22em">ADD</Mono>
        </button>
      </div>
    </div>
  );
}

function ProductSilhouette({ id, accent }) {
  // Stylized SVG glyphs based on product category
  const c = accent.primary;
  if (id.startsWith('tee') || id.startsWith('crew')) {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        <path d="M30 18 L20 26 L18 40 L28 38 L28 70 L72 70 L72 38 L82 40 L80 26 L70 18 L60 22 L40 22 Z" fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.7"/>
        <text x="50" y="50" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill={c} letterSpacing="2">UG</text>
      </svg>
    );
  }
  if (id.startsWith('cap')) {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M22 50 Q22 30 50 28 Q78 30 78 50 L86 56 L14 56 Z" fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.7"/>
        <rect x="46" y="36" width="8" height="6" fill={c} opacity="0.6"/>
      </svg>
    );
  }
  if (id.startsWith('plate')) {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="28" y="14" width="44" height="56" fill="none" stroke={c} strokeOpacity="0.7"/>
        <rect x="34" y="22" width="32" height="18" fill="none" stroke={c} strokeOpacity="0.4"/>
        <text x="50" y="56" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7" fill={c} letterSpacing="1.5">/250</text>
      </svg>
    );
  }
  if (id.startsWith('sticker')) {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="10" y="32" width="80" height="14" fill={c} opacity="0.85"/>
        <text x="50" y="43" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fontWeight="700" fill="#05060a" letterSpacing="3">UNDERGROUND</text>
      </svg>
    );
  }
  if (id === 'pass') {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="20" y="20" width="60" height="40" fill="none" stroke={c} strokeWidth="1.2"/>
        <line x1="20" y1="32" x2="80" y2="32" stroke={c} strokeOpacity="0.5"/>
        <text x="50" y="29" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fill={c} letterSpacing="2">NIGHTFALL</text>
        <text x="50" y="48" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" fill={c}>04.24</text>
        <circle cx="78" cy="22" r="2" fill={c}/>
      </svg>
    );
  }
  if (id === 'mat') {
    return (
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="14" y="22" width="72" height="40" fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.7"/>
        <rect x="42" y="36" width="16" height="12" fill="none" stroke={c} strokeWidth="1.2"/>
      </svg>
    );
  }
  // patch / fallback
  return (
    <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <circle cx="50" cy="40" r="20" fill="none" stroke={c} strokeWidth="1.2"/>
      <text x="50" y="44" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill={c}>UG</text>
    </svg>
  );
}

// ── Checkout ───────────────────────────────────────────────────────────
function ScreenCheckout({ tweaks, accent, items, subtotal, memberDiscount, shipping, total, onBack, onPay }) {
  const [pay, setPay] = React.useState('apple');
  const [addr] = React.useState('1428 PIONEER SQ · SEATTLE, WA 98104');

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="CHECKOUT"/>

      <div style={{ padding: '12px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ ORDER REVIEW</Mono>
        <h1 style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 26, fontWeight: 700, color: '#f5f6f7', margin: '10px 0 0', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Confirm + pay.
        </h1>
      </div>

      {/* Items list */}
      <div style={{ padding: '18px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.24em" style={{ display: 'block', marginBottom: 6 }}>ITEMS · {items.reduce((n,i)=>n+i.qty,0)}</Mono>
        <div style={{ background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          {items.map((i, idx) => (
            <div key={i.id} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10,
              padding: '10px 12px',
              borderTop: idx === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
              alignItems: 'center',
            }}>
              <div style={{
                width: 36, height: 36, position: 'relative',
                background: `repeating-linear-gradient(135deg, #0a0b10 0 5px, #13141a 5px 6px)`,
                border: '0.5px solid rgba(255,255,255,0.1)',
              }}>
                <ProductSilhouette id={i.id} accent={accent}/>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 12, fontWeight: 700, color: '#f5f6f7' }}>{i.name}</div>
                <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.14em">×{i.qty} · ${i.price}</Mono>
              </div>
              <Mono size={11} color="#f5f6f7" weight={700}>${i.price * i.qty}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      <div style={{ padding: '18px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.24em" style={{ display: 'block', marginBottom: 6 }}>SHIP TO</Mono>
        <div style={{
          padding: '10px 12px', background: '#0a0b10',
          border: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Mono size={10} color="#f5f6f7" spacing="0.1em" weight={500}>{addr}</Mono>
          <Mono size={9} color={accent.primary} weight={700} spacing="0.2em">EDIT</Mono>
        </div>
      </div>

      {/* Payment method */}
      <div style={{ padding: '18px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.24em" style={{ display: 'block', marginBottom: 6 }}>PAYMENT</Mono>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PayOption id="apple" label="APPLE PAY"  sub="•• 4729 · DEFAULT" pay={pay} setPay={setPay} accent={accent}/>
          <PayOption id="card"  label="VISA"       sub="•• 0014 · EXP 09/28" pay={pay} setPay={setPay} accent={accent}/>
          <PayOption id="link"  label="UG CREDIT"  sub="$140 BALANCE · MEMBER LEDGER" pay={pay} setPay={setPay} accent={accent}/>
        </div>
      </div>

      {/* Totals */}
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <TotalRow label="SUBTOTAL" val={`$${subtotal}`}/>
          <TotalRow label="MEMBER · 10%" val={`-$${memberDiscount}`} accent={accent.primary}/>
          <TotalRow label="SHIPPING" val={shipping === 0 ? 'FREE' : `$${shipping}`}/>
          <Hairline color="rgba(255,255,255,0.08)" style={{ margin: '4px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono size={11} color="#f5f6f7" weight={700} spacing="0.2em">TOTAL · USD</Mono>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, color: accent.primary, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>${total}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onPay} label={pay === 'apple' ? '◍ PAY · APPLE' : pay === 'link' ? 'CHARGE UG CREDIT' : 'PAY · VISA ••0014'} sub={`→ $${total}`}/>
    </ScreenShell>
  );
}

function PayOption({ id, label, sub, pay, setPay, accent }) {
  const on = pay === id;
  return (
    <button onClick={() => setPay(id)} style={{
      appearance: 'none', textAlign: 'left', cursor: 'pointer',
      padding: '10px 12px', background: '#0a0b10',
      border: `1px solid ${on ? accent.primary : 'rgba(255,255,255,0.08)'}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        border: `1px solid ${on ? accent.primary : 'rgba(255,255,255,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <div style={{ width: 6, height: 6, background: accent.primary, borderRadius: '50%' }}/>}
      </div>
      <div style={{ flex: 1 }}>
        <Mono size={11} color="#f5f6f7" weight={700} spacing="0.18em">{label}</Mono>
        <Mono size={8.5} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 1 }} spacing="0.14em">{sub}</Mono>
      </div>
    </button>
  );
}

function TotalRow({ label, val, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Mono size={9.5} color="rgba(201,204,209,0.55)" spacing="0.18em">{label}</Mono>
      <Mono size={11} color={accent || '#f5f6f7'} weight={accent ? 700 : 500}>{val}</Mono>
    </div>
  );
}

// ── Order confirmation ─────────────────────────────────────────────────
function ScreenOrderConfirm({ tweaks, accent, total, items, onBack, onContinue }) {
  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="ORDER · CONFIRMED"/>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto',
          border: `1.5px solid ${accent.primary}`,
          background: accent.soft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 28px ${accent.glow}`,
          animation: 'aiSlideIn 0.4s ease-out',
        }}>
          <svg width="28" height="22" viewBox="0 0 28 22"><path d="M2 11 L11 20 L26 4" stroke={accent.primary} strokeWidth="3" fill="none" strokeLinecap="square"/></svg>
        </div>
        <Mono size={10} color={accent.primary} spacing="0.3em" style={{ display: 'block', marginTop: 16 }}>∕∕ THANK YOU</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 28, fontWeight: 700,
          color: '#f5f6f7', margin: '10px 0 0', letterSpacing: '-0.02em', lineHeight: 1,
        }}>Order placed.</h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 8 }}>
          RECEIPT SENT TO +1 ··· ··· 4729
        </Mono>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">ORDER</Mono>
            <Mono size={11} color="#f5f6f7" weight={700} spacing="0.18em">UG-2638-Q</Mono>
          </div>
          <Hairline color="rgba(255,255,255,0.08)"/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <Mono size={9.5} color="rgba(201,204,209,0.55)" spacing="0.18em">ITEMS</Mono>
            <Mono size={11} color="#f5f6f7" weight={700}>{items.reduce((n,i)=>n+i.qty,0)} PIECES</Mono>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <Mono size={9.5} color="rgba(201,204,209,0.55)" spacing="0.18em">CHARGED</Mono>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, color: accent.primary, fontVariantNumeric: 'tabular-nums' }}>${total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <Mono size={9.5} color="rgba(201,204,209,0.55)" spacing="0.18em">SHIPS BY</Mono>
            <Mono size={11} color="#f5f6f7" weight={700}>2026.04.28</Mono>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ padding: '12px 14px', border: `1px dashed ${accent.primary}`, background: '#05060a' }}>
          <Mono size={9} color={accent.primary} spacing="0.22em" weight={700}>+12 PTS · MEMBER LEDGER</Mono>
          <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 4 }} spacing="0.12em">
            Earned for completing checkout. Redeemable on next drop.
          </Mono>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onContinue} label="BACK TO STORE" sub="→ DROP 02 LIVE"/>
    </ScreenShell>
  );
}

Object.assign(window, { ScreenStore, ScreenCheckout, ScreenOrderConfirm });
