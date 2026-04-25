// login-approval.jsx — Underground Gallery login / approval status page
// This is the main landing page members see while their application is pending.
// Uses globals: Mono, Hairline, TickBar, AILogo, AIWordmark, AILockup, ACCENTS,
//               surfaceBg, grainURL, carbonURL, ScreenInvite, ScreenCode, ScreenSMS,
//               ScreenIdentity, ScreenUnlock, ScreenHome, ScreenSecret, IOSDevice

// Approval pipeline — 5 gates. The member sees exactly where they are.
const GATES = [
  { id: 'invite',   label: 'INVITE VERIFIED',    sub: 'Single-use key validated',                   status: 'done' },
  { id: 'sms',      label: 'HANDSHAKE',          sub: 'SMS identity bound to device',               status: 'done' },
  { id: 'identity', label: 'IDENTITY COMMITTED', sub: 'Callsign · region · primary drive',          status: 'done' },
  { id: 'review',   label: 'SPONSOR REVIEW',     sub: 'Inviter + 1 founder must co-sign',           status: 'active' },
  { id: 'ignite',   label: 'CLEARED FOR IGNITION', sub: 'Rank assigned · grid unlocked',            status: 'pending' },
];

// The 7 onboarding screens still exist under the hood so the mobile preview
// can scrub through them. The approval page drives which screen is showing.
const SCREEN_MAP = [
  { id: 'invite',   Comp: 'ScreenInvite',         gate: 0, label: 'INVITE',     wrap: false },
  { id: 'code',     Comp: 'ScreenCode',           gate: 0, label: 'CODE',       wrap: false },
  { id: 'sms',      Comp: 'ScreenSMS',            gate: 1, label: 'SMS',        wrap: false },
  { id: 'forgot',   Comp: 'ScreenForgotPassword', gate: 1, label: 'FORGOT PW',  wrap: false },
  { id: 'identity', Comp: 'ScreenIdentity',       gate: 2, label: 'IDENTITY',   wrap: false },
  { id: 'role',     Comp: 'ScreenRoleChooser',    gate: 4, label: 'ROLE',       wrap: false },
  { id: 'unlock',   Comp: 'ScreenUnlock',         gate: 4, label: 'RANK',       wrap: false },
  { id: 'home',     Comp: 'ScreenHome',           gate: 4, label: 'HOME',       wrap: 'mod' },
  { id: 'secret',   Comp: 'ScreenSecret',         gate: 4, label: 'MEET',       wrap: 'mod' },
  { id: 'store',    Comp: 'ScreenStore',          gate: 4, label: 'STORE',      wrap: 'mod' },
];

function LoginApproval({ tweaks, setTweak }) {
  const accent = ACCENTS[tweaks.accent] || ACCENTS.red;
  const [screenIdx, setScreenIdx] = React.useState(4); // Default: RANK UNLOCK as hero preview

  // Progress metric: count gates done / total, plus a partial for the active gate.
  const done = GATES.filter(g => g.status === 'done').length;
  const totalGates = GATES.length;
  const progress = Math.round(((done + 0.62) / totalGates) * 100); // 62% through sponsor review

  // Live clock ticking — applicant feel
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hhmmss = now.toTimeString().slice(0, 8);

  // Estimate ETA for approval
  const [eta, setEta] = React.useState({ h: 4, m: 12, s: 47 });
  React.useEffect(() => {
    const t = setInterval(() => setEta(e => {
      let s = e.s - 1, m = e.m, h = e.h;
      if (s < 0) { s = 59; m -= 1; }
      if (m < 0) { m = 59; h -= 1; }
      if (h < 0) { h = 0; m = 0; s = 0; }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2, '0');

  const Current = window[SCREEN_MAP[screenIdx].Comp];

  return (
    <div style={{
      minHeight: '100vh',
      ...surfaceBg(tweaks.texture, '#05060a'),
      color: '#f5f6f7',
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter Tight", system-ui, sans-serif',
    }}>
      {/* Background grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, backgroundImage: grainURL,
        opacity: 0.3, pointerEvents: 'none', mixBlendMode: 'overlay',
      }}/>

      {/* Top corner brackets — establishes the "you're inside a perimeter" feel */}
      <CornerBrackets accent={accent.primary}/>

      {/* ────── TOP BAR ────── */}
      <div className="ai-topbar" style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <AILockup accent={accent.primary} size={38}/>
        <div className="ai-lamps" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <SystemLamp label="NETWORK" color={accent.primary}/>
          <SystemLamp label="HANDSHAKE" color={accent.primary}/>
          <SystemLamp label="SPONSOR" color={accent.primary} blink/>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(201,204,209,0.55)',
            letterSpacing: '0.14em', paddingLeft: 16, borderLeft: '0.5px solid rgba(255,255,255,0.1)' }}>
            {hhmmss} <span style={{ color: accent.primary, marginLeft: 6 }}>PT</span>
          </div>
          {/* Role-gated: only owners and moderators see this button. */}
          {tweaks.modMode && (
            <a href="moderator.html" target="_blank" rel="noopener" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', textDecoration: 'none',
              background: accent.primary, border: `0.5px solid ${accent.primary}`,
              boxShadow: `0 0 16px ${accent.soft}`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, fontWeight: 700,
              color: '#05060a', letterSpacing: '0.22em',
            }}>
              MOD DASH
              <svg width="9" height="9" viewBox="0 0 14 14"><path d="M3 11L11 3M5 3h6v6" stroke="#05060a" strokeWidth="1.6" fill="none" strokeLinecap="square"/></svg>
            </a>
          )}
        </div>
      </div>

      {/* ────── HERO GRID ────── */}
      <style>{`
        .ai-hero{display:grid;grid-template-columns:1fr 460px;gap:60px;padding:48px 60px 40px;align-items:start;position:relative}
        @media (max-width:1180px){.ai-hero{grid-template-columns:1fr 380px;gap:36px;padding:40px 36px 32px}}
        @media (max-width:960px){.ai-hero{grid-template-columns:1fr;padding:32px 24px}.ai-hero .ai-preview{position:relative !important;top:0 !important;max-width:460px;margin:0 auto}}
        .ai-progress-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:14px;gap:24px;flex-wrap:wrap}
        .ai-gate{display:grid;grid-template-columns:28px 32px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 14px;text-align:left;border:none;background:transparent;cursor:pointer;border-bottom:0.5px solid rgba(255,255,255,0.06);position:relative;transition:all .15s}
        @media (max-width:720px){.ai-gate{grid-template-columns:24px 28px minmax(0,1fr);row-gap:6px}.ai-gate .ai-gate-tag{grid-column:1 / -1;text-align:left;padding-left:66px}}
        .ai-telemetry{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;padding:28px 60px 36px;border-top:0.5px solid rgba(255,255,255,0.08);position:relative}
        @media (max-width:960px){.ai-telemetry{grid-template-columns:repeat(2,1fr);gap:24px;padding:24px 24px 28px}}
        .ai-footer{padding:16px 60px 28px}
        @media (max-width:960px){.ai-footer{padding:16px 24px 28px;flex-wrap:wrap;gap:8px}}
        .ai-topbar{padding:20px 36px}
        @media (max-width:720px){.ai-topbar{padding:16px 20px;flex-wrap:wrap;gap:12px}.ai-topbar .ai-lamps{gap:14px}}
        .ai-hero h1{font-size:clamp(44px,7vw,88px) !important;line-height:0.92 !important}
        .ai-hero h1 .ai-sub{font-size:clamp(28px,4.4vw,56px) !important}
      `}</style>
      <div className="ai-hero">
        {/* ══════════════ LEFT: PROGRESS / STATUS ══════════════ */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <Mono size={10.5} color={accent.primary} spacing="0.32em">∕∕ APPLICATION · X7·APEX·449</Mono>
            <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.1)' }}/>
            <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.24em">STATUS · PENDING</Mono>
          </div>

          <h1 style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 88, fontWeight: 800, lineHeight: 0.88,
            letterSpacing: '-0.04em', color: '#f5f6f7', margin: '18px 0 12px',
            textWrap: 'balance',
          }}>
            You're at the <span style={{ color: accent.primary }}>gate.</span>
            <br/>
            <span className="ai-sub" style={{ fontStyle: 'italic', fontWeight: 500, fontSize: 56, color: 'rgba(201,204,209,0.75)' }}>
              Engine cooling while we finish your paperwork.
            </span>
          </h1>

          <p style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, lineHeight: 1.7,
            color: 'rgba(201,204,209,0.65)', margin: '20px 0 0', letterSpacing: '0.015em', maxWidth: 520,
          }}>
            Three gates cleared. Your inviter and a founder must co-sign before<br/>
            the grid opens. We'll push a notification the instant you're cleared.
          </p>

          {/* Big progress rail */}
          <div style={{ marginTop: 44 }}>
            <div className="ai-progress-row">
              <div>
                <Mono size={10} color="rgba(255,255,255,0.45)" spacing="0.24em">APPROVAL PROGRESS</Mono>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 54, fontWeight: 700,
                    color: '#f5f6f7', letterSpacing: '-0.02em', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{progress}<span style={{ color: accent.primary, fontSize: 28 }}>%</span></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.22em">{done} OF {totalGates} GATES</Mono>
                    <Mono size={9.5} color={accent.primary} spacing="0.22em">{done + 1} CURRENT · REVIEW</Mono>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Mono size={10} color="rgba(255,255,255,0.45)" spacing="0.24em">EST. IGNITION</Mono>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 28, fontWeight: 700,
                  color: accent.primary, letterSpacing: '0.06em', marginTop: 6,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: `0 0 24px ${accent.glow}`,
                }}>{pad(eta.h)}:{pad(eta.m)}:{pad(eta.s)}</div>
              </div>
            </div>
            <TickBar value={progress} accent={accent.primary} count={64} height={22}/>
          </div>

          {/* Gate list */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Mono size={10} color="rgba(255,255,255,0.45)" spacing="0.24em" style={{ marginBottom: 10, display: 'block' }}>
              GATE LEDGER
            </Mono>
            {GATES.map((g, i) => (
              <GateRow key={g.id} gate={g} index={i}
                accent={accent}
                active={i === 3}
                onClick={() => {
                  // Jump mobile preview to the first screen of that gate
                  const first = SCREEN_MAP.findIndex(s => s.gate === i);
                  if (first >= 0) setScreenIdx(first);
                }}
                partial={g.status === 'active' ? 62 : (g.status === 'done' ? 100 : 0)}
              />
            ))}
          </div>

          {/* CTA strip */}
          <div style={{ marginTop: 36, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{
              appearance: 'none', padding: '14px 22px',
              background: accent.primary, color: '#05060a',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.24em', textTransform: 'uppercase', cursor: 'pointer',
              boxShadow: `0 0 24px ${accent.soft}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span>NUDGE MY SPONSOR</span>
              <span style={{ opacity: 0.7, fontSize: 9 }}>→</span>
            </button>
            <button style={{
              appearance: 'none', padding: '14px 22px',
              background: 'transparent', color: '#f5f6f7',
              border: '0.5px solid rgba(255,255,255,0.2)',
              fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, fontSize: 11,
              letterSpacing: '0.24em', textTransform: 'uppercase', cursor: 'pointer',
            }}>VIEW MY APPLICATION</button>
            <div style={{ flex: 1 }}/>
            <Mono size={9.5} color="rgba(201,204,209,0.45)" spacing="0.22em">
              LOGGED AS @APEX_11 · REGION PNW-03
            </Mono>
          </div>
        </div>

        {/* ══════════════ RIGHT: MOBILE PREVIEW ══════════════ */}
        <div className="ai-preview" style={{
          position: 'sticky', top: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'stretch', justifyContent: 'space-between' }}>
            <Mono size={10} color={accent.primary} spacing="0.3em">∕∕ LIVE PREVIEW</Mono>
            <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">
              SCREEN {pad(screenIdx + 1)} / {pad(SCREEN_MAP.length)}
            </Mono>
          </div>
          <div
            data-screen-label={`LOGIN · PREVIEW ${screenIdx + 1}`}
            style={{ transform: 'scale(0.78)', transformOrigin: 'top center',
              filter: `drop-shadow(0 40px 60px ${accent.soft})` }}>
            <IOSDevice dark>
              <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
                {SCREEN_MAP[screenIdx].wrap === 'mod' && tweaks.modMode && (
                  <ModRibbon accent={accent}
                    onOpenDash={() => window.open('moderator.html', '_blank')}
                    onSwitchMode={() => setScreenIdx(SCREEN_MAP.findIndex(s => s.id === 'role'))}/>
                )}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Current
                    tweaks={tweaks}
                    accent={accent}
                    onNext={() => setScreenIdx(Math.min(SCREEN_MAP.length - 1, screenIdx + 1))}
                    onBack={() => setScreenIdx(Math.max(0, screenIdx - 1))}
                    onSecret={() => setScreenIdx(SCREEN_MAP.findIndex(s => s.id === 'secret'))}
                    onModerator={() => window.open('moderator.html', '_blank')}
                    onMember={() => setScreenIdx(SCREEN_MAP.findIndex(s => s.id === 'unlock'))}
                    onForgot={() => setScreenIdx(SCREEN_MAP.findIndex(s => s.id === 'forgot'))}
                    onComplete={() => setScreenIdx(SCREEN_MAP.findIndex(s => s.id === 'sms'))}
                  />
                </div>
              </div>
            </IOSDevice>
          </div>
          <div style={{
            marginTop: -120, // pull up since iOS frame is scaled
            display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center',
          }}>
            {SCREEN_MAP.map((_, i) => (
              <button key={i} onClick={() => setScreenIdx(i)} style={{
                appearance: 'none', border: 'none', padding: 0, cursor: 'pointer',
                width: i === screenIdx ? 22 : 6, height: 4,
                background: i === screenIdx ? accent.primary : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ────── BOTTOM STRIP: lineage + telemetry ────── */}
      <div className="ai-telemetry" style={{ marginTop: 20 }}>
        <TelemetryCell label="INVITE LINEAGE"
          value="FOUNDER → NOVA_K → R → YOU" accent={accent}/>
        <TelemetryCell label="INVITES REMAINING"
          value="0 / 3" sub="UNLOCKS AT RANK 01" accent={accent}/>
        <TelemetryCell label="APPLICATION AGE"
          value="00:47:12" sub="AVG. REVIEW: 04:00:00" accent={accent}/>
        <TelemetryCell label="SPONSOR ACTIVITY"
          value="R · LAST SEEN 6 MIN AGO" sub="FOUNDER · 2 CO-SIGNS NEEDED" accent={accent}/>
      </div>

      {/* Footer */}
      <div className="ai-footer" style={{
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <Mono size={9} color="rgba(201,204,209,0.35)" spacing="0.24em">
          UNDERGROUNDGALLERY.COM · MEMBERS EST. MMXXVI · INVITE ONLY
        </Mono>
        <Mono size={9} color="rgba(201,204,209,0.35)" spacing="0.24em">
          TERMS · PRIVACY · LEGAL · SUPPORT
        </Mono>
      </div>

      {/* Tweaks */}
      <TweaksPanel title="TWEAKS · UG">
        <TweakSection label="Accent"/>
        <TweakRadio label="Color" value={tweaks.accent}
          options={[{value:'red',label:'Red'},{value:'blue',label:'Blue'},{value:'cyan',label:'Cyan'},{value:'silver',label:'Silver'}]}
          onChange={(v)=>setTweak('accent', v)}/>
        <TweakSection label="Surface"/>
        <TweakRadio label="Texture" value={tweaks.texture}
          options={[{value:'flat',label:'Flat'},{value:'carbon',label:'Carbon'},{value:'grain',label:'Grain'}]}
          onChange={(v)=>setTweak('texture', v)}/>
        <TweakSection label="Mobile preview"/>
        <TweakSlider label="Screen" value={screenIdx} min={0} max={SCREEN_MAP.length - 1}
          onChange={(v)=>setScreenIdx(v)}/>
        <TweakSection label="Role · permissions"/>
        <TweakToggle label="Moderator mode" value={!!tweaks.modMode} onChange={(v)=>setTweak('modMode', v)}/>
        <TweakButton label="OPEN MODERATOR DASH ↗" onClick={() => window.open('moderator.html', '_blank')}/>
        <TweakSection label="Boot sequence"/>
        <TweakButton label="REPLAY BOOT ANIMATION" onClick={() => { sessionStorage.removeItem('ai_boot_played'); window.location.reload(); }}/>
        <TweakSection label="Content"/>
        <TweakText label="Invited by" value={tweaks.invitedBy} onChange={(v)=>setTweak('invitedBy', v)}/>
      </TweaksPanel>
    </div>
  );
}

function GateRow({ gate, index, accent, active, onClick, partial }) {
  const done = gate.status === 'done';
  const pending = gate.status === 'pending';
  return (
    <button onClick={onClick} className="ai-gate" style={{
      borderLeft: `2px solid ${active ? accent.primary : 'transparent'}`,
      background: active ? 'rgba(255,42,42,0.04)' : 'transparent',
    }}>
      {/* number */}
      <Mono size={11} color={done ? accent.primary : (active ? '#f5f6f7' : 'rgba(201,204,209,0.3)')} weight={700}>
        {String(index + 1).padStart(2, '0')}
      </Mono>

      {/* state icon */}
      <div style={{
        width: 26, height: 26,
        border: `1px solid ${done || active ? accent.primary : 'rgba(255,255,255,0.15)'}`,
        background: done ? accent.primary : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {done && <svg width="12" height="9"><path d="M1 4L5 8 11 1" fill="none" stroke="#05060a" strokeWidth="2" strokeLinecap="square"/></svg>}
        {active && (
          <>
            <div style={{ width: 6, height: 6, background: accent.primary, boxShadow: `0 0 10px ${accent.primary}` }}/>
            <div style={{ position: 'absolute', inset: -5, border: `1px solid ${accent.primary}`, opacity: 0.4, animation: 'aiPulse 1.4s ease-in-out infinite' }}/>
          </>
        )}
        {pending && <svg width="10" height="12" viewBox="0 0 10 12"><path d="M2.5 5V3.5a2.5 2.5 0 015 0V5M1.5 5h7v6h-7z" fill="none" stroke="rgba(201,204,209,0.4)" strokeWidth="1"/></svg>}
      </div>

      {/* label + sub */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 17, fontWeight: 700,
          color: done || active ? '#f5f6f7' : 'rgba(201,204,209,0.45)',
          letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>{gate.label}</div>
        <Mono size={10} color="rgba(201,204,209,0.5)" style={{ marginTop: 3, display: 'block' }}>
          {gate.sub}
        </Mono>
        {active && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 180, height: 3, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
              <div style={{
                width: `${partial}%`, height: '100%', background: accent.primary,
                boxShadow: `0 0 10px ${accent.primary}`,
              }}/>
            </div>
            <Mono size={9} color={accent.primary}>{partial}% · 1/2 SIGNATURES</Mono>
          </div>
        )}
      </div>

      {/* status tag */}
      <div className="ai-gate-tag" style={{ textAlign: 'right' }}>
        <Mono size={9.5} spacing="0.22em"
          color={done ? accent.primary : (active ? accent.primary : 'rgba(201,204,209,0.35)')}>
          {done ? '✓ CLEARED' : active ? '◉ IN REVIEW' : '□ LOCKED'}
        </Mono>
        {gate.id === 'review' && (
          <Mono size={9} color="rgba(201,204,209,0.45)" style={{ marginTop: 4, display: 'block' }}>
            R · FOUNDER
          </Mono>
        )}
      </div>
    </button>
  );
}

function SystemLamp({ label, color, blink }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 6, height: 6, background: color, boxShadow: `0 0 8px ${color}`,
        animation: blink ? 'aiPulse 1.2s ease-in-out infinite' : 'none',
      }}/>
      <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.24em">{label}</Mono>
    </div>
  );
}

function TelemetryCell({ label, value, sub, accent }) {
  return (
    <div style={{ borderLeft: `1px solid ${accent.primary}`, paddingLeft: 14 }}>
      <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.24em">{label}</Mono>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600,
        color: '#f5f6f7', letterSpacing: '0.04em', marginTop: 6, lineHeight: 1.3,
      }}>{value}</div>
      {sub && <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.18em" style={{ marginTop: 4, display: 'block' }}>{sub}</Mono>}
    </div>
  );
}

function CornerBrackets({ accent }) {
  const s = 18;
  return (
    <>
      {['tl','tr','bl','br'].map(p => (
        <div key={p} style={{
          position: 'absolute',
          width: s, height: s, borderColor: accent, borderStyle: 'solid', borderWidth: 0,
          ...(p[0]==='t' ? { top: 12 } : { bottom: 12 }),
          ...(p[1]==='l' ? { left: 12 } : { right: 12 }),
          ...(p[0]==='t' ? { borderTopWidth: 1 } : { borderBottomWidth: 1 }),
          ...(p[1]==='l' ? { borderLeftWidth: 1 } : { borderRightWidth: 1 }),
          pointerEvents: 'none', zIndex: 50,
        }}/>
      ))}
    </>
  );
}

Object.assign(window, { LoginApproval });
