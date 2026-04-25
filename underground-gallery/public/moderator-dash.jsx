// moderator-dash.jsx — Underground Gallery moderator console (responsive)
// Renders a full-page web dashboard. Mobile-first; expands to desktop.
// Uses globals: AILogo, AIWordmark, ACCENTS, Mono, Hairline

const ACCENT = { primary: '#ff2a2a', glow: 'rgba(255,42,42,0.35)', soft: 'rgba(255,42,42,0.12)' };

// ─── Role config ─────────────────────────────────────────────────────
// 'owner' = full access incl. financials + user management
// 'mod'   = community ops only · NO money, NO user-access management
const ROLES = {
  owner: {
    label: 'OWNER · ADMIN', tier: 'TIER 00', user: '@R_APEX', initial: 'R',
    chipColor: '#ffd700',
    canFinancial: true, canManageAccess: true,
  },
  mod: {
    label: 'MODERATOR', tier: 'TIER 02', user: '@NOVA_K', initial: 'N',
    chipColor: '#ff2a2a',
    canFinancial: false, canManageAccess: false,
  },
};

// ─── Top-level dashboard ──────────────────────────────────────────────
function ModeratorDashboard({ initialRole = 'owner' }) {
  const [role, setRole] = React.useState(initialRole);
  const R = ROLES[role];
  const [tab, setTab] = React.useState('overview');
  const [navOpen, setNavOpen] = React.useState(false);

  // when switching roles, kick out of any tab the new role can't see
  React.useEffect(() => {
    const blocked = !R.canFinancial && (tab === 'store' || tab === 'payouts');
    const blockedAccess = !R.canManageAccess && (tab === 'users' || tab === 'roles');
    if (blocked || blockedAccess) setTab('overview');
  }, [role]);

  // close mobile nav on selection
  const select = (t) => { setTab(t); setNavOpen(false); };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#05060a', color: '#f5f6f7',
      fontFamily: '"Inter Tight", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(5,6,10,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${ACCENT.primary}`,
        boxShadow: `0 0 20px ${ACCENT.soft}`,
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '10px clamp(14px, 3vw, 28px)',
          display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Burger (mobile) */}
          <button
            onClick={() => setNavOpen(o => !o)}
            className="modd-burger"
            style={{
              appearance: 'none', width: 36, height: 36, padding: 0,
              background: 'transparent', border: '0.5px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {navOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="#f5f6f7" strokeWidth="1.5" strokeLinecap="square"/></svg>
            ) : (
              <svg width="16" height="14" viewBox="0 0 16 14"><path d="M2 3h12M2 7h12M2 11h12" stroke="#f5f6f7" strokeWidth="1.5" strokeLinecap="square"/></svg>
            )}
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <AILogo size={26} color={ACCENT.primary}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1, minWidth: 0 }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>
                UNDERGROUND <span style={{ color: ACCENT.primary }}>∕∕</span> CONSOLE
              </span>
              <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.28em">{R.label} · {R.tier}</Mono>
            </div>
          </div>

          {/* Role switcher (demo) */}
          <RoleSwitcher role={role} setRole={setRole}/>

          {/* Live status */}
          <div className="modd-live" style={{
            display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          }}>
            <LivePulse/>
            <Hairline vertical color="rgba(255,255,255,0.1)" style={{ height: 22 }}/>
            <button style={iconBtn()} title="Search">
              <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4" stroke="#c9ccd1" strokeWidth="1.4" fill="none"/><path d="M9 9l4 4" stroke="#c9ccd1" strokeWidth="1.4" strokeLinecap="square"/></svg>
            </button>
            <button style={{ ...iconBtn(), position: 'relative' }} title="Alerts">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 10V6a4 4 0 018 0v4l1 1H2z M5 11.5a2 2 0 004 0" stroke="#c9ccd1" strokeWidth="1.2" fill="none"/></svg>
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: ACCENT.primary, borderRadius: '50%', boxShadow: `0 0 6px ${ACCENT.primary}` }}/>
            </button>
            <div className="modd-user" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 4px',
              background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `linear-gradient(135deg, ${R.chipColor}, #1a0606)`,
                border: `0.5px solid ${R.chipColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 11, color: '#f5f6f7',
              }}>{R.initial}</div>
              <div style={{ lineHeight: 1.05 }}>
                <Mono size={10} color="#f5f6f7" weight={700} spacing="0.12em">{R.user}</Mono>
                <Mono size={8} color={R.chipColor} spacing="0.22em">{role === 'owner' ? 'OWNER' : 'MOD'} · {R.tier}</Mono>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY: sidebar + main */}
      <div style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', position: 'relative' }}>
        {/* Sidebar */}
        <aside
          className={`modd-side ${navOpen ? 'modd-side--open' : ''}`}
          style={{
            width: 220, flexShrink: 0,
            borderRight: '0.5px solid rgba(255,255,255,0.06)',
            padding: '18px 0', position: 'sticky', top: 50, alignSelf: 'flex-start',
            height: 'calc(100vh - 50px)', overflowY: 'auto',
          }}>
          <NavSection label="OVERVIEW">
            <NavItem id="overview" tab={tab} onClick={select} icon={<IconGrid/>}>Overview</NavItem>
            <NavItem id="signups" tab={tab} onClick={select} icon={<IconChart/>} count="+128">Signups</NavItem>
            <NavItem id="traffic" tab={tab} onClick={select} icon={<IconTraffic/>}>Traffic</NavItem>
          </NavSection>

          <NavSection label="QUEUE">
            <NavItem id="approvals" tab={tab} onClick={select} icon={<IconCheck/>} count="47" hot>Approvals</NavItem>
            <NavItem id="flags" tab={tab} onClick={select} icon={<IconFlag/>} count="03">Flags</NavItem>
            <NavItem id="vouches" tab={tab} onClick={select} icon={<IconNet/>}>Vouches</NavItem>
          </NavSection>

          <NavSection label="OPERATIONS">
            <NavItem id="meets" tab={tab} onClick={select} icon={<IconPin/>}>Meets</NavItem>
            <NavItem id="audit" tab={tab} onClick={select} icon={<IconLog/>}>Audit Log</NavItem>
          </NavSection>

          {R.canFinancial && (
            <NavSection label="FINANCIALS · OWNER">
              <NavItem id="store" tab={tab} onClick={select} icon={<IconBag/>}>Store · Orders</NavItem>
              <NavItem id="payouts" tab={tab} onClick={select} icon={<IconCash/>}>Payouts</NavItem>
            </NavSection>
          )}

          {R.canManageAccess && (
            <NavSection label="ACCESS · OWNER">
              <NavItem id="users" tab={tab} onClick={select} icon={<IconUsers/>}>Users</NavItem>
              <NavItem id="roles" tab={tab} onClick={select} icon={<IconKey/>}>Roles · Staff</NavItem>
            </NavSection>
          )}

          <div style={{ padding: '16px 18px', marginTop: 14, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.24em">SHORTCUT</Mono>
            <a href="invite.html" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 8, padding: '8px 10px',
              background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.1)',
              textDecoration: 'none',
            }}>
              <Mono size={9} color="#f5f6f7" weight={700} spacing="0.18em">EXIT TO APP</Mono>
              <svg width="10" height="10" viewBox="0 0 14 14"><path d="M3 11L11 3M5 3h6v6" stroke={ACCENT.primary} strokeWidth="1.4" fill="none" strokeLinecap="square"/></svg>
            </a>
          </div>
        </aside>

        {/* Mobile nav backdrop */}
        {navOpen && (
          <div onClick={() => setNavOpen(false)} className="modd-backdrop" style={{
            position: 'fixed', inset: 0, top: 50, background: 'rgba(5,6,10,0.7)', zIndex: 19,
            backdropFilter: 'blur(2px)',
          }}/>
        )}

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(14px, 2.4vw, 28px)' }}>
          {tab === 'overview'  && <Overview role={role}/>}
          {tab === 'signups'   && <Signups/>}
          {tab === 'traffic'   && <Traffic/>}
          {tab === 'approvals' && <Approvals/>}
          {tab === 'flags'     && <PlaceholderPane label="FLAGS" sub="Reported builds + DM threads" stat="03 OPEN"/>}
          {tab === 'vouches'   && <PlaceholderPane label="VOUCHES" sub="Member endorsement graph" stat="184 ACTIVE"/>}
          {tab === 'meets'     && <PlaceholderPane label="MEETS" sub="Operation: Nightfall · 04.24" stat="47 / 60 RSVP"/>}
          {tab === 'audit'     && <PlaceholderPane label="AUDIT LOG" sub="Every action you take is logged here" stat="∞"/>}
          {tab === 'store'     && R.canFinancial && <StoreOps/>}
          {tab === 'payouts'   && R.canFinancial && <Payouts/>}
          {tab === 'users'     && R.canManageAccess && <UsersPage/>}
          {tab === 'roles'     && R.canManageAccess && <RolesPage/>}
        </main>
      </div>

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 880px) {
          .modd-side { position: fixed !important; left: 0; top: 50px !important; height: calc(100vh - 50px) !important;
            transform: translateX(-100%); transition: transform 0.22s; z-index: 25; background: #05060a;
            border-right: 0.5px solid rgba(255,42,42,0.4); }
          .modd-side--open { transform: translateX(0); box-shadow: 12px 0 32px rgba(0,0,0,0.5); }
          .modd-burger { display: flex !important; }
          .modd-user { display: none !important; }
        }
        @media (max-width: 540px) {
          .modd-live > button { display: none !important; }
          .modd-live > .hairline-22 { display: none !important; }
        }
        .modd-card { transition: border-color 0.18s, box-shadow 0.18s; }
        .modd-card:hover { border-color: rgba(255,42,42,0.45) !important; box-shadow: 0 0 18px rgba(255,42,42,0.08); }
        .modd-row:hover { background: #0e0f15 !important; }
      `}</style>
    </div>
  );
}

// ─── Live pulse pill ──────────────────────────────────────────────────
function LivePulse() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', background: '#0a0b10',
      border: '0.5px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{
        width: 6, height: 6, background: ACCENT.primary, borderRadius: '50%',
        boxShadow: `0 0 6px ${ACCENT.primary}`,
        animation: 'aiPulse 1.6s ease-in-out infinite',
      }}/>
      <Mono size={8.5} color={ACCENT.primary} weight={700} spacing="0.24em">LIVE</Mono>
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────
function NavSection({ label, children }) {
  return (
    <div style={{ padding: '8px 0 12px' }}>
      <div style={{ padding: '6px 18px' }}>
        <Mono size={8.5} color="rgba(201,204,209,0.35)" spacing="0.28em">{label}</Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function NavItem({ id, tab, onClick, icon, children, count, hot }) {
  const active = tab === id;
  return (
    <button onClick={() => onClick(id)} style={{
      appearance: 'none', textAlign: 'left', cursor: 'pointer',
      padding: '10px 18px', position: 'relative',
      background: active ? 'linear-gradient(90deg, rgba(255,42,42,0.08), transparent)' : 'transparent',
      border: 'none',
      borderLeft: `2px solid ${active ? ACCENT.primary : 'transparent'}`,
      display: 'flex', alignItems: 'center', gap: 10,
      color: active ? '#f5f6f7' : 'rgba(201,204,209,0.7)',
    }}>
      <span style={{ color: active ? ACCENT.primary : 'rgba(201,204,209,0.5)', display: 'inline-flex' }}>{icon}</span>
      <span style={{
        flex: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: active ? 700 : 500,
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>{children}</span>
      {count && (
        <span style={{
          padding: '1px 5px',
          background: hot ? ACCENT.primary : 'rgba(255,255,255,0.08)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
          color: hot ? '#05060a' : 'rgba(201,204,209,0.7)',
          letterSpacing: '0.12em',
        }}>{count}</span>
      )}
    </button>
  );
}

// ─── Page: Overview ───────────────────────────────────────────────────
function Overview({ role = 'owner' }) {
  const isOwner = role === 'owner';
  return (
    <div>
      <PageHeader label="OVERVIEW" sub="Last 30 days · all events"/>

      {/* KPI grid */}
      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      }}>
        <KPI label="MEMBERS · TOTAL"     val="2,847" delta="+128" deltaSub="THIS WEEK" trend={[12,18,16,22,28,40,52,68,80,96,112,128]} accent={ACCENT.primary}/>
        <KPI label="PENDING APPROVALS"   val="47"    delta="+12"  deltaSub="LAST 24H"  trend={[8,12,9,14,18,22,28,34,38,40,44,47]} accent={ACCENT.primary} hot/>
        <KPI label="WEEKLY ACTIVE"       val="1,892" delta="+4.2%" deltaSub="VS PREV"  trend={[40,42,38,44,52,60,58,64,70,72,75,78]}/>
        {isOwner && <KPI label="STORE · MTD" val="$18,420" delta="+$2,140" deltaSub="VS APR" trend={[200,260,300,320,400,520,580,640,720,820,900,940]}/>}
        <KPI label="OPEN FLAGS"          val="03" delta="−02" deltaSub="RESOLVED 24H" trend={[5,6,4,3,4,5,6,5,4,3,3,3]}/>
        <KPI label="MEET RSVPs"          val="47 / 60" delta="−13 SLOTS" deltaSub="NIGHTFALL" trend={[2,8,14,20,26,32,38,40,42,44,46,47]}/>
      </div>

      {/* 2-up: signup chart + queue preview */}
      <Grid2>
        <Card title="SIGNUPS · 30D" sub="Daily completion rate">
          <SignupBarChart/>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <Legend color={ACCENT.primary} label="APPROVED"/>
            <Legend color="rgba(201,204,209,0.6)" label="PENDING"/>
            <Legend color="rgba(255,255,255,0.18)" label="REJECTED"/>
          </div>
        </Card>

        <Card title="QUEUE · NEXT UP" sub="Tap to review" right={<a href="#" style={linkStyle()}>VIEW ALL →</a>}>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {APPROVAL_PREVIEW.map((a, i) => <QueueRow key={a.id} a={a}/>)}
          </div>
        </Card>
      </Grid2>

      {/* Traffic + activity */}
      <Grid2>
        <Card title="TRAFFIC SOURCES" sub="Where signups come from">
          <TrafficBars/>
        </Card>
        <Card title="ACTIVITY · NOW" sub="Auto-refresh · 5s">
          <ActivityFeed/>
        </Card>
      </Grid2>
    </div>
  );
}

// ─── Page: Signups ────────────────────────────────────────────────────
function Signups() {
  return (
    <div>
      <PageHeader label="SIGNUPS" sub="2,847 total · +128 this week"/>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI label="WEEK · NEW"      val="128" delta="+18%" deltaSub="VS PREV WK" trend={[18,22,16,24,28,32,40,44,52,60,72,88]} accent={ACCENT.primary}/>
        <KPI label="APPROVAL RATE"   val="71%" delta="+3 pts" deltaSub="VS APR"   trend={[55,58,60,62,64,66,68,70,71,71,72,71]}/>
        <KPI label="AVG TIME · QUEUE" val="34h" delta="−6h" deltaSub="IMPROVING" trend={[48,46,44,42,42,40,38,38,36,36,34,34]}/>
        <KPI label="VOUCHED %"       val="62%" delta="+8 pts" deltaSub="GROWING" trend={[40,42,46,50,52,54,56,58,60,60,62,62]}/>
      </div>

      <Card title="DAILY · 30D" sub="Approved / pending / rejected">
        <SignupBarChart big/>
      </Card>

      <Grid2>
        <Card title="BY REGION" sub="Where members live">
          <RegionList/>
        </Card>
        <Card title="BY DRIVE" sub="Primary chassis tag">
          <DriveBreakdown/>
        </Card>
      </Grid2>
    </div>
  );
}

// ─── Page: Traffic ────────────────────────────────────────────────────
function Traffic() {
  return (
    <div>
      <PageHeader label="TRAFFIC" sub="Visitors → invite views → submissions"/>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI label="VISITS · 7D"   val="42,118" delta="+18.2%" deltaSub="WoW" trend={[3,4,3,5,7,8,9,10,11,12,13,14]} accent={ACCENT.primary}/>
        <KPI label="INVITE OPENS"  val="3,842" delta="+12%" deltaSub="9.1% RATE" trend={[2,3,3,4,4,5,5,6,6,7,7,8]}/>
        <KPI label="SUBMITTED"     val="412" delta="+22" deltaSub="LAST 24H" trend={[2,3,4,5,6,8,9,12,14,16,18,22]}/>
        <KPI label="BOUNCE"        val="38%" delta="−4 pts" deltaSub="HEALTHIER" trend={[48,46,44,42,42,40,40,38,38,38,38,38]}/>
      </div>

      <Card title="FUNNEL · INVITE → MEMBER" sub="Last 30 days">
        <Funnel/>
      </Card>

      <Grid2>
        <Card title="SOURCES" sub="UTM + referrer">
          <TrafficBars detailed/>
        </Card>
        <Card title="DEVICES" sub="iOS-first product">
          <DeviceBreakdown/>
        </Card>
      </Grid2>
    </div>
  );
}

// ─── Page: Approvals queue ────────────────────────────────────────────
function Approvals() {
  return (
    <div>
      <PageHeader label="APPROVALS QUEUE" sub="47 pending · oldest 38h"/>

      <Card title="" sub="" pad={0}>
        <div style={{ display: 'grid', gap: 0 }}>
          {APPROVAL_FULL.map(a => <QueueRowFull key={a.id} a={a}/>)}
        </div>
      </Card>
    </div>
  );
}

// ─── Page: Store ops ──────────────────────────────────────────────────
function StoreOps() {
  const orders = [
    { id: 'UG-2638-Q', who: '@NOVA_K',   total: 256, items: 4, status: 'PAID',     when: '2 MIN' },
    { id: 'UG-2637-Q', who: '@HEXBOX',   total: 95,  items: 1, status: 'SHIPPED',  when: '14 MIN' },
    { id: 'UG-2636-Q', who: '@KOSAKI',   total: 142, items: 2, status: 'PAID',     when: '32 MIN' },
    { id: 'UG-2635-Q', who: '@LATEAPEX', total: 80,  items: 1, status: 'REFUND',   when: '1H' },
    { id: 'UG-2634-Q', who: '@M_VOLT',   total: 220, items: 1, status: 'PRE-ORD',  when: '2H' },
  ];
  return (
    <div>
      <PageHeader label="STORE · ORDERS" sub="Drop 02 · revenue + fulfillment"/>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI label="REVENUE · MTD"   val="$18,420" delta="+$2,140" deltaSub="VS APR" trend={[200,260,300,320,400,520,580,640,720,820,900,940]} accent={ACCENT.primary}/>
        <KPI label="ORDERS"          val="284" delta="+38" deltaSub="THIS WK" trend={[8,12,14,18,22,28,32,38,42,48,52,58]}/>
        <KPI label="AVG ORDER"       val="$64.85" delta="+$4.20" deltaSub="UPTREND" trend={[55,56,58,58,60,60,62,62,64,64,65,65]}/>
        <KPI label="FULFILL · AVG"   val="2.1d" delta="−0.4d" deltaSub="FASTER" trend={[3.2,3,2.8,2.6,2.6,2.4,2.3,2.2,2.1,2.1,2.1,2.1]}/>
      </div>

      <Card title="RECENT ORDERS" sub="Drop 02 · last 24h" right={<a href="#" style={linkStyle()}>EXPORT CSV →</a>}>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {orders.map((o, i) => (
            <div key={o.id} className="modd-row" style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 12, padding: '12px 16px',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
              alignItems: 'center',
            }}>
              <div>
                <Mono size={11} color="#f5f6f7" weight={700} spacing="0.14em">{o.id}</Mono>
                <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }}>
                  {o.who} · {o.items} ITEM{o.items > 1 ? 'S' : ''} · {o.when} AGO
                </Mono>
              </div>
              <StatusPill status={o.status}/>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700,
                color: ACCENT.primary, fontVariantNumeric: 'tabular-nums',
              }}>${o.total}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    PAID:    { c: ACCENT.primary, bg: ACCENT.soft },
    SHIPPED: { c: '#5bbeff', bg: 'rgba(91,190,255,0.12)' },
    REFUND:  { c: 'rgba(201,204,209,0.55)', bg: 'rgba(201,204,209,0.08)' },
    'PRE-ORD': { c: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  };
  const m = map[status] || map.PAID;
  return (
    <span style={{
      padding: '3px 8px', background: m.bg,
      border: `0.5px solid ${m.c}`,
    }}>
      <Mono size={8.5} color={m.c} weight={700} spacing="0.22em">{status}</Mono>
    </span>
  );
}

// ─── Page: Payouts ────────────────────────────────────────────────────
function Payouts() {
  const lines = [
    { who: 'STRIPE',     desc: 'Payouts · auto · weekly',          amt: '+$14,802',  when: '2026.04.21' },
    { who: 'PRINTSHOP',  desc: 'Drop 02 · 412 units',                amt: '−$2,180',   when: '2026.04.18' },
    { who: 'VENUE',      desc: 'Operation: Nightfall · pier 91',     amt: '−$3,200',   when: '2026.04.15' },
    { who: 'TWILIO',     desc: 'SMS verify · April',                 amt: '−$184',     when: '2026.04.30' },
    { who: 'STRIPE',     desc: 'Payouts · auto · weekly',          amt: '+$11,420',  when: '2026.04.14' },
  ];
  return (
    <div>
      <PageHeader label="PAYOUTS" sub="Cashflow · platform expenses"/>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI label="BALANCE"  val="$48,260" delta="+$26,240" deltaSub="MTD" trend={[10,12,14,16,18,22,28,32,38,42,46,48]} accent={ACCENT.primary}/>
        <KPI label="REVENUE · MTD" val="$18,420" delta="STORE + DUES" deltaSub=""/>
        <KPI label="EXPENSES · MTD" val="$5,564" delta="OPS + INFRA" deltaSub=""/>
        <KPI label="NEXT PAYOUT" val="04.28" delta="$11,420 EST." deltaSub="STRIPE AUTO"/>
      </div>

      <Card title="LEDGER" sub="Last 5 movements" right={<a href="#" style={linkStyle()}>OPEN STRIPE →</a>}>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {lines.map((l, i) => (
            <div key={i} className="modd-row" style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              gap: 8, padding: '12px 16px',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
              alignItems: 'center',
            }}>
              <div>
                <Mono size={11} color="#f5f6f7" weight={700} spacing="0.16em">{l.who}</Mono>
                <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }}>{l.desc} · {l.when}</Mono>
              </div>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700,
                color: l.amt.startsWith('+') ? ACCENT.primary : 'rgba(201,204,209,0.7)',
                fontVariantNumeric: 'tabular-nums',
              }}>{l.amt}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Generic placeholder ─────────────────────────────────────────────
function PlaceholderPane({ label, sub, stat }) {
  return (
    <div>
      <PageHeader label={label} sub={sub}/>
      <Card title="" sub="" pad={0}>
        <div style={{ padding: 'clamp(28px, 6vw, 60px)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <Mono size={9} color={ACCENT.primary} spacing="0.3em">∕∕ COMING ONLINE</Mono>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 700,
            color: '#f5f6f7', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
          }}>{stat}</div>
          <Mono size={10} color="rgba(201,204,209,0.5)" spacing="0.18em">{sub}</Mono>
        </div>
      </Card>
    </div>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────
function PageHeader({ label, sub }) {
  return (
    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <div>
        <Mono size={9.5} color={ACCENT.primary} spacing="0.3em">∕∕ {label}</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 'clamp(22px, 3.6vw, 30px)', fontWeight: 700,
          color: '#f5f6f7', margin: '6px 0 0', letterSpacing: '-0.02em',
        }}>{sub}</h1>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['24H','7D','30D','MTD','ALL'].map((r, i) => (
          <button key={r} style={{
            appearance: 'none', padding: '5px 9px', cursor: 'pointer',
            background: i === 2 ? ACCENT.primary : 'transparent',
            border: `0.5px solid ${i === 2 ? ACCENT.primary : 'rgba(255,255,255,0.12)'}`,
          }}>
            <Mono size={9} color={i === 2 ? '#05060a' : 'rgba(201,204,209,0.65)'} weight={700} spacing="0.2em">{r}</Mono>
          </button>
        ))}
      </div>
    </div>
  );
}

function Card({ title, sub, right, children, pad = 16 }) {
  return (
    <div className="modd-card" style={{
      background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
      marginTop: 14, position: 'relative',
    }}>
      {(title || right) && (
        <div style={{
          padding: `${pad === 0 ? 14 : pad}px ${pad === 0 ? 16 : pad}px`,
          paddingBottom: pad === 0 ? 12 : 0,
          borderBottom: pad === 0 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
        }}>
          <div>
            <Mono size={10.5} color="#f5f6f7" weight={700} spacing="0.22em">{title}</Mono>
            {sub && <Mono size={9} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 2 }}>{sub}</Mono>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return (
    <div style={{
      display: 'grid', gap: 14, marginTop: 4,
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
    }}>{children}</div>
  );
}

function KPI({ label, val, delta, deltaSub, trend, accent, hot }) {
  const c = accent || '#f5f6f7';
  return (
    <div className="modd-card" style={{
      background: '#0a0b10', border: `0.5px solid ${hot ? 'rgba(255,42,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
      padding: '14px 14px', position: 'relative', overflow: 'hidden',
      boxShadow: hot ? `0 0 18px ${ACCENT.soft}` : 'none',
    }}>
      <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">{label}</Mono>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 'clamp(22px, 3.6vw, 30px)', fontWeight: 700,
        color: c, marginTop: 6, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em',
      }}>{val}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <Mono size={9.5} color={ACCENT.primary} weight={700} spacing="0.16em">{delta}</Mono>
        {deltaSub && <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.18em">{deltaSub}</Mono>}
      </div>
      {trend && (
        <div style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.85 }}>
          <Spark data={trend} accent={hot ? ACCENT.primary : (accent || ACCENT.primary)}/>
        </div>
      )}
    </div>
  );
}

function Spark({ data, accent }) {
  const W = 70, H = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="square"/>
      <circle cx={W} cy={H - ((data[data.length-1] - min) / range) * (H - 4) - 2} r="1.6" fill={accent}/>
    </svg>
  );
}

// ─── Charts: signups bar, traffic bars, regions, etc ─────────────────
function SignupBarChart({ big }) {
  const days = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const seed = (i * 73 + 11) % 100;
      const total = 8 + (seed % 14) + (i > 22 ? 4 : 0);
      const approved = Math.round(total * (0.55 + ((seed % 30) / 100)));
      const rejected = Math.round((total - approved) * 0.4);
      const pending = total - approved - rejected;
      return { approved, pending, rejected };
    });
  }, []);
  const max = Math.max(...days.map(d => d.approved + d.pending + d.rejected));
  const H = big ? 200 : 120;

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: H, paddingTop: 4 }}>
      {days.map((d, i) => {
        const tot = d.approved + d.pending + d.rejected;
        const h = (tot / max) * (H - 4);
        const ah = (d.approved / tot) * h;
        const ph = (d.pending  / tot) * h;
        const rh = (d.rejected / tot) * h;
        return (
          <div key={i} title={`Day ${i+1}: ${tot}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minWidth: 0 }}>
            <div style={{ width: '100%', height: rh, background: 'rgba(255,255,255,0.18)' }}/>
            <div style={{ width: '100%', height: ph, background: 'rgba(201,204,209,0.6)' }}/>
            <div style={{ width: '100%', height: ah, background: ACCENT.primary, boxShadow: i >= days.length - 3 ? `0 0 6px ${ACCENT.glow}` : 'none' }}/>
          </div>
        );
      })}
    </div>
  );
}

const SOURCES = [
  { name: 'INSTAGRAM',  pct: 38, n: 1082 },
  { name: 'WORD-OF-MOUTH', pct: 24, n: 684 },
  { name: 'TIKTOK',     pct: 16, n: 456 },
  { name: 'PRINT QR',   pct: 9,  n: 256 },
  { name: 'CAR MEETS',  pct: 8,  n: 228 },
  { name: 'PRESS',      pct: 5,  n: 142 },
];

function TrafficBars({ detailed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {SOURCES.map((s, i) => (
        <div key={s.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
            <Mono size={10} color="#f5f6f7" weight={700} spacing="0.18em">{s.name}</Mono>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              {detailed && <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.14em">{s.n}</Mono>}
              <Mono size={10} color={i === 0 ? ACCENT.primary : '#f5f6f7'} weight={700}>{s.pct}%</Mono>
            </div>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, width: `${s.pct * 2.4}%`,
              maxWidth: '100%',
              background: i === 0 ? ACCENT.primary : `rgba(255,42,42,${0.7 - i * 0.1})`,
              boxShadow: i === 0 ? `0 0 8px ${ACCENT.glow}` : 'none',
            }}/>
            {/* tick markers */}
            {[20,40,60,80].map(t => (
              <div key={t} style={{ position: 'absolute', left: `${t}%`, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.4)' }}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionList() {
  const regions = [
    { code: 'PNW-03', city: 'SEATTLE',     n: 412, pct: 14 },
    { code: 'CA-02',  city: 'LOS ANGELES', n: 388, pct: 13 },
    { code: 'NY-01',  city: 'NEW YORK',    n: 326, pct: 11 },
    { code: 'TX-04',  city: 'AUSTIN',      n: 224, pct: 8 },
    { code: 'IL-01',  city: 'CHICAGO',     n: 208, pct: 7 },
    { code: 'FL-02',  city: 'MIAMI',       n: 196, pct: 7 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {regions.map((r, i) => (
        <div key={r.code} className="modd-row" style={{
          display: 'grid', gridTemplateColumns: '60px 1fr auto auto',
          gap: 12, padding: '8px 0',
          borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}>
          <Mono size={10} color={ACCENT.primary} weight={700} spacing="0.18em">{r.code}</Mono>
          <Mono size={10} color="#f5f6f7" weight={500} spacing="0.14em">{r.city}</Mono>
          <Mono size={10} color="rgba(201,204,209,0.6)" weight={700}>{r.n}</Mono>
          <Mono size={9.5} color={ACCENT.primary} weight={700}>{r.pct}%</Mono>
        </div>
      ))}
    </div>
  );
}

function DriveBreakdown() {
  const drives = [
    { label: 'JDM',  n: 1042, pct: 37, color: ACCENT.primary },
    { label: 'EURO', n: 754,  pct: 26, color: '#5bbeff' },
    { label: 'USDM', n: 612,  pct: 21, color: '#ffd700' },
    { label: 'EV',   n: 268,  pct: 9,  color: '#c47dff' },
    { label: 'MISC', n: 171,  pct: 6,  color: 'rgba(201,204,209,0.5)' },
  ];
  return (
    <div>
      {/* stacked bar */}
      <div style={{ height: 24, display: 'flex', overflow: 'hidden' }}>
        {drives.map(d => <div key={d.label} title={`${d.label}: ${d.n}`} style={{ width: `${d.pct}%`, background: d.color }}/>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 14 }}>
        {drives.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, background: d.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Mono size={10} color="#f5f6f7" weight={700} spacing="0.16em">{d.label}</Mono>
              <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.14em" style={{ display: 'block' }}>{d.n} · {d.pct}%</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviceBreakdown() {
  const ds = [
    { label: 'IOS',     pct: 78, n: 32852 },
    { label: 'ANDROID', pct: 16, n: 6739 },
    { label: 'WEB',     pct: 6,  n: 2527 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ds.map((d, i) => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Mono size={10} color="#f5f6f7" weight={700} spacing="0.18em">{d.label}</Mono>
            <Mono size={10} color={i === 0 ? ACCENT.primary : '#f5f6f7'} weight={700}>{d.pct}%</Mono>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: '100%', width: `${d.pct}%`,
              background: i === 0 ? ACCENT.primary : `rgba(91,190,255,${0.7 - i * 0.2})` }}/>
          </div>
          <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.14em" style={{ display: 'block', marginTop: 2 }}>{d.n.toLocaleString()} VISITORS · 7D</Mono>
        </div>
      ))}
    </div>
  );
}

function Funnel() {
  const stages = [
    { label: 'INVITE OPENED', n: 3842, pct: 100 },
    { label: 'IDENTITY DONE', n: 2218, pct: 58 },
    { label: 'PHOTOS UPLOADED', n: 1284, pct: 33 },
    { label: 'PHONE VERIFIED',  n: 942,  pct: 25 },
    { label: 'APPROVED',        n: 412,  pct: 11 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stages.map((s, i) => (
        <div key={s.label} style={{
          display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 80px 60px',
          gap: 10, alignItems: 'center', padding: '8px 0',
          borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ position: 'relative', height: 22, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{
              position: 'absolute', inset: 0, width: `${s.pct}%`,
              background: i === stages.length - 1 ? ACCENT.primary : `rgba(255,42,42,${0.85 - i * 0.15})`,
              boxShadow: i === stages.length - 1 ? `0 0 8px ${ACCENT.glow}` : 'none',
              display: 'flex', alignItems: 'center', paddingLeft: 8,
            }}>
              <Mono size={9} color="#05060a" weight={700} spacing="0.18em">{s.label}</Mono>
            </div>
          </div>
          <Mono size={10} color="#f5f6f7" weight={700} spacing="0.14em">{s.n.toLocaleString()}</Mono>
          <Mono size={10} color={ACCENT.primary} weight={700} spacing="0.16em">{s.pct}%</Mono>
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, background: color }}/>
      <Mono size={9} color="rgba(201,204,209,0.6)" spacing="0.18em">{label}</Mono>
    </div>
  );
}

// ─── Approvals queue rows ────────────────────────────────────────────
const APPROVAL_PREVIEW = [
  { id: 'q-0247', user: '@APEX_11',   car: '2003 EVO VIII',         age: '38H', vouches: 4, ig: '12K', priority: 'HOT' },
  { id: 'q-0246', user: '@TWINSPARK', car: '1991 BMW M3 SPORT EVO', age: '24H', vouches: 7, ig: '38K', priority: 'HOT' },
  { id: 'q-0245', user: '@LATEAPEX',  car: '2003 MUSTANG COBRA',    age: '14H', vouches: 2, ig: '4.2K', priority: '' },
  { id: 'q-0244', user: '@SILVERS',   car: '2002 NISSAN SILVIA S15',age: '6H',  vouches: 3, ig: '8.4K', priority: '' },
];
const APPROVAL_FULL = [...APPROVAL_PREVIEW,
  { id: 'q-0243', user: '@KOSAKI',    car: '1993 MAZDA RX-7 FD',    age: '4H',  vouches: 5, ig: '22K',  priority: '' },
  { id: 'q-0242', user: '@HEXBOX',    car: '1989 BMW M3 (E30)',     age: '3H',  vouches: 1, ig: '1.8K', priority: 'LOW' },
  { id: 'q-0241', user: '@M_VOLT',    car: '2024 RIVIAN R1S',       age: '2H',  vouches: 0, ig: '——',   priority: 'LOW' },
];

function QueueRow({ a }) {
  return (
    <div className="modd-row" style={{
      display: 'grid', gridTemplateColumns: '1fr auto',
      gap: 10, padding: '10px 14px',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)', alignItems: 'center', cursor: 'pointer',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Mono size={10} color="#f5f6f7" weight={700} spacing="0.16em">{a.user}</Mono>
          {a.priority === 'HOT' && (
            <span style={{ padding: '1px 4px', background: ACCENT.primary }}>
              <Mono size={7.5} color="#05060a" weight={700} spacing="0.2em">{a.priority}</Mono>
            </span>
          )}
        </div>
        <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }}>
          {a.car} · {a.vouches} VOUCH{a.vouches !== 1 ? 'ES' : ''} · {a.age}
        </Mono>
      </div>
      <svg width="11" height="11" viewBox="0 0 14 14"><path d="M5 2l6 5-6 5" stroke={ACCENT.primary} strokeWidth="1.5" fill="none"/></svg>
    </div>
  );
}

function QueueRowFull({ a }) {
  return (
    <div className="modd-row" style={{
      display: 'grid', gridTemplateColumns: '36px minmax(120px, 1.4fr) minmax(0, 1fr) 70px 90px 200px',
      gap: 10, padding: '12px 16px', alignItems: 'center',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
    }} className="modd-row modd-queue-full">
      <div style={{
        width: 36, height: 36, position: 'relative',
        background: `repeating-linear-gradient(135deg, #0a0b10 0 5px, #13141a 5px 6px)`,
        border: `0.5px solid ${ACCENT.primary}`,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 60%, ${ACCENT.soft}, transparent 70%)` }}/>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mono size={10.5} color="#f5f6f7" weight={700} spacing="0.16em">{a.user}</Mono>
          {a.priority === 'HOT' && <span style={{ padding: '1px 4px', background: ACCENT.primary }}>
            <Mono size={7.5} color="#05060a" weight={700} spacing="0.2em">{a.priority}</Mono>
          </span>}
          {a.priority === 'LOW' && <span style={{ padding: '1px 4px', background: 'rgba(201,204,209,0.1)', border: '0.5px solid rgba(201,204,209,0.3)' }}>
            <Mono size={7.5} color="rgba(201,204,209,0.6)" weight={700} spacing="0.2em">{a.priority}</Mono>
          </span>}
        </div>
        <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }} spacing="0.16em">{a.id} · {a.age}</Mono>
      </div>
      <div className="modd-q-car">
        <Mono size={10} color="rgba(201,204,209,0.85)" weight={500} spacing="0.12em">{a.car}</Mono>
      </div>
      <div className="modd-q-vouch">
        <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.18em">VOUCH</Mono>
        <Mono size={11} color={a.vouches >= 3 ? ACCENT.primary : '#f5f6f7'} weight={700} style={{ display: 'block' }}>{a.vouches}</Mono>
      </div>
      <div className="modd-q-ig">
        <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.18em">IG</Mono>
        <Mono size={11} color="#f5f6f7" weight={700} style={{ display: 'block' }}>{a.ig}</Mono>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button style={btnGhost()}>VIEW</button>
        <button style={btnReject()}>REJECT</button>
        <button style={btnApprove()}>APPROVE</button>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .modd-queue-full { grid-template-columns: 36px 1fr !important; row-gap: 10px !important; }
          .modd-queue-full .modd-q-car,
          .modd-queue-full .modd-q-vouch,
          .modd-queue-full .modd-q-ig { grid-column: 1 / -1; padding-left: 46px; display: flex; gap: 8px; align-items: baseline; }
          .modd-queue-full > div:last-child { grid-column: 1 / -1; padding-left: 46px; justify-content: flex-start !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Activity feed ───────────────────────────────────────────────────
const ACTIVITY = [
  { ts: 'NOW',  c: ACCENT.primary, t: '@HEXBOX submitted', d: '1989 BMW M3 (E30)' },
  { ts: '2M',   c: '#5bbeff',      t: '@KOSAKI vouched',   d: 'for @APEX_11' },
  { ts: '4M',   c: ACCENT.primary, t: 'Order placed',      d: 'UG-2638-Q · $256' },
  { ts: '6M',   c: 'rgba(201,204,209,0.5)', t: '@LATEAPEX uploaded photos', d: '3 / 3 EXTERIOR · INTERIOR · ENGINE' },
  { ts: '11M',  c: '#5bbeff',      t: 'RSVP confirmed',    d: 'NIGHTFALL · 47 / 60' },
  { ts: '14M',  c: ACCENT.primary, t: 'New flag',          d: '@FAKEBUILD reported by @NOVA_K' },
  { ts: '18M',  c: 'rgba(201,204,209,0.5)', t: '@M_VOLT verified phone', d: '+1 ··· 8821' },
];

function ActivityFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto' }} className="no-scrollbar">
      {ACTIVITY.map((a, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '50px 1fr',
          gap: 10, padding: '10px 0',
          borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: a.c, borderRadius: '50%', boxShadow: a.c === ACCENT.primary ? `0 0 4px ${a.c}` : 'none' }}/>
            <Mono size={9} color="rgba(201,204,209,0.55)" weight={700} spacing="0.14em">{a.ts}</Mono>
          </div>
          <div style={{ minWidth: 0 }}>
            <Mono size={10} color="#f5f6f7" weight={700} spacing="0.12em">{a.t}</Mono>
            <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 1 }} spacing="0.1em">{a.d}</Mono>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────
function iconBtn() {
  return {
    appearance: 'none', width: 30, height: 30,
    background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}
function btnGhost() {
  return {
    appearance: 'none', padding: '5px 9px', cursor: 'pointer',
    background: 'transparent', border: '0.5px solid rgba(255,255,255,0.18)',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
    letterSpacing: '0.2em', color: 'rgba(201,204,209,0.7)',
  };
}
function btnReject() {
  return { ...btnGhost(), borderColor: 'rgba(255,42,42,0.35)', color: ACCENT.primary };
}
function btnApprove() {
  return {
    appearance: 'none', padding: '5px 9px', cursor: 'pointer',
    background: ACCENT.primary, border: 'none', color: '#05060a',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
    letterSpacing: '0.2em',
    boxShadow: `0 0 12px ${ACCENT.soft}`,
  };
}
function linkStyle() {
  return {
    fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700,
    color: ACCENT.primary, textDecoration: 'none', letterSpacing: '0.2em',
  };
}

// ─── Sidebar icons ───────────────────────────────────────────────────
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3 };
function IconGrid()    { return <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="4" height="4" {...stroke}/><rect x="8" y="2" width="4" height="4" {...stroke}/><rect x="2" y="8" width="4" height="4" {...stroke}/><rect x="8" y="8" width="4" height="4" {...stroke}/></svg>; }
function IconChart()   { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 12V4M6 12V8M10 12V2M2 12h11" {...stroke}/></svg>; }
function IconTraffic() { return <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" {...stroke}/><path d="M7 2v5l3 3" {...stroke}/></svg>; }
function IconCheck()   { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l3 3 7-7" {...stroke}/></svg>; }
function IconFlag()    { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 12V2h7l-1.5 3L10 8H3" {...stroke}/></svg>; }
function IconNet()     { return <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="3" r="1.5" {...stroke}/><circle cx="3" cy="11" r="1.5" {...stroke}/><circle cx="11" cy="11" r="1.5" {...stroke}/><path d="M7 4.5v3M5.5 10L4.5 8M8.5 10L9.5 8" {...stroke}/></svg>; }
function IconPin()     { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2c2 0 3.5 1.6 3.5 3.5S7 12 7 12 3.5 7.4 3.5 5.5 5 2 7 2z" {...stroke}/><circle cx="7" cy="5.5" r="1" {...stroke}/></svg>; }
function IconBag()     { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 5h8l-1 7H4z M5 5V3a2 2 0 014 0v2" {...stroke}/></svg>; }
function IconCash()    { return <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="4" width="10" height="6" {...stroke}/><circle cx="7" cy="7" r="1.5" {...stroke}/></svg>; }
function IconLog()     { return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 2h6l2 2v8H3z M5 6h4M5 8h4M5 10h2.5" {...stroke}/></svg>; }
function IconUsers()   { return <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="5" cy="5" r="2" {...stroke}/><path d="M2 12c0-2 1.5-3 3-3s3 1 3 3" {...stroke}/><circle cx="10" cy="6" r="1.6" {...stroke}/><path d="M8.5 12c0-1.6 1-2.5 2.5-2.5s2 .9 2 2" {...stroke}/></svg>; }
function IconKey()     { return <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="4" cy="9" r="2.2" {...stroke}/><path d="M6 8l5-5M9 5l1.5 1.5M11 3l1.2 1.2" {...stroke}/></svg>; }

// ─── Role switcher (header pill) ─────────────────────────────────────
function RoleSwitcher({ role, setRole }) {
  return (
    <div className="modd-roleswitch" style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px', background: '#0a0b10',
      border: '0.5px dashed rgba(255,255,255,0.18)',
      flexShrink: 0, marginRight: 4,
    }} title="Demo · switch role to preview permissions">
      {[
        { id: 'owner', label: 'OWNER', color: '#ffd700' },
        { id: 'mod',   label: 'MOD',   color: ACCENT.primary },
      ].map(r => (
        <button key={r.id} onClick={() => setRole(r.id)} style={{
          appearance: 'none', cursor: 'pointer',
          padding: '4px 8px',
          background: role === r.id ? r.color : 'transparent',
          border: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, fontWeight: 700,
          letterSpacing: '0.22em',
          color: role === r.id ? '#05060a' : 'rgba(201,204,209,0.6)',
        }}>{r.label}</button>
      ))}
    </div>
  );
}

// ─── Page: Users (owner only) ────────────────────────────────────────
function UsersPage() {
  const [filter, setFilter] = React.useState('ALL');
  const users = [
    { user: '@R_APEX',     car: '1995 R33 GT-R',           role: 'OWNER',  joined: '2024.11.02', last: 'NOW',   vouches: 12, status: 'ACTIVE' },
    { user: '@NOVA_K',     car: '2002 EVO VII',            role: 'MOD',    joined: '2024.12.18', last: '4M',    vouches: 9,  status: 'ACTIVE' },
    { user: '@TWINSPARK',  car: '1991 BMW M3 SPORT EVO',   role: 'MOD',    joined: '2025.01.04', last: '2H',    vouches: 7,  status: 'ACTIVE' },
    { user: '@KOSAKI',     car: '1993 MAZDA RX-7 FD',      role: 'MEMBER', joined: '2025.02.11', last: '14M',   vouches: 5,  status: 'ACTIVE' },
    { user: '@HEXBOX',     car: '1989 BMW M3 (E30)',       role: 'MEMBER', joined: '2025.03.22', last: '1H',    vouches: 1,  status: 'ACTIVE' },
    { user: '@LATEAPEX',   car: '2003 MUSTANG COBRA',      role: 'MEMBER', joined: '2026.01.19', last: '38M',   vouches: 2,  status: 'PROBATION' },
    { user: '@FAKEBUILD',  car: '——',                       role: 'MEMBER', joined: '2026.02.04', last: '4D',    vouches: 0,  status: 'SUSPENDED' },
    { user: '@SILVERS',    car: '2002 NISSAN SILVIA S15',  role: 'MEMBER', joined: '2026.03.12', last: '6H',    vouches: 3,  status: 'ACTIVE' },
    { user: '@APEX_11',    car: '2003 EVO VIII',           role: 'PEND.',  joined: '2026.04.18', last: '38H',   vouches: 4,  status: 'PENDING' },
  ];
  const shown = filter === 'ALL' ? users : users.filter(u => u.status === filter || u.role === filter);

  return (
    <div>
      <PageHeader label="USERS" sub="2,847 members · manage access + status"/>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI label="ACTIVE"     val="2,792" delta="98%" deltaSub="OF TOTAL" trend={[80,82,84,86,88,90,92,94,96,97,98,98]} accent={ACCENT.primary}/>
        <KPI label="PROBATION"  val="42"    delta="+8"  deltaSub="WATCHING" trend={[28,30,32,34,36,38,40,40,41,42,42,42]}/>
        <KPI label="SUSPENDED"  val="13"    delta="+2"  deltaSub="LAST 30D" trend={[8,9,10,10,11,11,12,12,12,13,13,13]}/>
        <KPI label="STAFF"      val="06"    delta="01 OWNER · 05 MODS" deltaSub="" trend={[3,3,4,4,4,5,5,5,5,6,6,6]}/>
      </div>

      <Card title="DIRECTORY" sub="Tap a user to manage" right={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL','ACTIVE','PROBATION','SUSPENDED','PENDING','MOD','OWNER'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              appearance: 'none', padding: '4px 8px', cursor: 'pointer',
              background: filter === f ? ACCENT.primary : 'transparent',
              border: `0.5px solid ${filter === f ? ACCENT.primary : 'rgba(255,255,255,0.12)'}`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, fontWeight: 700,
              letterSpacing: '0.2em', color: filter === f ? '#05060a' : 'rgba(201,204,209,0.6)',
            }}>{f}</button>
          ))}
        </div>
      } pad={0}>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {shown.map((u, i) => <UserRow key={u.user} u={u}/>)}
        </div>
      </Card>
    </div>
  );
}

function UserRow({ u }) {
  const roleColor = u.role === 'OWNER' ? '#ffd700' : u.role === 'MOD' ? ACCENT.primary : 'rgba(201,204,209,0.5)';
  const statusColor = u.status === 'ACTIVE' ? ACCENT.primary
    : u.status === 'PROBATION' ? '#ffd700'
    : u.status === 'SUSPENDED' ? 'rgba(201,204,209,0.5)'
    : '#5bbeff';
  return (
    <div className="modd-row modd-userrow" style={{
      display: 'grid', gridTemplateColumns: '32px minmax(120px,1.3fr) minmax(0,1fr) 80px 80px 80px 220px',
      gap: 10, padding: '12px 16px', alignItems: 'center',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${roleColor}, #1a0606)`,
        border: `0.5px solid ${roleColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Inter Tight", sans-serif', fontSize: 12, fontWeight: 700, color: '#f5f6f7',
      }}>{u.user[1]}</div>
      <div>
        <Mono size={10.5} color="#f5f6f7" weight={700} spacing="0.16em">{u.user}</Mono>
        <Mono size={9} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 2 }} spacing="0.14em">JOINED {u.joined}</Mono>
      </div>
      <Mono size={10} color="rgba(201,204,209,0.85)" weight={500} spacing="0.12em" className="modd-u-car">{u.car}</Mono>
      <span style={{
        padding: '3px 7px', justifySelf: 'start',
        background: `${roleColor}22`, border: `0.5px solid ${roleColor}`,
      }} className="modd-u-role">
        <Mono size={8.5} color={roleColor} weight={700} spacing="0.22em">{u.role}</Mono>
      </span>
      <div className="modd-u-stat">
        <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.18em">VOUCH</Mono>
        <Mono size={11} color="#f5f6f7" weight={700} style={{ display: 'block' }}>{u.vouches}</Mono>
      </div>
      <div className="modd-u-stat">
        <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.18em">LAST</Mono>
        <Mono size={11} color="#f5f6f7" weight={700} style={{ display: 'block' }}>{u.last}</Mono>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{
          padding: '3px 7px', background: `${statusColor}1f`, border: `0.5px solid ${statusColor}`,
        }}>
          <Mono size={8.5} color={statusColor} weight={700} spacing="0.22em">{u.status}</Mono>
        </span>
        <button style={btnGhost()}>VIEW</button>
        <button style={btnGhost()}>···</button>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .modd-userrow { grid-template-columns: 32px 1fr !important; row-gap: 8px !important; }
          .modd-userrow .modd-u-car,
          .modd-userrow .modd-u-role,
          .modd-userrow .modd-u-stat { grid-column: 1 / -1; padding-left: 42px; }
          .modd-userrow .modd-u-stat { display: flex; gap: 8px; align-items: baseline; }
          .modd-userrow > div:last-child { grid-column: 1 / -1; padding-left: 42px; justify-content: flex-start !important; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}

// ─── Page: Roles · staff (owner only) ────────────────────────────────
function RolesPage() {
  const staff = [
    { user: '@R_APEX',    role: 'OWNER',  since: '2024.11', perms: 'ALL · INCL. FINANCIALS', color: '#ffd700' },
    { user: '@NOVA_K',    role: 'MOD · TIER 02', since: '2024.12', perms: 'QUEUE · MEETS · FLAGS', color: ACCENT.primary },
    { user: '@TWINSPARK', role: 'MOD · TIER 02', since: '2025.01', perms: 'QUEUE · MEETS · FLAGS', color: ACCENT.primary },
    { user: '@KOSAKI',    role: 'MOD · TIER 03', since: '2025.04', perms: 'QUEUE · VOUCHES',       color: ACCENT.primary },
    { user: '@SILVERS',   role: 'MOD · TIER 03', since: '2025.07', perms: 'QUEUE · VOUCHES',       color: ACCENT.primary },
    { user: '@APEX_S',    role: 'MOD · TIER 03', since: '2026.01', perms: 'QUEUE',                 color: ACCENT.primary },
  ];
  const matrix = [
    { p: 'View overview / signups / traffic',  owner: true, mod: true },
    { p: 'Approve / reject members',            owner: true, mod: true },
    { p: 'Manage flags + vouches',              owner: true, mod: true },
    { p: 'Run meets · RSVP · venue',            owner: true, mod: true },
    { p: 'View store revenue + orders',         owner: true, mod: false },
    { p: 'View payouts + ledger',               owner: true, mod: false },
    { p: 'Refund / cancel orders',              owner: true, mod: false },
    { p: 'Suspend / restore members',           owner: true, mod: false },
    { p: 'Promote / demote staff',              owner: true, mod: false },
    { p: 'Edit invite caps + drop schedule',    owner: true, mod: false },
  ];
  return (
    <div>
      <PageHeader label="ROLES · STAFF" sub="Who has the keys"/>

      <Card title="STAFF" sub="06 active" right={<button style={btnApprove()}>+ INVITE STAFF</button>} pad={0}>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {staff.map(s => (
            <div key={s.user} className="modd-row" style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
              gap: 12, padding: '12px 16px', alignItems: 'center',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${s.color}, #1a0606)`,
                border: `0.5px solid ${s.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Inter Tight", sans-serif', fontSize: 12, fontWeight: 700, color: '#f5f6f7',
              }}>{s.user[1]}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Mono size={11} color="#f5f6f7" weight={700} spacing="0.16em">{s.user}</Mono>
                  <span style={{ padding: '2px 6px', background: `${s.color}22`, border: `0.5px solid ${s.color}` }}>
                    <Mono size={8.5} color={s.color} weight={700} spacing="0.22em">{s.role}</Mono>
                  </span>
                </div>
                <Mono size={9} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 3 }} spacing="0.14em">SINCE {s.since} · {s.perms}</Mono>
              </div>
              <button style={btnGhost()}>EDIT</button>
              <button style={btnGhost()}>···</button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="PERMISSION MATRIX" sub="What each role can do">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0 }}>
          <div style={{ padding: '8px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>
            <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em">CAPABILITY</Mono>
          </div>
          <div style={{ padding: '8px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.18)', textAlign: 'center' }}>
            <Mono size={9} color="#ffd700" weight={700} spacing="0.22em">OWNER</Mono>
          </div>
          <div style={{ padding: '8px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.18)', textAlign: 'center' }}>
            <Mono size={9} color={ACCENT.primary} weight={700} spacing="0.22em">MOD</Mono>
          </div>
          {matrix.map((row, i) => (
            <React.Fragment key={i}>
              <div style={{ padding: '10px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <Mono size={10} color="#f5f6f7" weight={500} spacing="0.08em">{row.p}</Mono>
              </div>
              <div style={{ padding: '10px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <PermDot on={row.owner} color="#ffd700"/>
              </div>
              <div style={{ padding: '10px 4px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <PermDot on={row.mod} color={ACCENT.primary}/>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PermDot({ on, color }) {
  if (on) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, background: `${color}22`, border: `0.5px solid ${color}`,
    }}>
      <svg width="9" height="9" viewBox="0 0 14 14"><path d="M2 7l3 3 7-7" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="square"/></svg>
    </span>
  );
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.1)',
    }}>
      <svg width="8" height="2" viewBox="0 0 8 2"><path d="M0 1h8" stroke="rgba(201,204,209,0.4)" strokeWidth="1.5"/></svg>
    </span>
  );
}

Object.assign(window, { ModeratorDashboard });
