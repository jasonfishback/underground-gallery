// classifieds.jsx — Underground Gallery Classifieds (members-only)
// Three screens: ScreenClassifieds (browser), ScreenListing (detail + offers),
// ScreenListVehicle (create-listing flow). Designed for the iPhone frame
// used in invite.html. Uses globals: Mono, Hairline, ACCENTS, ScreenShell,
// TopBar, CTAButton, AILogo.

// ─── Sample data ───────────────────────────────────────────────────────
const VEHICLES = [
  {
    id: 'v01', kind: 'vehicle',
    year: 1995, make: 'NISSAN', model: 'SKYLINE GT-R', sub: 'R33 V-SPEC',
    price: 84000, type: 'SALE',
    seller: '@R_APEX', sellerRank: 12, vouch: 24, region: 'PNW · SEATTLE',
    posted: '02D', miles: '68,420 km', drive: 'JDM',
    mods: ['HKS T04Z TURBO', 'NISMO LSD 2-WAY', 'OHLINS DFV COILOVERS', 'BREMBO BBK · 380MM',
           'MINES ECU TUNE 580WHP', 'VOLK TE37SL 18×10', 'GREDDY TRUST EXHAUST'],
    accent: '#ff2a2a',
  },
  {
    id: 'v02', kind: 'vehicle',
    year: 1991, make: 'BMW', model: 'M3', sub: 'E30 SPORT EVO',
    price: 142000, type: 'SALE',
    seller: '@TWINSPARK', sellerRank: 9, vouch: 18, region: 'NY · BROOKLYN',
    posted: '06H', miles: '142,888 km', drive: 'EURO',
    mods: ['S14B25 ENGINE REBUILD', 'JENVEY ITBs', 'KW V3 COILOVERS',
           'EVO 3 BODY KIT (OEM)', 'BBS RS 16×9', 'GROUP A EXHAUST'],
    accent: '#ff2a2a',
  },
  {
    id: 'v03', kind: 'vehicle',
    year: 2003, make: 'MITSUBISHI', model: 'LANCER EVO VIII', sub: 'MR EDITION',
    price: null, type: 'TRADE',
    tradeFor: 'NA1 NSX · 96+ STI · WIDEBODY S15',
    seller: '@APEX_11', sellerRank: 7, vouch: 11, region: 'CA · LOS ANGELES',
    posted: '04D', miles: '88,200 km', drive: 'JDM',
    mods: ['FORGED 4G63 · 2.3L STROKER', 'GARRETT GTX3582R', 'AEM INFINITY ECU',
           'CUSCO RS LSD', 'WORK MEISTER S1R 18×10'],
    accent: '#ffd700',
  },
  {
    id: 'v04', kind: 'vehicle',
    year: 1993, make: 'MAZDA', model: 'RX-7', sub: 'FD3S TYPE R',
    price: 62000, type: 'SALE',
    seller: '@KOSAKI', sellerRank: 5, vouch: 8, region: 'TX · AUSTIN',
    posted: '01D', miles: '102,500 km', drive: 'JDM',
    mods: ['SINGLE TURBO BORG-WARNER EFR', 'HALTECH ELITE 2500', 'DEFI GAUGES',
           'KW CLUBSPORT', 'ENKEI RPF1 17×9.5'],
    accent: '#ff2a2a',
  },
];

const PARTS = [
  // BODY
  { id: 'p01', kind: 'part', cat: 'BODY', title: 'NISMO 400R FRONT BUMPER · OEM', price: 4800, cond: 'USED · A', seller: '@R_APEX',  region: 'PNW',     posted: '14H' },
  { id: 'p02', kind: 'part', cat: 'BODY', title: 'TS WIDEBODY KIT · S15 · UNPAINTED', price: 6200, cond: 'NEW',     seller: '@LATEAPEX', region: 'CA',      posted: '02D' },
  { id: 'p03', kind: 'part', cat: 'BODY', title: 'OEM E30 M3 SEDAN BOOT LID',  price: 1800, cond: 'USED · B', seller: '@TWINSPARK', region: 'NY',     posted: '04D' },
  // ENGINE
  { id: 'p04', kind: 'part', cat: 'ENGINE',  title: 'GARRETT GTX3582R GEN II · NEW', price: 2600, cond: 'NEW',  seller: '@APEX_11',   region: 'CA', posted: '01D' },
  { id: 'p05', kind: 'part', cat: 'ENGINE',  title: 'HKS T04Z TURBINE · LOW MILES',   price: 3400, cond: 'USED · A', seller: '@KOSAKI', region: 'TX', posted: '06H' },
  { id: 'p06', kind: 'part', cat: 'ENGINE',  title: 'TOMEI EXPREME-TI · RB26 EXHAUST', price: 1800, cond: 'USED · A', seller: '@SILVERS',  region: 'NY', posted: '02D' },
  { id: 'p07', kind: 'part', cat: 'ENGINE',  title: 'GREDDY 4-ROTOR INTAKE MANIFOLD',  price: 2100, cond: 'USED · B', seller: '@HEXBOX',   region: 'IL', posted: '04D' },
  // INTERIOR
  { id: 'p08', kind: 'part', cat: 'INTERIOR', title: 'BRIDE STRADIA II · BLUE GRADATION · PAIR', price: 2400, cond: 'USED · A', seller: '@NOVA_K', region: 'PNW', posted: '08H' },
  { id: 'p09', kind: 'part', cat: 'INTERIOR', title: 'NARDI DEEP CORN 350MM · NEW',     price: 320, cond: 'NEW',   seller: '@KOSAKI',  region: 'TX', posted: '12H' },
  // SUSPENSION & BRAKES
  { id: 'p10', kind: 'part', cat: 'SUSP', title: 'OHLINS DFV COILOVERS · R33 GTR',     price: 3200, cond: 'USED · A', seller: '@R_APEX', region: 'PNW', posted: '01D' },
  { id: 'p11', kind: 'part', cat: 'SUSP', title: 'BREMBO BBK · 380MM · 6-PISTON · USED', price: 2800, cond: 'USED · B', seller: '@TWINSPARK', region: 'NY', posted: '03D' },
  { id: 'p12', kind: 'part', cat: 'SUSP', title: 'KW CLUBSPORT 3-WAY · FD3S',           price: 4400, cond: 'NEW', seller: '@KOSAKI', region: 'TX', posted: '05D' },
  // WHEELS
  { id: 'p13', kind: 'part', cat: 'WHEEL', title: 'VOLK TE37 SAGA · 18×10 +20 · 5×114', price: 4200, cond: 'USED · A', seller: '@APEX_11',  region: 'CA', posted: '10H' },
  { id: 'p14', kind: 'part', cat: 'WHEEL', title: 'WORK MEISTER S1R 3PC · 18×10 +12',    price: 3800, cond: 'USED · A', seller: '@SILVERS',  region: 'NY', posted: '02D' },
  { id: 'p15', kind: 'part', cat: 'WHEEL', title: 'BBS RS 16×9 · GENUINE · REFURB',     price: 5400, cond: 'USED · A', seller: '@TWINSPARK', region: 'NY', posted: '03D' },
  { id: 'p16', kind: 'part', cat: 'WHEEL', title: 'YOKOHAMA AD09 · 265/35R18 · NEW SET',  price: 1200, cond: 'NEW',  seller: '@HEXBOX',   region: 'IL', posted: '06H' },
];

const PART_CATS = [
  { id: 'BODY',     label: 'BODY',                   icon: 'body' },
  { id: 'ENGINE',   label: 'ENGINE / EXHAUST',       icon: 'engine' },
  { id: 'INTERIOR', label: 'INTERIOR',               icon: 'interior' },
  { id: 'SUSP',     label: 'SUSPENSION & BRAKES',    icon: 'susp' },
  { id: 'WHEEL',    label: 'WHEELS & TIRES',         icon: 'wheel' },
];

const fmt = (n) => '$' + n.toLocaleString();

// ─── SCREEN: Classifieds browser ───────────────────────────────────────
function ScreenClassifieds({ tweaks, accent, onBack, onPickListing, onCreate }) {
  const [tab, setTab] = React.useState('VEHICLES'); // VEHICLES | TRADES | PARTS
  const [partCat, setPartCat] = React.useState('ALL');
  const [q, setQ] = React.useState('');

  // Source rows by tab
  let rows = [];
  if (tab === 'VEHICLES') rows = VEHICLES.filter(v => v.type === 'SALE');
  else if (tab === 'TRADES') rows = VEHICLES.filter(v => v.type === 'TRADE');
  else rows = PARTS.filter(p => partCat === 'ALL' || p.cat === partCat);

  // Search filter
  const ql = q.trim().toLowerCase();
  if (ql) {
    rows = rows.filter(r => {
      const hay = (r.kind === 'vehicle')
        ? `${r.year} ${r.make} ${r.model} ${r.sub} ${r.tradeFor || ''} ${r.mods?.join(' ') || ''} ${r.seller}`
        : `${r.title} ${r.cat} ${r.seller}`;
      return hay.toLowerCase().includes(ql);
    });
  }

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="CLASSIFIEDS"/>

      {/* Header strip */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 24, fontWeight: 700,
            color: '#f5f6f7', letterSpacing: '-0.02em',
          }}>CLASSIFIEDS</div>
          <Mono size={9} color={accent.primary} spacing="0.22em">{rows.length} ACTIVE</Mono>
        </div>
        <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.2em" style={{ display: 'block', marginTop: 2 }}>
          MEMBERS ONLY · NO BROKERS · OFFERS PRIVATE
        </Mono>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', background: '#0a0b10',
          border: '0.5px solid rgba(255,255,255,0.12)',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4" stroke="rgba(201,204,209,0.5)" strokeWidth="1.4" fill="none"/><path d="M9 9l4 4" stroke="rgba(201,204,209,0.5)" strokeWidth="1.4" strokeLinecap="square"/></svg>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tab === 'PARTS' ? 'GTX3582R · BBS RS · BRIDE …' : 'R33 GT-R · M3 EVO · stroker …'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f5f6f7', fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11, letterSpacing: '0.06em', minWidth: 0,
            }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{
              appearance: 'none', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            }}>
              <Mono size={9} color={accent.primary} spacing="0.18em">CLEAR</Mono>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 20px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {['VEHICLES','TRADES','PARTS'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px 12px', cursor: 'pointer',
            borderBottom: tab === t ? `2px solid ${accent.primary}` : '2px solid transparent',
            marginBottom: -0.5,
          }}>
            <Mono size={10} color={tab === t ? '#f5f6f7' : 'rgba(201,204,209,0.45)'} weight={tab === t ? 700 : 500}>{t}</Mono>
          </div>
        ))}
      </div>

      {/* Sub-categories (parts) */}
      {tab === 'PARTS' && (
        <div style={{
          padding: '12px 20px 0', display: 'flex', gap: 6, overflowX: 'auto',
          scrollbarWidth: 'none',
        }} className="no-scrollbar">
          <CategoryChip active={partCat === 'ALL'} onClick={() => setPartCat('ALL')} label="ALL" accent={accent}/>
          {PART_CATS.map(c => (
            <CategoryChip key={c.id} active={partCat === c.id} onClick={() => setPartCat(c.id)} label={c.label} icon={c.icon} accent={accent}/>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 96px' }} className="no-scrollbar">
        {rows.length === 0 ? (
          <EmptyResult q={q} accent={accent}/>
        ) : tab === 'PARTS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(p => <PartRow key={p.id} p={p} accent={accent} onClick={() => onPickListing(p)}/>)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(v => <VehicleCard key={v.id} v={v} accent={accent} onClick={() => onPickListing(v)}/>)}
          </div>
        )}
      </div>

      {/* List CTA — bottom */}
      <div style={{
        position: 'absolute', bottom: 18, left: 20, right: 20, display: 'flex', gap: 8,
      }}>
        <button onClick={onCreate} style={{
          flex: 1, appearance: 'none', padding: '14px 16px', cursor: 'pointer',
          background: accent.primary, color: '#05060a', border: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.22em',
          boxShadow: `0 0 32px ${accent.soft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>+ POST LISTING</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>VEHICLE · PART · TRADE</span>
        </button>
      </div>
    </ScreenShell>
  );
}

// ─── Vehicle card (browser row) ────────────────────────────────────────
function VehicleCard({ v, accent, onClick }) {
  const isTrade = v.type === 'TRADE';
  const tagColor = isTrade ? '#ffd700' : accent.primary;
  return (
    <div onClick={onClick} style={{
      background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
    }}>
      {/* Image placeholder */}
      <div style={{
        height: 132, position: 'relative',
        background: `linear-gradient(135deg, #0a0b10 0%, #1a0606 100%)`,
        backgroundImage: `repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,255,255,0.02) 8px 9px)`,
      }}>
        {/* faux car silhouette */}
        <svg width="100%" height="100%" viewBox="0 0 280 132" style={{ position: 'absolute', inset: 0 }}>
          <path d={isTrade
            ? "M30 90 L70 60 L130 56 L180 56 L240 88 L240 100 L30 100 Z"
            : "M30 90 L70 62 L120 58 L190 58 L250 90 L250 100 L30 100 Z"}
            fill="rgba(255,42,42,0.06)" stroke={tagColor} strokeWidth="0.8" strokeOpacity="0.5"/>
          <circle cx="80" cy="100" r="14" fill="none" stroke={tagColor} strokeWidth="0.8" strokeOpacity="0.5"/>
          <circle cx="200" cy="100" r="14" fill="none" stroke={tagColor} strokeWidth="0.8" strokeOpacity="0.5"/>
        </svg>
        {/* corner glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 80% 30%, ${tagColor}22, transparent 60%)`,
        }}/>
        {/* Tag */}
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 7px', background: tagColor }}>
          <Mono size={9} color="#05060a" weight={700} spacing="0.22em">{v.type}</Mono>
        </div>
        {/* Drive tag */}
        <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 7px',
          background: 'rgba(5,6,10,0.7)', border: '0.5px solid rgba(255,255,255,0.18)' }}>
          <Mono size={8.5} color="rgba(201,204,209,0.7)" weight={700} spacing="0.22em">{v.drive}</Mono>
        </div>
        {/* Price overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Mono size={9} color="rgba(201,204,209,0.6)" spacing="0.2em">{v.year} · {v.miles}</Mono>
            <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 16, fontWeight: 700, color: '#f5f6f7', marginTop: 2, letterSpacing: '-0.01em' }}>
              {v.make} {v.model}
            </div>
          </div>
          {isTrade ? (
            <Mono size={11} color={tagColor} weight={700} spacing="0.16em">TRADE</Mono>
          ) : (
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 700,
              color: tagColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
            }}>{fmt(v.price)}</div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div style={{
        padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent.primary}, #1a0606)`, border: `0.5px solid ${accent.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Inter Tight", sans-serif', fontSize: 9, fontWeight: 700, color: '#f5f6f7',
          }}>{v.seller[1]}</span>
          <Mono size={9.5} color="#f5f6f7" weight={700} spacing="0.14em">{v.seller}</Mono>
          <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.2em">· {v.region}</Mono>
        </div>
        <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.2em">· {v.posted}</Mono>
      </div>
    </div>
  );
}

// ─── Part row ──────────────────────────────────────────────────────────
function PartRow({ p, accent, onClick }) {
  const condColor = p.cond === 'NEW' ? '#5bbeff'
    : p.cond.includes('A') ? accent.primary
    : 'rgba(201,204,209,0.55)';
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '54px 1fr auto',
      gap: 10, padding: '10px 10px',
      background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
      cursor: 'pointer', alignItems: 'center',
    }}>
      <CategoryGlyph cat={p.cat} accent={accent}/>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 12.5, fontWeight: 600, color: '#f5f6f7',
          lineHeight: 1.25, letterSpacing: '-0.005em',
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{p.title}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Mono size={8.5} color={condColor} weight={700} spacing="0.2em">{p.cond}</Mono>
          <span style={{ width: 2, height: 2, background: 'rgba(201,204,209,0.3)' }}/>
          <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.2em">{p.seller}</Mono>
          <span style={{ width: 2, height: 2, background: 'rgba(201,204,209,0.3)' }}/>
          <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.2em">{p.region} · {p.posted}</Mono>
        </div>
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700,
        color: accent.primary, fontVariantNumeric: 'tabular-nums',
      }}>{fmt(p.price)}</div>
    </div>
  );
}

// ─── Category chip ─────────────────────────────────────────────────────
function CategoryChip({ active, onClick, label, icon, accent }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', flexShrink: 0, padding: '6px 10px', cursor: 'pointer',
      background: active ? accent.primary : 'transparent',
      border: `0.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.18)'}`,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {icon && <CategoryIcon kind={icon} color={active ? '#05060a' : 'rgba(201,204,209,0.6)'}/>}
      <Mono size={9} color={active ? '#05060a' : 'rgba(201,204,209,0.7)'} weight={700} spacing="0.2em">{label}</Mono>
    </button>
  );
}

function CategoryIcon({ kind, color }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.3 };
  if (kind === 'body')     return <svg width="11" height="11" viewBox="0 0 14 14"><path d="M2 9 L4 6 L10 6 L12 9 L12 11 L2 11 Z" {...s}/><circle cx="4.5" cy="11" r="1" {...s}/><circle cx="9.5" cy="11" r="1" {...s}/></svg>;
  if (kind === 'engine')   return <svg width="11" height="11" viewBox="0 0 14 14"><rect x="3" y="5" width="6" height="5" {...s}/><path d="M9 6h2v3M2 6h1M2 9h1M5 5V3M7 5V3" {...s}/></svg>;
  if (kind === 'interior') return <svg width="11" height="11" viewBox="0 0 14 14"><path d="M4 11V5c0-1 1-2 2-2h2c1 0 2 1 2 2v6M4 8h6" {...s}/></svg>;
  if (kind === 'susp')     return <svg width="11" height="11" viewBox="0 0 14 14"><path d="M7 2v3M7 9v3M5 5h4 M5 7h4 M5 9h4" {...s}/></svg>;
  if (kind === 'wheel')    return <svg width="11" height="11" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" {...s}/><circle cx="7" cy="7" r="2" {...s}/><path d="M7 2v2M7 10v2M2 7h2M10 7h2" {...s}/></svg>;
  return null;
}

function CategoryGlyph({ cat, accent }) {
  const map = { BODY: 'body', ENGINE: 'engine', INTERIOR: 'interior', SUSP: 'susp', WHEEL: 'wheel' };
  return (
    <div style={{
      width: 54, height: 54, position: 'relative',
      background: `repeating-linear-gradient(135deg, #05060a 0 4px, #0a0b10 4px 5px)`,
      border: `0.5px solid ${accent.primary}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${accent.soft}, transparent 70%)` }}/>
      <div style={{ position: 'relative', transform: 'scale(2)', color: accent.primary }}>
        <CategoryIcon kind={map[cat]} color={accent.primary}/>
      </div>
    </div>
  );
}

function EmptyResult({ q, accent }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <Mono size={9} color={accent.primary} spacing="0.3em">∕∕ NO MATCHES</Mono>
      <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 16, fontWeight: 600, color: '#f5f6f7', marginTop: 8 }}>
        Nothing for "{q}"
      </div>
      <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.16em" style={{ display: 'block', marginTop: 4 }}>
        SAVE THIS SEARCH · GET ALERTS
      </Mono>
    </div>
  );
}

// ─── SCREEN: Listing detail (vehicle or part) ──────────────────────────
function ScreenListing({ tweaks, accent, onBack, listing }) {
  const [tab, setTab] = React.useState('DETAIL'); // DETAIL | OFFERS
  const isVehicle = listing.kind === 'vehicle';
  const isTrade = isVehicle && listing.type === 'TRADE';

  const offers = [
    { who: '@KOSAKI',   amt: 78000, when: '14M', vouch: 5, status: 'OPEN'   },
    { who: '@HEXBOX',   amt: 76500, when: '02H', vouch: 1, status: 'OPEN'   },
    { who: '@APEX_11',  amt: 80000, when: '04H', vouch: 7, status: 'COUNTER' },
    { who: '@SILVERS',  amt: 72000, when: '01D', vouch: 3, status: 'DECLINED' },
  ];

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step={isVehicle ? 'LISTING' : 'PART'}/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 92 }} className="no-scrollbar">
        {/* Hero */}
        <div style={{
          height: isVehicle ? 200 : 160, position: 'relative',
          background: `linear-gradient(135deg, #0a0b10 0%, #1a0606 100%)`,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,255,255,0.02) 8px 9px)`,
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 360 200" style={{ position: 'absolute', inset: 0 }}>
            {isVehicle ? (
              <>
                <path d="M30 140 L80 90 L160 84 L240 84 L320 140 L320 156 L30 156 Z"
                  fill="rgba(255,42,42,0.08)" stroke={accent.primary} strokeWidth="1" strokeOpacity="0.6"/>
                <circle cx="100" cy="156" r="22" fill="none" stroke={accent.primary} strokeWidth="1" strokeOpacity="0.6"/>
                <circle cx="260" cy="156" r="22" fill="none" stroke={accent.primary} strokeWidth="1" strokeOpacity="0.6"/>
              </>
            ) : (
              <rect x="100" y="40" width="160" height="120" fill="none" stroke={accent.primary} strokeWidth="1" strokeOpacity="0.6"/>
            )}
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 80% 30%, ${accent.soft}, transparent 60%)`,
          }}/>
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '3px 7px',
            background: isTrade ? '#ffd700' : accent.primary }}>
            <Mono size={9.5} color="#05060a" weight={700} spacing="0.22em">{isVehicle ? listing.type : listing.cat}</Mono>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '3px 7px',
            background: 'rgba(5,6,10,0.7)', border: '0.5px solid rgba(255,255,255,0.18)' }}>
            <Mono size={9} color="rgba(201,204,209,0.7)" weight={700} spacing="0.22em">PHOTO 1 / 6</Mono>
          </div>
        </div>

        {/* Title block */}
        <div style={{ padding: '16px 20px 8px' }}>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em">
            {isVehicle ? `${listing.year} · ${listing.miles} · ${listing.region}` : `${listing.cond} · ${listing.region} · ${listing.posted}`}
          </Mono>
          <div style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 26, fontWeight: 700, color: '#f5f6f7',
            marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {isVehicle ? <>{listing.make} {listing.model} <span style={{ color: accent.primary }}>{listing.sub}</span></> : listing.title}
          </div>
          {isTrade ? (
            <div style={{ marginTop: 10 }}>
              <Mono size={9} color="#ffd700" spacing="0.22em">TRADING FOR</Mono>
              <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#f5f6f7', marginTop: 4 }}>
                {listing.tradeFor}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 28, fontWeight: 700, color: accent.primary, letterSpacing: '0.02em' }}>{fmt(listing.price)}</span>
              <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em">USD · OBO</Mono>
            </div>
          )}
        </div>

        {/* Seller card */}
        <div style={{ padding: '0 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 12,
            background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent.primary}, #1a0606)`, border: `0.5px solid ${accent.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 700, color: '#f5f6f7',
            }}>{(listing.seller || '@')[1]}</div>
            <div style={{ flex: 1 }}>
              <Mono size={11} color="#f5f6f7" weight={700} spacing="0.14em">{listing.seller}</Mono>
              <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.18em" style={{ display: 'block', marginTop: 2 }}>
                {isVehicle ? `RANK ${listing.sellerRank} · ${listing.vouch} VOUCHES · ${listing.region}` : `VERIFIED MEMBER · ${listing.region}`}
              </Mono>
            </div>
            <button style={{
              appearance: 'none', padding: '6px 10px', cursor: 'pointer',
              background: 'transparent', border: `0.5px solid ${accent.primary}`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
              color: accent.primary, letterSpacing: '0.22em',
            }}>DM</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '14px 20px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          {['DETAIL','OFFERS'].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px 12px', cursor: 'pointer',
              borderBottom: tab === t ? `2px solid ${accent.primary}` : '2px solid transparent',
              marginBottom: -0.5,
            }}>
              <Mono size={10} color={tab === t ? '#f5f6f7' : 'rgba(201,204,209,0.45)'} weight={tab === t ? 700 : 500}>
                {t}{t === 'OFFERS' ? ` · ${offers.length}` : ''}
              </Mono>
            </div>
          ))}
        </div>

        {/* DETAIL tab */}
        {tab === 'DETAIL' && (
          <div style={{ padding: '14px 20px 0' }}>
            {isVehicle && listing.mods && (
              <>
                <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ MOD LIST · {listing.mods.length} ENTRIES</Mono>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
                  {listing.mods.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                    }}>
                      <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.16em">{String(i + 1).padStart(2, '0')}</Mono>
                      <span style={{ width: 4, height: 4, background: accent.primary }}/>
                      <Mono size={10.5} color="#f5f6f7" weight={500} spacing="0.08em">{m}</Mono>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!isVehicle && (
              <>
                <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ DESCRIPTION</Mono>
                <Mono size={11} color="rgba(201,204,209,0.85)" style={{ display: 'block', marginTop: 8, lineHeight: 1.5 }}>
                  Original packaging. Pulled from a low-mileage build. No track time. Bench-tested
                  and shelved for 8 months. Photos of part numbers + casting marks available on DM.
                  Pickup available · ships continental US.
                </Mono>
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Spec label="CONDITION" v={listing.cond}/>
                  <Spec label="CATEGORY" v={listing.cat}/>
                  <Spec label="REGION" v={listing.region}/>
                  <Spec label="POSTED" v={listing.posted + ' AGO'}/>
                </div>
              </>
            )}
          </div>
        )}

        {/* OFFERS tab */}
        {tab === 'OFFERS' && (
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ INCOMING OFFERS</Mono>
              <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.18em">PRIVATE · SELLER ONLY</Mono>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {offers.map((o, i) => <OfferRow key={i} o={o} accent={accent}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 22px',
        background: 'linear-gradient(to top, rgba(5,6,10,0.96) 60%, transparent)',
      }}>
        <button style={{
          appearance: 'none', width: '100%', padding: '14px 16px', cursor: 'pointer',
          background: accent.primary, color: '#05060a', border: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.22em',
          boxShadow: `0 0 32px ${accent.soft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{isTrade ? 'SEND TRADE OFFER' : 'MAKE OFFER'}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{isTrade ? 'PROPOSE TRADE' : 'STARTS PRIVATE THREAD'}</span>
        </button>
      </div>
    </ScreenShell>
  );
}

function Spec({ label, v }) {
  return (
    <div style={{ padding: '8px 10px', background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)' }}>
      <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{label}</Mono>
      <Mono size={11} color="#f5f6f7" weight={700} spacing="0.12em" style={{ display: 'block', marginTop: 3 }}>{v}</Mono>
    </div>
  );
}

function OfferRow({ o, accent }) {
  const statusColor = o.status === 'COUNTER' ? '#ffd700'
    : o.status === 'DECLINED' ? 'rgba(201,204,209,0.4)'
    : accent.primary;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 1fr auto auto',
      gap: 10, padding: '10px 0',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: `linear-gradient(135deg, ${accent.primary}, #1a0606)`, border: `0.5px solid ${accent.primary}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Inter Tight", sans-serif', fontSize: 10, fontWeight: 700, color: '#f5f6f7',
      }}>{o.who[1]}</div>
      <div>
        <Mono size={10.5} color="#f5f6f7" weight={700} spacing="0.14em">{o.who}</Mono>
        <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.18em" style={{ display: 'block', marginTop: 2 }}>
          {o.vouch} VOUCH{o.vouch !== 1 ? 'ES' : ''} · {o.when} AGO
        </Mono>
      </div>
      <span style={{ padding: '2px 6px', background: `${statusColor}1f`, border: `0.5px solid ${statusColor}` }}>
        <Mono size={8.5} color={statusColor} weight={700} spacing="0.22em">{o.status}</Mono>
      </span>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color: accent.primary, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(o.amt)}
      </span>
    </div>
  );
}

// ─── SCREEN: Create listing ────────────────────────────────────────────
function ScreenListVehicle({ tweaks, accent, onBack }) {
  const [type, setType] = React.useState('VEHICLE'); // VEHICLE | PART | TRADE
  const [partCat, setPartCat] = React.useState('');
  const [year, setYear] = React.useState('1995');
  const [makeM, setMakeM] = React.useState('NISSAN');
  const [model, setModel] = React.useState('SKYLINE GT-R R33');
  const [price, setPrice] = React.useState('84000');
  const [tradeFor, setTradeFor] = React.useState('NA1 NSX · WIDEBODY S15');
  const [mods, setMods] = React.useState(['HKS T04Z TURBO', 'NISMO LSD 2-WAY', 'OHLINS DFV COILOVERS']);
  const [draftMod, setDraftMod] = React.useState('');

  const addMod = () => {
    if (!draftMod.trim()) return;
    setMods(m => [...m, draftMod.trim().toUpperCase()]);
    setDraftMod('');
  };

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="POST LISTING"/>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 96px' }} className="no-scrollbar">
        {/* Type selector */}
        <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ LISTING TYPE</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[
            { id: 'VEHICLE', label: 'VEHICLE · SALE' },
            { id: 'TRADE',   label: 'VEHICLE · TRADE' },
            { id: 'PART',    label: 'PART' },
          ].map(o => (
            <button key={o.id} onClick={() => setType(o.id)} style={{
              flex: 1, appearance: 'none', padding: '8px 6px', cursor: 'pointer',
              background: type === o.id ? accent.primary : 'transparent',
              border: `0.5px solid ${type === o.id ? accent.primary : 'rgba(255,255,255,0.18)'}`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.18em', color: type === o.id ? '#05060a' : 'rgba(201,204,209,0.7)',
            }}>{o.label}</button>
          ))}
        </div>

        {/* Photos slot */}
        <div style={{ marginTop: 16 }}>
          <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ PHOTOS · 6 MIN</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{
                aspectRatio: '1', position: 'relative',
                background: `repeating-linear-gradient(135deg, #0a0b10 0 4px, #05060a 4px 5px)`,
                border: `0.5px ${i < 2 ? 'solid' : 'dashed'} ${i < 2 ? accent.primary : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < 2 && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${accent.soft}, transparent 60%)` }}/>}
                <Mono size={9} color={i < 2 ? accent.primary : 'rgba(201,204,209,0.3)'} weight={700} spacing="0.18em">
                  {i < 2 ? `0${i+1}` : '+'}
                </Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Part category — only for parts */}
        {type === 'PART' && (
          <div style={{ marginTop: 16 }}>
            <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ CATEGORY</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 8 }}>
              {PART_CATS.map(c => (
                <button key={c.id} onClick={() => setPartCat(c.id)} style={{
                  appearance: 'none', padding: '10px 10px', cursor: 'pointer',
                  background: partCat === c.id ? accent.primary : 'transparent',
                  border: `0.5px solid ${partCat === c.id ? accent.primary : 'rgba(255,255,255,0.18)'}`,
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                }}>
                  <CategoryIcon kind={c.icon} color={partCat === c.id ? '#05060a' : accent.primary}/>
                  <Mono size={9} color={partCat === c.id ? '#05060a' : 'rgba(201,204,209,0.7)'} weight={700} spacing="0.18em">{c.label}</Mono>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle fields */}
        {type !== 'PART' && (
          <>
            <div style={{ marginTop: 16 }}>
              <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ VEHICLE</Mono>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6, marginTop: 8 }}>
                <Field label="YEAR" v={year} onChange={setYear} accent={accent}/>
                <Field label="MAKE" v={makeM} onChange={setMakeM} accent={accent}/>
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="MODEL · TRIM" v={model} onChange={setModel} accent={accent}/>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ MOD LIST · {mods.length} ENTRIES</Mono>
              <div style={{ marginTop: 8, background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                {mods.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderBottom: i < mods.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.16em">{String(i + 1).padStart(2, '0')}</Mono>
                    <span style={{ width: 4, height: 4, background: accent.primary }}/>
                    <Mono size={10.5} color="#f5f6f7" weight={500} spacing="0.08em" style={{ flex: 1 }}>{m}</Mono>
                    <button onClick={() => setMods(prev => prev.filter((_, j) => j !== i))} style={{
                      appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, margin: -4,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="rgba(201,204,209,0.5)" strokeWidth="1.4" strokeLinecap="square"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  value={draftMod}
                  onChange={(e) => setDraftMod(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMod()}
                  placeholder="Add mod (e.g. HKS T51R · 3″ DOWNPIPE)"
                  style={{
                    flex: 1, background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.18)',
                    padding: '10px 12px', color: '#f5f6f7',
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, letterSpacing: '0.06em',
                    outline: 'none', minWidth: 0,
                  }}
                />
                <button onClick={addMod} style={{
                  appearance: 'none', padding: '0 14px', cursor: 'pointer',
                  background: 'transparent', border: `0.5px solid ${accent.primary}`,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
                  color: accent.primary, letterSpacing: '0.22em',
                }}>+ ADD</button>
              </div>
            </div>
          </>
        )}

        {/* Part fields */}
        {type === 'PART' && (
          <div style={{ marginTop: 16 }}>
            <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ PART</Mono>
            <div style={{ marginTop: 8 }}>
              <Field label="TITLE" v="GARRETT GTX3582R · GEN II" onChange={() => {}} accent={accent}/>
            </div>
            <div style={{ marginTop: 6 }}>
              <Field label="CONDITION" v="USED · A" onChange={() => {}} accent={accent}/>
            </div>
          </div>
        )}

        {/* Pricing or trade-for */}
        <div style={{ marginTop: 16 }}>
          <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ {type === 'TRADE' ? 'TRADE FOR' : 'PRICE'}</Mono>
          {type === 'TRADE' ? (
            <div style={{ marginTop: 8 }}>
              <Field
                label="WANTED" v={tradeFor} onChange={setTradeFor} accent={accent}
                placeholder="NA1 NSX · 96+ STI · WIDEBODY S15"
              />
              <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.18em" style={{ display: 'block', marginTop: 6 }}>
                ACCEPT TRADE OFFERS · ALSO ALLOW CASH OFFERS?
              </Mono>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <ToggleChip label="CASH OK" active accent={accent}/>
                <ToggleChip label="PARTIAL TRADE" active accent={accent}/>
                <ToggleChip label="LOCAL ONLY" accent={accent}/>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: '#0a0b10',
                border: `0.5px solid ${accent.primary}`,
                boxShadow: `inset 0 0 0 1px ${accent.soft}`,
              }}>
                <Mono size={11} color={accent.primary} weight={700} spacing="0.22em">USD</Mono>
                <input
                  type="text" value={price} onChange={(e) => setPrice(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#f5f6f7', fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 22, fontWeight: 700, letterSpacing: '0.04em',
                    fontVariantNumeric: 'tabular-nums', minWidth: 0,
                  }}
                />
                <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em">OBO</Mono>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <ToggleChip label="ACCEPT OFFERS" active accent={accent}/>
                <ToggleChip label="FIRM" accent={accent}/>
                <ToggleChip label="TRADE OK" accent={accent}/>
              </div>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div style={{ marginTop: 16 }}>
          <Mono size={9} color={accent.primary} spacing="0.26em">∕∕ VISIBILITY</Mono>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <ToggleChip label="MEMBERS · ALL" active accent={accent}/>
            <ToggleChip label="REGION ONLY" accent={accent}/>
            <ToggleChip label="VOUCHED 3+" accent={accent}/>
          </div>
        </div>

        {/* Listing fee */}
        <div style={{
          marginTop: 16, padding: 12,
          background: '#0a0b10', border: '0.5px dashed rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.22em">LISTING FEE</Mono>
            <Mono size={11} color={accent.primary} weight={700} spacing="0.16em">{type === 'PART' ? '$0' : '$25'}</Mono>
          </div>
          <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.18em" style={{ display: 'block', marginTop: 4, lineHeight: 1.5 }}>
            {type === 'PART'
              ? 'PARTS · FREE LISTING · 3% SUCCESS FEE ON SOLD'
              : 'VEHICLES · ONE-TIME · COVERS PHOTO REVIEW + ANTI-FRAUD'}
          </Mono>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 22px',
        background: 'linear-gradient(to top, rgba(5,6,10,0.96) 60%, transparent)',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', width: '100%', padding: '14px 16px', cursor: 'pointer',
          background: accent.primary, color: '#05060a', border: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.22em',
          boxShadow: `0 0 32px ${accent.soft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>POST LISTING</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{type === 'PART' ? 'GO LIVE · INSTANT' : 'REVIEW · ~12H'}</span>
        </button>
      </div>
    </ScreenShell>
  );
}

// ─── form atoms ─────────────────────────────────────────────────────────
function Field({ label, v, onChange, accent, placeholder }) {
  return (
    <div style={{ background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.12)', padding: '8px 12px' }}>
      <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{label}</Mono>
      <input
        value={v} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          color: '#f5f6f7', fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
          marginTop: 4, padding: 0,
        }}
      />
    </div>
  );
}

function ToggleChip({ label, active, accent }) {
  return (
    <button style={{
      flex: 1, appearance: 'none', padding: '7px 8px', cursor: 'pointer',
      background: active ? `${accent.primary}1f` : 'transparent',
      border: `0.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.15)'}`,
      fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, fontWeight: 700,
      letterSpacing: '0.18em', color: active ? accent.primary : 'rgba(201,204,209,0.55)',
    }}>{label}</button>
  );
}

Object.assign(window, {
  ScreenClassifieds, ScreenListing, ScreenListVehicle,
  VEHICLES, PARTS, PART_CATS,
});
