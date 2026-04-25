// role-chooser.jsx — Post-login role chooser + Moderator quick-access bar
// Uses globals: Mono, Hairline, AILogo, AILockup, ScreenShell, CTAButton

// ── Screen: Role Chooser ───────────────────────────────────────────────
// Shown after a successful SMS login when the user is a moderator.
// Regular members skip this and go straight to ScreenHome.
function ScreenRoleChooser({ tweaks, accent, onModerator, onMember, onBack }) {
  const [hover, setHover] = React.useState(null);

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="ACCESS · MODE"/>

      <div style={{ padding: '14px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ MODERATOR · @NOVA_K</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 30, fontWeight: 700, lineHeight: 0.98,
          color: '#f5f6f7', margin: '12px 0 0', letterSpacing: '-0.025em',
        }}>How are<br/>you entering<br/><span style={{ color: accent.primary }}>tonight?</span></h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 12, lineHeight: 1.6 }}>
          Switch any time from the dashboard ribbon. Your moderator log records both modes separately.
        </Mono>
      </div>

      {/* Two giant role cards */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RoleCard
          accent={accent}
          active={hover === 'mod'}
          onMouseEnter={() => setHover('mod')}
          onMouseLeave={() => setHover(null)}
          onClick={onModerator}
          tag="∕∕ ADMIN"
          tagColor={accent.primary}
          title="MODERATOR DASHBOARD"
          sub="QUEUE · SIGNUPS · TRAFFIC · PAYOUTS"
          hint="OPENS IN BROWSER · SEPARATE SURFACE"
          stats={[
            { label: 'PENDING', val: '47' },
            { label: 'FLAGS', val: '03' },
            { label: 'TODAY', val: '+128' },
          ]}
          icon={<ModIcon accent={accent}/>}
        />
        <RoleCard
          accent={accent}
          active={hover === 'mem'}
          onMouseEnter={() => setHover('mem')}
          onMouseLeave={() => setHover(null)}
          onClick={onMember}
          tag="MEMBER"
          tagColor="rgba(201,204,209,0.6)"
          title="ENTER GARAGE"
          sub="FEED · MEETS · MARKET · BUILD PAGE"
          hint="MOD RIBBON STAYS PINNED ON ALL SCREENS"
          stats={[
            { label: 'RANK', val: '#04' },
            { label: 'PTS', val: '847' },
            { label: 'BUILDS', val: '2' },
          ]}
          icon={<GarageIcon accent={accent}/>}
        />
      </div>

      <div style={{ flex: 1 }}/>

      {/* Footer audit line */}
      <div style={{
        padding: '12px 24px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.22em">
          SESSION · UG-0247
        </Mono>
        <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.22em">
          AUDITED · ALWAYS
        </Mono>
      </div>
    </ScreenShell>
  );
}

function RoleCard({ accent, active, onClick, onMouseEnter, onMouseLeave, tag, tagColor, title, sub, hint, stats, icon }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        appearance: 'none', textAlign: 'left', cursor: 'pointer',
        background: active ? 'linear-gradient(135deg, rgba(255,42,42,0.08), transparent 60%)' : '#0a0b10',
        border: `1px solid ${active ? accent.primary : 'rgba(255,255,255,0.08)'}`,
        padding: '16px 18px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.18s',
        boxShadow: active ? `0 0 28px ${accent.soft}` : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* corner brackets */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10,
        borderTop: `1.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.18)'}`,
        borderLeft: `1.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.18)'}` }}/>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
        borderBottom: `1.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.18)'}`,
        borderRight: `1.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.18)'}` }}/>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono size={9} color={tagColor} weight={700} spacing="0.24em">{tag}</Mono>
          <div style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 19, fontWeight: 700,
            color: '#f5f6f7', marginTop: 4, letterSpacing: '-0.015em', lineHeight: 1.05,
          }}>{title}</div>
          <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 4 }}>{sub}</Mono>
        </div>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          border: `0.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? accent.soft : 'transparent',
        }}>{icon}</div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            paddingRight: 8,
            borderRight: i < stats.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
            paddingLeft: i === 0 ? 0 : 10,
          }}>
            <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{s.label}</Mono>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 700,
              color: i === 0 && active ? accent.primary : '#f5f6f7',
              marginTop: 2, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Hint + arrow */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 4,
      }}>
        <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">{hint}</Mono>
        <span style={{
          color: active ? accent.primary : 'rgba(201,204,209,0.5)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Mono size={9} color={active ? accent.primary : 'rgba(201,204,209,0.5)'} weight={700} spacing="0.2em">ENTER</Mono>
          <svg width="10" height="10" viewBox="0 0 14 14"><path d="M5 2l6 5-6 5" stroke={active ? accent.primary : 'rgba(201,204,209,0.5)'} strokeWidth="1.8" fill="none" strokeLinecap="square"/></svg>
        </span>
      </div>
    </button>
  );
}

function ModIcon({ accent }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="3" width="18" height="13" stroke={accent.primary} strokeWidth="1.2"/>
      <line x1="2" y1="7" x2="20" y2="7" stroke={accent.primary} strokeWidth="1"/>
      <circle cx="4.5" cy="5" r="0.6" fill={accent.primary}/>
      <circle cx="6.5" cy="5" r="0.6" fill={accent.primary}/>
      <line x1="5" y1="11" x2="9" y2="11" stroke={accent.primary} strokeWidth="0.8"/>
      <line x1="5" y1="13" x2="13" y2="13" stroke={accent.primary} strokeWidth="0.8"/>
      <rect x="14" y="10" width="4" height="3" fill={accent.primary}/>
      <line x1="6" y1="18" x2="16" y2="18" stroke={accent.primary} strokeWidth="1.5"/>
    </svg>
  );
}

function GarageIcon({ accent }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 18 L2 8 L11 3 L20 8 L20 18 Z" stroke={accent.primary} strokeWidth="1.2" fill="none"/>
      <rect x="5" y="11" width="12" height="7" stroke={accent.primary} strokeWidth="1"/>
      <line x1="5" y1="13.5" x2="17" y2="13.5" stroke={accent.primary} strokeWidth="0.6"/>
      <line x1="5" y1="15.5" x2="17" y2="15.5" stroke={accent.primary} strokeWidth="0.6"/>
    </svg>
  );
}

// ── Mod Quick-Access Ribbon ────────────────────────────────────────────
// Pinned at the top of every member screen when the active user is a mod.
// Shows pending count + jumps back to dashboard.
function ModRibbon({ accent, pending = 47, flags = 3, onOpenDash, onSwitchMode }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'linear-gradient(180deg, rgba(5,6,10,0.96), rgba(5,6,10,0.92))',
      backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${accent.primary}`,
      boxShadow: `0 0 20px ${accent.soft}`,
      padding: '7px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Live pulse */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        paddingRight: 8, borderRight: '0.5px solid rgba(255,255,255,0.12)',
      }}>
        <span style={{
          width: 6, height: 6, background: accent.primary, borderRadius: '50%',
          boxShadow: `0 0 6px ${accent.primary}`,
          animation: 'aiPulse 1.6s ease-in-out infinite',
        }}/>
        <Mono size={8.5} color={accent.primary} weight={700} spacing="0.24em">MOD</Mono>
      </div>

      {/* Stats inline */}
      <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0 }}>
        <RibbonStat label="PEND" val={pending} accent={accent} hot/>
        <RibbonStat label="FLAGS" val={String(flags).padStart(2,'0')} accent={accent}/>
      </div>

      {/* Switch */}
      <button onClick={onSwitchMode} style={{
        appearance: 'none', padding: '4px 7px', background: 'transparent',
        border: '0.5px solid rgba(255,255,255,0.18)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <svg width="9" height="9" viewBox="0 0 14 14"><path d="M2 7h10M9 4l3 3-3 3M5 10L2 7l3-3" stroke="rgba(201,204,209,0.65)" strokeWidth="1.2" fill="none" strokeLinecap="square"/></svg>
        <Mono size={8.5} color="rgba(201,204,209,0.7)" weight={700} spacing="0.2em">SWAP</Mono>
      </button>

      {/* Open dashboard */}
      <button onClick={onOpenDash} style={{
        appearance: 'none', padding: '4px 8px', background: accent.primary,
        border: `0.5px solid ${accent.primary}`, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        boxShadow: `0 0 12px ${accent.soft}`,
      }}>
        <Mono size={8.5} color="#05060a" weight={700} spacing="0.2em">DASH</Mono>
        <svg width="9" height="9" viewBox="0 0 14 14"><path d="M3 11L11 3M5 3h6v6" stroke="#05060a" strokeWidth="1.5" fill="none" strokeLinecap="square"/></svg>
      </button>
    </div>
  );
}

function RibbonStat({ label, val, accent, hot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{label}</Mono>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700,
        color: hot ? accent.primary : '#f5f6f7',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        textShadow: hot ? `0 0 8px ${accent.glow}` : 'none',
      }}>{val}</span>
    </div>
  );
}

Object.assign(window, { ScreenRoleChooser, ModRibbon });
