// screens-unlock.jsx — Identity → Rank unlock → Home peek → Secret Meet
// Uses globals: Mono, Hairline, TickBar, AILogo, AIWordmark, AILockup, ACCENTS

// ── Screen 4: Identity (real name + username + privacy + region + drive) ─
// Members enter their legal name (required for vouching/payouts) AND pick
// a username. They can choose whether to display the username only —
// otherwise the app shows "First L." (first name + last initial). Real
// last name is never shown to other members.
function ScreenIdentity({ tweaks, accent, onNext, onBack }) {
  // Real name (required, kept private)
  const [firstName, setFirstName] = React.useState('Ren');
  const [lastName,  setLastName]  = React.useState('Tanaka');
  // Username (chosen, displayed publicly when "hide" is on)
  const [username,  setUsername]  = React.useState('');
  const [unameStatus, setUnameStatus] = React.useState('typing'); // typing | checking | available | taken
  const [hideRealName, setHideRealName] = React.useState(true);

  const [region, setRegion] = React.useState('PNW-03');
  const [drive,  setDrive]  = React.useState(null);

  const drives = [
    { id: 'jdm',  label: 'JDM',  sub: 'R32·R34·S15' },
    { id: 'euro', label: 'EURO', sub: 'E46·F80·RS' },
    { id: 'usdm', label: 'USDM', sub: 'LS·Coyote·Hemi' },
    { id: 'ev',   label: 'ELEC', sub: 'Plaid·i4M·Taycan' },
  ];

  // Auto-type the username so the screen feels alive
  React.useEffect(() => {
    const letters = ['a','p','e','x','_','1','1'];
    let i = 0;
    setUnameStatus('typing');
    const t = setInterval(() => {
      if (i >= letters.length) { clearInterval(t); setUnameStatus('checking'); return; }
      setUsername(prev => prev + letters[i]);
      i++;
    }, 130);
    return () => clearInterval(t);
  }, []);

  // Fake availability check
  React.useEffect(() => {
    if (unameStatus !== 'checking') return;
    const t = setTimeout(() => setUnameStatus('available'), 700);
    return () => clearTimeout(t);
  }, [unameStatus]);

  // Compute display name preview (this is exactly the rule used app-wide)
  const displayName = hideRealName
    ? `@${username || '_____'}`
    : `${firstName} ${lastName ? lastName[0] + '.' : ''}`.trim();

  const ready = firstName && lastName && username.length >= 3 && drive && unameStatus === 'available';

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="04 / 05"/>

      <div style={{ padding: '12px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ CONFIGURE IDENTITY</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 30, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
          margin: '12px 0 0', letterSpacing: '-0.02em',
        }}>Who are we<br/>expecting?</h1>
      </div>

      <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Legal name — required for vouching + payouts */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.22em">LEGAL NAME · REQUIRED</Mono>
            <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.18em">PRIVATE</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NameInput value={firstName} onChange={setFirstName} placeholder="FIRST" accent={accent}/>
            <NameInput value={lastName}  onChange={setLastName}  placeholder="LAST"  accent={accent}/>
          </div>
          <Mono size={8.5} color="rgba(201,204,209,0.4)" style={{ marginTop: 6, display: 'block' }} spacing="0.04em">
            Held for vouching + Stripe payouts. Never shown in full to other members.
          </Mono>
        </div>

        {/* Username — public handle */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.22em">USERNAME · PUBLIC HANDLE</Mono>
            <UnameStatus status={unameStatus} accent={accent}/>
          </div>
          <UsernameInput value={username} onChange={(v) => { setUsername(v); setUnameStatus('checking'); }} accent={accent}/>
          <Mono size={8.5} color="rgba(201,204,209,0.4)" style={{ marginTop: 6, display: 'block' }} spacing="0.04em">
            3–20 chars. Letters, numbers, underscore. Permanent — choose carefully.
          </Mono>
        </div>

        {/* Display preference + live preview */}
        <div style={{
          padding: '12px 14px',
          background: '#0a0b10',
          border: `1px solid ${hideRealName ? accent.primary : 'rgba(255,255,255,0.08)'}`,
        }}>
          <PrivacyToggle on={hideRealName} setOn={setHideRealName} accent={accent}/>
          <Hairline color="rgba(255,255,255,0.08)" style={{ margin: '12px 0 10px' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">OTHERS WILL SEE</Mono>
            <Mono size={8} color="rgba(201,204,209,0.4)" spacing="0.18em">LIVE</Mono>
          </div>
          <div style={{
            marginTop: 6,
            fontFamily: hideRealName ? '"JetBrains Mono", monospace' : '"Inter Tight", sans-serif',
            fontSize: 22, fontWeight: 700, color: accent.primary, letterSpacing: hideRealName ? '0.04em' : '-0.01em',
            lineHeight: 1, textShadow: `0 0 12px ${accent.soft}`,
          }}>{displayName}</div>
          <Mono size={8.5} color="rgba(201,204,209,0.5)" style={{ marginTop: 6, display: 'block' }} spacing="0.06em">
            {hideRealName
              ? 'Username only. Your real name stays sealed.'
              : `Real first name + last initial. Last name "${lastName || '——'}" stays sealed.`}
          </Mono>
        </div>

        {/* Region */}
        <Field label="REGION" value={region} sub="SEATTLE // CASCADE LOOP" accent={accent}/>

        {/* Drive picker */}
        <div>
          <Mono size={9} color="rgba(255,255,255,0.4)" style={{ display: 'block', marginBottom: 8 }} spacing="0.22em">PRIMARY DRIVE</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {drives.map(d => (
              <button key={d.id} onClick={() => setDrive(d.id)} style={{
                appearance: 'none',
                background: drive === d.id ? 'rgba(255,42,42,0.08)' : '#0a0b10',
                border: `1px solid ${drive === d.id ? accent.primary : 'rgba(255,255,255,0.08)'}`,
                padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'all 0.15s',
              }}>
                <Mono size={13} color={drive === d.id ? accent.primary : '#f5f6f7'} weight={700} spacing="0.1em">{d.label}</Mono>
                <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.1em">{d.sub}</Mono>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 24 }}/>
      <CTAButton accent={accent} onClick={onNext} disabled={!ready} label="COMMIT IDENTITY" sub="→ ENTERING GRID"/>
    </ScreenShell>
  );
}

// ── Identity helper components ─────────────────────────────────────────
function NameInput({ value, onChange, placeholder, accent }) {
  return (
    <div style={{
      borderBottom: `1px solid ${value ? accent.primary : 'rgba(255,255,255,0.18)'}`,
      paddingBottom: 4,
    }}>
      <Mono size={8.5} color="rgba(201,204,209,0.45)" spacing="0.22em">{placeholder}</Mono>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="——"
        style={{
          width: '100%', appearance: 'none', background: 'transparent', border: 'none',
          outline: 'none', marginTop: 2,
          fontFamily: '"Inter Tight", sans-serif', fontSize: 18, fontWeight: 700,
          color: '#f5f6f7', letterSpacing: '-0.01em',
        }}
      />
    </div>
  );
}

function UsernameInput({ value, onChange, accent }) {
  return (
    <div style={{
      borderBottom: `1px solid ${accent.primary}`,
      paddingBottom: 6,
      display: 'flex', alignItems: 'baseline', gap: 4,
    }}>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
        color: accent.primary, lineHeight: 1, letterSpacing: '0.04em',
      }}>@</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
        placeholder="callsign"
        style={{
          flex: 1, appearance: 'none', background: 'transparent', border: 'none', outline: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
          color: '#f5f6f7', letterSpacing: '0.06em', lineHeight: 1, padding: 0,
        }}
      />
      <span style={{
        width: 2, height: 22, background: accent.primary,
        animation: 'aiBlink 1s steps(1) infinite',
      }}/>
    </div>
  );
}

function UnameStatus({ status, accent }) {
  if (status === 'typing')   return <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">TYPING…</Mono>;
  if (status === 'checking') return <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">CHECKING…</Mono>;
  if (status === 'taken')    return <Mono size={8.5} color={accent.primary} weight={700} spacing="0.22em">✕ TAKEN</Mono>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 4l2.5 2L8 1" fill="none" stroke={accent.primary} strokeWidth="1.6" strokeLinecap="square"/></svg>
      <Mono size={8.5} color={accent.primary} weight={700} spacing="0.22em">AVAILABLE</Mono>
    </span>
  );
}

function PrivacyToggle({ on, setOn, accent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 700,
            color: '#f5f6f7', letterSpacing: '-0.01em', lineHeight: 1.15,
          }}>Hide my real name</div>
          <Mono size={8.5} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 3 }} spacing="0.04em">
            Show only @username on builds, posts, and orders. Otherwise: first name + last initial.
          </Mono>
        </div>
        <button
          role="switch"
          aria-checked={on}
          onClick={() => setOn(!on)}
          style={{
            appearance: 'none', cursor: 'pointer',
            width: 40, height: 22, padding: 0, flexShrink: 0,
            background: on ? accent.primary : '#0a0b10',
            border: `1px solid ${on ? accent.primary : 'rgba(255,255,255,0.18)'}`,
            position: 'relative', transition: 'all 0.18s',
            boxShadow: on ? `0 0 12px ${accent.soft}` : 'none',
          }}>
          <span style={{
            position: 'absolute', top: 2, left: on ? 20 : 2,
            width: 16, height: 16,
            background: on ? '#05060a' : '#c9ccd1',
            transition: 'all 0.18s',
          }}/>
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, sub, accent, cursor }) {
  return (
    <div>
      <Mono size={9} color="rgba(255,255,255,0.4)" style={{ display: 'block', marginBottom: 6 }}>{label}</Mono>
      <div style={{
        borderBottom: `1px solid ${accent.primary}`,
        padding: '6px 0',
        display: 'flex', alignItems: 'baseline', gap: 8,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 600,
        color: '#f5f6f7', letterSpacing: '0.05em',
      }}>
        <span>{value}</span>
        {cursor && <span style={{ width: 1.5, height: 20, background: accent.primary, animation: 'aiBlink 1s step-end infinite' }}/>}
      </div>
      {sub && <Mono size={9} color="rgba(201,204,209,0.45)" style={{ marginTop: 6, display: 'block' }}>{sub}</Mono>}
    </div>
  );
}

function SocialField({ icon, prefix, placeholder, value, onChange, accent }) {
  const icons = {
    ig: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
    tt: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2v3.5a4.5 4.5 0 004.5 4.5V13a8 8 0 01-4.5-1.4V17a5 5 0 11-5-5h.5v3.2a1.8 1.8 0 101.8 1.8V2z"/></svg>,
    fb: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 7h3V3h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1z"/></svg>,
  };
  const filled = !!value;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', background: '#0a0b10',
      border: `1px solid ${filled ? accent.primary : 'rgba(255,255,255,0.08)'}`,
    }}>
      <span style={{ color: filled ? accent.primary : 'rgba(201,204,209,0.45)', display: 'flex' }}>{icons[icon]}</span>
      {prefix && <Mono size={11} color="rgba(201,204,209,0.5)">{prefix}</Mono>}
      <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#f5f6f7',
        letterSpacing: '0.04em',
      }}/>
      {filled && <Mono size={9} color={accent.primary} spacing="0.2em">LINKED</Mono>}
    </div>
  );
}

// ── Screen 5: RANK unlock (gamified) ────────────────────────────────────
function ScreenUnlock({ tweaks, accent, onNext, onBack }) {
  const [xp, setXp] = React.useState(0);
  const [rank, setRank] = React.useState(0);
  const [phase, setPhase] = React.useState('loading'); // loading → reveal

  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / 2200);
      // ease out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setXp(Math.round(e * 72));
      if (t >= 0.4 && rank < 1) setRank(1);
      if (t < 1) raf = requestAnimationFrame(animate);
      else setPhase('reveal');
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="05 / 05"/>

      <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
        <Mono size={10} color={accent.primary}>∕∕ INITIAL RANK ASSIGNED</Mono>
      </div>

      {/* Tachometer */}
      <div style={{ padding: '28px 24px 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <Tachometer value={xp} accent={accent}/>
      </div>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <Mono size={9} color="rgba(201,204,209,0.5)">ENTRY RANK</Mono>
        <div style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 64, fontWeight: 800, lineHeight: 1, color: '#f5f6f7',
          margin: '6px 0 0', letterSpacing: '-0.04em',
          textShadow: phase === 'reveal' ? `0 0 40px ${accent.glow}` : 'none',
          transition: 'text-shadow 0.6s',
        }}>
          RANK <span style={{ color: accent.primary }}>0{rank}</span>
        </div>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ marginTop: 6, display: 'block' }}>
          CADET · 72 / 250 XP TO RANK 02
        </Mono>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Mono size={9} color="rgba(255,255,255,0.4)">PROGRESS</Mono>
          <Mono size={9} color={accent.primary}>{xp}%</Mono>
        </div>
        <TickBar value={xp} accent={accent.primary}/>
      </div>

      {/* Unlocked perks */}
      <div style={{ padding: '28px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" style={{ display: 'block', marginBottom: 10 }}>UNLOCKED</Mono>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Perk label="Submit to Virtual Car Show" accent={accent.primary} unlocked={phase === 'reveal'}/>
          <Perk label="03 Invitations to share" accent={accent.primary} unlocked={phase === 'reveal'} delay={120}/>
          <Perk label="Pop-Up Meet RSVP" accent={accent.primary} unlocked={phase === 'reveal'} delay={240}/>
          <Perk label="Marketplace read-only" accent={accent.primary} unlocked={phase === 'reveal'} delay={360} locked/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onNext} label="ENTER GARAGE" sub="→ UNDERGROUNDGALLERY.COM"/>
    </ScreenShell>
  );
}

function Tachometer({ value, accent }) {
  const size = 220;
  const r = 92;
  const cx = size / 2, cy = size / 2;
  const ticks = 40;
  const startAngle = 135; // degrees
  const endAngle = 405;   // 270° sweep
  const tickArr = Array.from({ length: ticks });
  const activeTicks = Math.round((value / 100) * ticks);
  const needleAngle = startAngle + (value / 100) * (endAngle - startAngle);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* outer ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
      {/* ticks */}
      {tickArr.map((_, i) => {
        const a = startAngle + (i / (ticks - 1)) * (endAngle - startAngle);
        const rad = (a * Math.PI) / 180;
        const r1 = r, r2 = r - (i % 5 === 0 ? 14 : 8);
        const on = i < activeTicks;
        const x1 = cx + Math.cos(rad) * r1, y1 = cy + Math.sin(rad) * r1;
        const x2 = cx + Math.cos(rad) * r2, y2 = cy + Math.sin(rad) * r2;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={on ? accent.primary : 'rgba(255,255,255,0.18)'}
            strokeWidth={i % 5 === 0 ? 2 : 1}
            opacity={on ? 1 : 0.6}
            style={{ filter: on ? `drop-shadow(0 0 3px ${accent.primary})` : 'none', transition: 'all 0.2s' }}/>
        );
      })}
      {/* number labels at 5 marks */}
      {[0, 25, 50, 75, 100].map((v, i) => {
        const a = startAngle + (v / 100) * (endAngle - startAngle);
        const rad = (a * Math.PI) / 180;
        const rr = r - 26;
        const x = cx + Math.cos(rad) * rr, y = cy + Math.sin(rad) * rr;
        return (
          <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontFamily='"JetBrains Mono", monospace' fontSize="9" fill="rgba(201,204,209,0.5)" fontWeight="500">
            {v/10 | 0}
          </text>
        );
      })}
      {/* needle */}
      <g transform={`rotate(${needleAngle} ${cx} ${cy})`} style={{ transition: 'transform 0.08s linear' }}>
        <line x1={cx} y1={cy} x2={cx + r - 6} y2={cy}
          stroke={accent.primary} strokeWidth="2" strokeLinecap="square"
          style={{ filter: `drop-shadow(0 0 6px ${accent.primary})` }}/>
        <circle cx={cx + r - 6} cy={cy} r="3" fill={accent.primary}/>
      </g>
      <circle cx={cx} cy={cy} r="10" fill="#05060a" stroke={accent.primary} strokeWidth="1"/>
      <circle cx={cx} cy={cy} r="3" fill={accent.primary}/>
      {/* center readout */}
      <text x={cx} y={cy + 32} textAnchor="middle"
        fontFamily='"JetBrains Mono", monospace' fontSize="9" fill="rgba(201,204,209,0.55)" letterSpacing="2">XP</text>
    </svg>
  );
}

function Perk({ label, accent, unlocked, delay = 0, locked = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', background: '#0a0b10',
      border: `0.5px solid ${unlocked && !locked ? 'rgba(255,42,42,0.3)' : 'rgba(255,255,255,0.06)'}`,
      opacity: unlocked ? 1 : 0, transform: unlocked ? 'translateY(0)' : 'translateY(4px)',
      transition: `all 0.4s ${delay}ms`,
    }}>
      <div style={{
        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${locked ? 'rgba(255,255,255,0.2)' : accent}`,
        background: locked ? 'transparent' : accent,
      }}>
        {locked ? (
          <svg width="8" height="10" viewBox="0 0 8 10"><path d="M2 4V3a2 2 0 014 0v1M1 4h6v5H1z" fill="none" stroke="rgba(201,204,209,0.6)" strokeWidth="1"/></svg>
        ) : (
          <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5L3.5 6 8 1" fill="none" stroke="#05060a" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter"/></svg>
        )}
      </div>
      <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, color: locked ? 'rgba(201,204,209,0.4)' : '#f5f6f7' }}>{label}</span>
      <span style={{ marginLeft: 'auto' }}>
        <Mono size={8.5} color={locked ? 'rgba(201,204,209,0.3)' : accent} spacing="0.15em">{locked ? 'RANK 02' : 'NEW'}</Mono>
      </span>
    </div>
  );
}

// ── Screen 6: Home peek with secret meet countdown ─────────────────────
function ScreenHome({ tweaks, accent, onSecret }) {
  const [counter, setCounter] = React.useState({ h: 2, m: 14, s: 32 });
  React.useEffect(() => {
    const t = setInterval(() => setCounter(c => {
      let s = c.s - 1, m = c.m, h = c.h;
      if (s < 0) { s = 59; m -= 1; }
      if (m < 0) { m = 59; h -= 1; }
      if (h < 0) { h = 0; m = 0; s = 0; }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <div style={{
        padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <AILockup accent={accent.primary} size={26}/>
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent.primary}, #1a0606)`,
          border: `1px solid ${accent.primary}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 13, color: '#f5f6f7',
        }}>A</div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 20px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {['FEED','SHOW','MEETS','MARKET'].map((t, i) => (
          <div key={t} style={{
            padding: '6px 14px 12px', cursor: 'pointer',
            borderBottom: i === 0 ? `2px solid ${accent.primary}` : '2px solid transparent',
            marginBottom: -0.5,
          }}>
            <Mono size={10} color={i === 0 ? '#f5f6f7' : 'rgba(201,204,209,0.45)'} weight={i===0?700:500}>{t}</Mono>
          </div>
        ))}
      </div>

      {/* Secret meet card */}
      <div style={{ padding: '16px 20px 0' }} onClick={onSecret}>
        <div style={{
          position: 'relative',
          background: '#0a0b10',
          border: `1px solid ${accent.primary}`,
          boxShadow: `0 0 40px ${accent.soft}, inset 0 0 0 1px ${accent.soft}`,
          padding: 0, overflow: 'hidden', cursor: 'pointer',
        }}>
          {/* blurred image placeholder */}
          <div style={{
            height: 140, position: 'relative',
            background: `radial-gradient(circle at 30% 40%, ${accent.soft}, transparent 60%), linear-gradient(135deg, #1a0a0a 0%, #05060a 50%, #0a0b10 100%)`,
            filter: 'blur(2px)',
          }}>
            <div style={{ position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,0.02) 6px 7px)' }}/>
          </div>
          {/* overlay tag */}
          <div style={{
            position: 'absolute', top: 12, left: 12, padding: '4px 8px',
            background: accent.primary, color: '#05060a',
          }}>
            <Mono size={9} color="#05060a" weight={700} spacing="0.2em">SECRET MEET</Mono>
          </div>
          <div style={{ padding: '14px 16px 16px' }}>
            <div style={{
              fontFamily: '"Inter Tight", sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f6f7',
              letterSpacing: '-0.02em',
            }}>OPERATION: <span style={{ color: accent.primary }}>NIGHTFALL</span></div>
            <Mono size={10} color="rgba(201,204,209,0.55)" style={{ marginTop: 4, display: 'block' }}>
              ██████████ // COORDS REDACTED
            </Mono>
            <Hairline color="rgba(255,255,255,0.06)" style={{ margin: '12px 0' }}/>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Counter v={pad(counter.h)} label="HRS" accent={accent}/>
              <Counter v={pad(counter.m)} label="MIN" accent={accent}/>
              <Counter v={pad(counter.s)} label="SEC" accent={accent}/>
              <div style={{ flex: 1 }}/>
              <Mono size={9} color={accent.primary} spacing="0.2em">TAP TO VIEW →</Mono>
            </div>
          </div>
        </div>
      </div>

      {/* Feed card */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <StripedPlaceholder label="BUILD · 1999 SKYLINE GT-R" accent={accent}/>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 15, fontWeight: 700, color: '#f5f6f7' }}>
                R34 · STREET
              </span>
              <Mono size={10} color={accent.primary}>612 HP</Mono>
            </div>
            <Mono size={9} color="rgba(201,204,209,0.5)" style={{ marginTop: 2, display: 'block' }}>
              @NOVA_K · RANK 09 · SEATTLE
            </Mono>
            <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
              <Stat label="VOTES" v="847" accent={accent.primary}/>
              <Stat label="COMMENTS" v="92"/>
              <Stat label="MODS" v="24"/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 20 }}/>
    </ScreenShell>
  );
}

function Counter({ v, label, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 26, fontWeight: 700, color: accent.primary,
        lineHeight: 1, letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
      }}>{v}</span>
      <Mono size={8} color="rgba(201,204,209,0.45)" spacing="0.2em" style={{ marginTop: 2 }}>{label}</Mono>
    </div>
  );
}

function Stat({ label, v, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.18em">{label}</Mono>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600,
        color: accent || '#f5f6f7', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );
}

function StripedPlaceholder({ label, accent, h = 120 }) {
  return (
    <div style={{
      height: h, position: 'relative',
      background: `repeating-linear-gradient(135deg, #0a0b10 0 8px, #13141a 8px 9px, #0a0b10 9px 17px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 30%, ${accent.soft}, transparent 60%)` }}/>
      <Mono size={9} color="rgba(201,204,209,0.45)" style={{ position: 'relative', zIndex: 1 }}>{label}</Mono>
      {/* corner marker */}
      <div style={{ position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderTop: `1px solid ${accent.primary}`, borderLeft: `1px solid ${accent.primary}` }}/>
      <div style={{ position: 'absolute', bottom: 8, right: 8, width: 8, height: 8, borderBottom: `1px solid ${accent.primary}`, borderRight: `1px solid ${accent.primary}` }}/>
    </div>
  );
}

// ── Screen 7: Secret meet reveal (theatrical) ──────────────────────────
function ScreenSecret({ tweaks, accent, onBack }) {
  const [unlocked, setUnlocked] = React.useState(false);
  const [counter, setCounter] = React.useState({ h: 0, m: 0, s: 5 });

  React.useEffect(() => {
    const t = setInterval(() => setCounter(c => {
      let s = c.s - 1, m = c.m, h = c.h;
      if (s < 0) { s = 59; m -= 1; }
      if (m < 0) { m = 59; h -= 1; }
      if (h < 0 || (h === 0 && m === 0 && s < 0)) {
        clearInterval(t);
        setUnlocked(true);
        return { h: 0, m: 0, s: 0 };
      }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="SECRET MEET"/>

      {/* Hero blurred photo */}
      <div style={{ position: 'relative', height: 240, margin: '8px 0 0', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 70%, ${unlocked ? accent.glow : accent.soft} 0%, transparent 60%), linear-gradient(180deg, #1a0505 0%, #05060a 100%)`,
          filter: unlocked ? 'none' : 'blur(14px)',
          transform: unlocked ? 'scale(1)' : 'scale(1.1)',
          transition: 'filter 0.8s, transform 0.8s',
        }}/>
        {/* rain/speed lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'repeating-linear-gradient(95deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)',
        }}/>
        {/* pulsing timer overlay */}
        {!unlocked && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 10,
          }}>
            <Mono size={10} color={accent.primary} spacing="0.3em">∕∕ LOCKED</Mono>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 42, fontWeight: 700,
              color: '#f5f6f7', letterSpacing: '0.1em',
              fontVariantNumeric: 'tabular-nums',
              animation: 'aiPulse 1.4s ease-in-out infinite',
              textShadow: `0 0 30px ${accent.glow}`,
            }}>{pad(counter.h)}:{pad(counter.m)}:{pad(counter.s)}</div>
            <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.24em">UNLOCK AT CONVERGENCE</Mono>
          </div>
        )}
        {unlocked && (
          <div style={{
            position: 'absolute', left: 16, bottom: 16,
            padding: '6px 10px', background: accent.primary,
            animation: 'aiSlideIn 0.5s ease-out',
          }}>
            <Mono size={10} color="#05060a" weight={700} spacing="0.24em">◉ LIVE NOW</Mono>
          </div>
        )}
        {/* corner brackets */}
        {['tl','tr','bl','br'].map(p => (
          <div key={p} style={{
            position: 'absolute',
            width: 14, height: 14, borderColor: accent.primary, borderStyle: 'solid', borderWidth: 0,
            ...(p[0]==='t' ? { top: 8 } : { bottom: 8 }),
            ...(p[1]==='l' ? { left: 8 } : { right: 8 }),
            ...(p[0]==='t' ? { borderTopWidth: 2 } : { borderBottomWidth: 2 }),
            ...(p[1]==='l' ? { borderLeftWidth: 2 } : { borderRightWidth: 2 }),
          }}/>
        ))}
      </div>

      {/* details */}
      <div style={{ padding: '20px 24px 0' }}>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 32, fontWeight: 700,
          color: '#f5f6f7', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.0,
        }}>OPERATION:<br/><span style={{ color: accent.primary }}>NIGHTFALL</span></h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ marginTop: 10, display: 'block' }}>
          HOSTED BY @NOVA_K · RANK 09
        </Mono>
      </div>

      <div style={{ padding: '18px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Detail label="DATE" value="THU · APR 24 · 23:00"/>
        <Detail label="LOCATION" value={unlocked ? 'PIER 91 · LOT C' : '███████ · ███ █'} redacted={!unlocked} accent={accent}/>
        <Detail label="COORDS" value={unlocked ? '47.6504° N  122.3739° W' : '██.████° █  ███.████° █'} redacted={!unlocked} accent={accent}/>
        <Detail label="ATTENDEES" value="47 / 60 CONFIRMED" accent={accent}/>
      </div>

      <div style={{ padding: '16px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" style={{ display: 'block', marginBottom: 8 }}>DIRECTIVE</Mono>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, lineHeight: 1.7,
          color: 'rgba(201,204,209,0.7)', margin: 0, letterSpacing: '0.01em',
        }}>
          No cameras. No public tags. Street tires welcome.<br/>
          Dress for rain. Bring your rank card.
        </p>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} label={unlocked ? 'GET DIRECTIONS' : 'RSVP · ATTEND'} sub={unlocked ? '→ OPEN MAPS' : '→ ON WAITLIST 47/60'}/>
    </ScreenShell>
  );
}

function Detail({ label, value, redacted, accent }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline',
      padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 80, flexShrink: 0 }}>
        <Mono size={9} color="rgba(201,204,209,0.4)">{label}</Mono>
      </div>
      <div style={{ flex: 1,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
        color: redacted ? 'rgba(201,204,209,0.65)' : '#f5f6f7',
        letterSpacing: '0.04em', fontWeight: redacted ? 400 : 600,
      }}>{value}</div>
    </div>
  );
}

// ── Screen Shell + Top Bar + CTA ───────────────────────────────────────
function ScreenShell({ children, tweaks, accent }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      ...surfaceBg(tweaks.texture),
      color: '#f5f6f7', position: 'relative',
      display: 'flex', flexDirection: 'column',
      paddingTop: 48, // statusbar
    }}>
      {/* subtle overall grain even when flat */}
      {tweaks.texture !== 'grain' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: grainURL, opacity: 0.25, pointerEvents: 'none', mixBlendMode: 'overlay' }}/>
      )}
      {/* red corner bar */}
      <div style={{ position: 'absolute', top: 48, left: 0, width: 3, height: 60, background: accent.primary }}/>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}

function TopBar({ accent, onBack, step }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
    }}>
      <button onClick={onBack} style={{
        appearance: 'none', background: 'transparent', border: 'none', padding: 6, margin: -6,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L3 7l6 5" stroke={accent.primary} strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
        </svg>
        <Mono size={9.5} color="rgba(201,204,209,0.7)">BACK</Mono>
      </button>
      <AILogo size={22} color={accent.primary}/>
      <Mono size={9.5} color={accent.primary}>{step}</Mono>
    </div>
  );
}

function CTAButton({ accent, onClick, disabled, label, sub, sticky }) {
  return (
    <div style={{ padding: '16px 20px 28px', position: sticky ? 'sticky' : 'relative', bottom: 0 }}>
      <button onClick={onClick} disabled={disabled} style={{
        appearance: 'none', width: '100%', padding: '16px 20px',
        background: disabled ? '#0a0b10' : accent.primary,
        color: disabled ? 'rgba(201,204,209,0.4)' : '#05060a',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : accent.primary}`,
        fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 12,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: disabled ? 'none' : `0 0 32px ${accent.soft}`,
        transition: 'all 0.15s',
      }}>
        <span>{label}</span>
        {sub && <span style={{ fontSize: 9, opacity: 0.7 }}>{sub}</span>}
      </button>
    </div>
  );
}

Object.assign(window, { ScreenIdentity, ScreenUnlock, ScreenHome, ScreenSecret, ScreenShell, TopBar, CTAButton, StripedPlaceholder });
