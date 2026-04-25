// screens-entry.jsx — Invite received → Code → SMS verify
// Uses globals: Mono, Hairline, TickBar, AILogo, AIWordmark, AILockup, ACCENTS

// ── Screen 0: Landing ──────────────────────────────────────────────────
function ScreenLanding({ tweaks, accent, onNext }) {
  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      {/* Top mark + status */}
      <div style={{ padding: '28px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AILogo size={32} color={accent.primary}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, background: accent.primary, borderRadius: '50%', animation: 'aiPulse 2s infinite' }}/>
          <Mono size={9} color="rgba(201,204,209,0.55)" spacing="0.24em">ACCEPTING NOW</Mono>
        </div>
      </div>

      {/* Centered hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
        {/* hero monogram */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22, filter: `drop-shadow(0 0 24px ${accent.glow})` }}>
          <AIHeroMark size={108} color={accent.primary}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Mono size={10} color={accent.primary} spacing="0.32em">∕∕ EST. MMXXVI · INVITE ONLY</Mono>
        </div>
        <h1 style={{
          fontFamily: '"Inter Tight", system-ui, sans-serif',
          fontSize: 40, fontWeight: 700, lineHeight: 0.92,
          color: '#f5f6f7', margin: '14px 0 0',
          letterSpacing: '-0.035em', textAlign: 'center',
        }}>
          Built quietly.<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>Shown carefully.</span>
        </h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, lineHeight: 1.7, color: 'rgba(201,204,209,0.6)',
          margin: '18px auto 0', letterSpacing: '0.02em', maxWidth: 280, textAlign: 'center',
        }}>
          Access restricted. A private network<br/>for vetted builds and serious enthusiasts.
        </p>

        <div style={{ display: 'flex', gap: 14, marginTop: 18, justifyContent: 'center' }}>
          <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">· NO ALGORITHM</Mono>
          <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">· NO ADS</Mono>
          <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">· NO TOURISTS</Mono>
        </div>
      </div>

      {/* Three paths */}
      <div style={{ padding: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="login.html" style={{
          textDecoration: 'none', textAlign: 'left',
          padding: '14px 18px',
          background: 'transparent', border: '0.5px solid rgba(255,255,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#f5f6f7" strokeWidth="1.5">
              <rect x="3" y="8" width="12" height="8"/>
              <path d="M5.5 8V5.5a3.5 3.5 0 017 0V8"/>
            </svg>
            <Mono size={11} color="#f5f6f7" weight={700} spacing="0.22em">MEMBER LOG IN</Mono>
          </div>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.2em">SMS · KEY</Mono>
        </a>
        <button onClick={onNext} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left',
          padding: '16px 18px',
          background: accent.primary, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: `0 0 32px ${accent.glow}`,
        }}>
          <div>
            <Mono size={11} color="#05060a" weight={700} spacing="0.22em">SCAN INVITE QR</Mono>
            <Mono size={9} color="rgba(5,6,10,0.6)" style={{ display: 'block', marginTop: 3 }} spacing="0.18em">USE CAMERA · SINGLE-USE CODE</Mono>
          </div>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#05060a" strokeWidth="2">
            <path d="M3 3h5M3 3v5M19 3h-5M19 3v5M3 19h5M3 19v-5M19 19h-5M19 19v-5"/>
            <rect x="8" y="8" width="6" height="6"/>
          </svg>
        </button>

        <a href="request.html" style={{
          textDecoration: 'none', textAlign: 'left',
          padding: '16px 18px',
          background: 'transparent', border: '0.5px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <Mono size={11} color="#f5f6f7" weight={700} spacing="0.22em">REQUEST ACCESS</Mono>
            <Mono size={9} color="rgba(201,204,209,0.45)" style={{ display: 'block', marginTop: 3 }} spacing="0.18em">SUBMIT BUILD · PEER-REVIEWED</Mono>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#f5f6f7" strokeWidth="1.5">
            <path d="M5 3l8 6-8 6"/>
          </svg>
        </a>
      </div>

      <div style={{ padding: '0 24px 22px', display: 'flex', justifyContent: 'space-between' }}>
        <Mono size={8.5} color="rgba(201,204,209,0.3)" spacing="0.24em">UG.GALLERY</Mono>
        <Mono size={8.5} color="rgba(201,204,209,0.3)" spacing="0.24em">2,847 MEMBERS</Mono>
      </div>
    </ScreenShell>
  );
}

// ── Screen 1: Invite received (QR card) ─────────────────────────────────
function ScreenInvite({ tweaks, accent, onNext }) {
  const { invitedBy } = tweaks;
  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <div style={{ padding: '28px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AILogo size={32} color={accent.primary}/>
        <Mono size={9} color="rgba(201,204,209,0.5)">INVITE // 001.26</Mono>
      </div>

      <div style={{ padding: '40px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ YOU HAVE BEEN INVITED</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", system-ui, sans-serif',
          fontSize: 40, fontWeight: 700, lineHeight: 0.95,
          color: '#f5f6f7', margin: '14px 0 0',
          letterSpacing: '-0.03em',
        }}>
          Access is not<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>advertised.</span>
        </h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, lineHeight: 1.7, color: 'rgba(201,204,209,0.65)',
          margin: '20px 0 0', letterSpacing: '0.02em', maxWidth: 280,
        }}>
          A private network for the builds that don't<br/>show up at public meets.
        </p>
      </div>

      {/* QR card */}
      <div style={{ padding: '32px 24px 0' }}>
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #0e0f14 0%, #07080c 100%)',
          border: `0.5px solid rgba(255,255,255,0.08)`,
          padding: '20px 20px 18px',
        }}>
          {/* corner brackets */}
          {['tl','tr','bl','br'].map(p => (
            <div key={p} style={{
              position: 'absolute',
              width: 10, height: 10, borderColor: accent.primary, borderStyle: 'solid', borderWidth: 0,
              ...(p[0]==='t' ? { top: -1, borderTopWidth: 1 } : { bottom: -1, borderBottomWidth: 1 }),
              ...(p[1]==='l' ? { left: -1, borderLeftWidth: 1 } : { right: -1, borderRightWidth: 1 }),
            }}/>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Mono size={9} color="rgba(255,255,255,0.5)">QR // SINGLE-USE</Mono>
            <Mono size={9} color={accent.primary}>ACTIVE</Mono>
          </div>

          <QRPlaceholder accent={accent.primary}/>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Mono size={9} color="rgba(255,255,255,0.4)">INVITE CODE</Mono>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 20, fontWeight: 700, color: '#f5f6f7',
              letterSpacing: '0.24em',
            }}>X7·APEX·449</div>
          </div>

          <Hairline color="rgba(255,255,255,0.08)" style={{ margin: '14px 0' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #333, #111)',
              border: `1px solid ${accent.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 12, color: accent.primary,
            }}>R</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Mono size={8.5} color="rgba(255,255,255,0.4)">INVITED BY</Mono>
              <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, color: '#f5f6f7', fontWeight: 500 }}>
                {invitedBy} <span style={{ color: accent.primary, fontFamily: 'monospace', fontSize: 9, marginLeft: 4 }}>RANK 07</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <CTAButton accent={accent} onClick={onNext} label="ACCEPT INVITATION" sub="→ VERIFY CODE"/>
    </ScreenShell>
  );
}

function QRPlaceholder({ accent }) {
  // Deterministic pseudo-random grid
  const rng = (i) => ((i * 2654435761) % 1000) / 1000;
  const N = 21;
  return (
    <div style={{
      width: '100%', aspectRatio: '1',
      background: '#f5f6f7', padding: 8, boxSizing: 'border-box',
      display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 0,
      position: 'relative',
    }}>
      {Array.from({ length: N*N }).map((_, i) => {
        const x = i % N, y = Math.floor(i / N);
        // Finder patterns in 3 corners
        const inFinder = (y < 7 && x < 7) || (y < 7 && x > N-8) || (y > N-8 && x < 7);
        const finderOn = inFinder && (
          (y===0||y===6||x===0||x===6) ||
          (y>=2&&y<=4&&x>=2&&x<=4) ||
          (y===0&&x>N-8) || (y===6&&x>N-8) || (x===N-1&&y<7) || (x===N-7&&y<7) || ((x>=N-5&&x<=N-3)&&(y>=2&&y<=4)) ||
          (x===0&&y>N-8) || (x===6&&y>N-8) || (y===N-1&&x<7) || (y===N-7&&x<7) || ((x>=2&&x<=4)&&(y>=N-5&&y<=N-3))
        );
        const on = finderOn ? true : (!inFinder && rng(i) > 0.55);
        // Center logo block
        const inCenter = Math.abs(x - (N-1)/2) < 2 && Math.abs(y - (N-1)/2) < 2;
        if (inCenter) return <div key={i} style={{ background: '#05060a' }}/>;
        return <div key={i} style={{ background: on ? '#05060a' : 'transparent' }}/>;
      })}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: 36, height: 36, background: '#05060a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AILogo size={22} color={accent}/>
      </div>
    </div>
  );
}

// ── Screen 2: Code entry ────────────────────────────────────────────────
function ScreenCode({ tweaks, accent, onNext, onBack }) {
  const [code, setCode] = React.useState(['X','7','A','P','E','X','','','']);
  const full = code.join('').length >= 6;
  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="02 / 05"/>

      <div style={{ padding: '12px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ ENTER INVITE CODE</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 32, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
          margin: '12px 0 8px', letterSpacing: '-0.02em',
        }}>Confirm your key.</h1>
        <Mono size={10.5} color="rgba(201,204,209,0.5)" spacing="0.04em">
          Each code unlocks one seat. No refunds.
        </Mono>
      </div>

      <div style={{ padding: '28px 24px 0', display: 'flex', gap: 6, justifyContent: 'center' }}>
        {code.map((c, i) => (
          <div key={i} style={{
            flex: 1, aspectRatio: '1 / 1.2', maxWidth: 34,
            border: `1px solid ${c ? accent.primary : 'rgba(255,255,255,0.12)'}`,
            background: c ? 'rgba(255,42,42,0.04)' : '#0a0b10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 20, fontWeight: 700, color: '#f5f6f7',
            boxShadow: c ? `inset 0 0 0 1px ${accent.glow}` : 'none',
          }}>{c}</div>
        ))}
      </div>

      <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
        <Mono size={9} color="rgba(201,204,209,0.4)">CODE VALIDATED · INVITER: R · RANK 07</Mono>
      </div>

      {/* Invite tree hint */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.06)',
          padding: '14px 16px',
        }}>
          <Mono size={9} color="rgba(255,255,255,0.4)">LINEAGE TRACE</Mono>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(201,204,209,0.8)' }}>
            <span style={{ color: accent.primary }}>◉</span> FOUNDER
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
            <span>NOVA_K</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
            <span>R</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
            <span style={{ color: accent.primary, fontWeight: 700 }}>YOU</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <CTAButton accent={accent} onClick={onNext} disabled={!full} label="PROCEED" sub="→ SMS VERIFICATION"/>
    </ScreenShell>
  );
}

// ── Screen 3: SMS verify ────────────────────────────────────────────────
function ScreenSMS({ tweaks, accent, onNext, onBack, onForgot }) {
  const [digits, setDigits] = React.useState(['','','','','','']);
  const [phone] = React.useState('+1 ··· ··· 4·49');
  const [resend, setResend] = React.useState(28);

  React.useEffect(() => {
    const t = setInterval(() => setResend(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-fill animation
  React.useEffect(() => {
    const seq = ['3','9','2','0','1','7'];
    const timers = seq.map((d, i) => setTimeout(() => {
      setDigits(prev => { const n = [...prev]; n[i] = d; return n; });
    }, 600 + i * 280));
    const done = setTimeout(() => onNext && onNext(), 600 + seq.length * 280 + 600);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  const filled = digits.filter(Boolean).length;

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="03 / 05"/>

      <div style={{ padding: '12px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ SMS VERIFICATION</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 32, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
          margin: '12px 0 8px', letterSpacing: '-0.02em',
        }}>Handshake.</h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, lineHeight: 1.6, color: 'rgba(201,204,209,0.55)',
          margin: 0, letterSpacing: '0.02em',
        }}>
          6-digit code sent to <span style={{ color: '#f5f6f7' }}>{phone}</span>
        </p>
      </div>

      <div style={{ padding: '32px 24px 0', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {digits.map((d, i) => (
          <div key={i} style={{
            flex: 1, aspectRatio: '1 / 1.25', maxWidth: 44,
            borderBottom: `2px solid ${d ? accent.primary : 'rgba(255,255,255,0.15)'}`,
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 26, fontWeight: 700, color: '#f5f6f7',
            position: 'relative',
            transition: 'border-color 0.2s',
          }}>{d || (i === filled && <span style={{ width: 1.5, height: 22, background: accent.primary, animation: 'aiBlink 1s step-end infinite' }}/>)}</div>
        ))}
      </div>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <Mono size={9.5} color="rgba(201,204,209,0.5)">
          RESEND CODE IN <span style={{ color: accent.primary }}>{String(resend).padStart(2, '0')}s</span>
        </Mono>
        {onForgot && (
          <div style={{ marginTop: 14 }}>
            <button onClick={onForgot} style={{
              appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5,
              color: accent.primary, letterSpacing: '0.22em', textDecoration: 'underline',
            }}>FORGOT PASSWORD?</button>
          </div>
        )}
      </div>

      {/* Status log */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.06)',
          padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <LogLine time="00:00" text="Handshake initiated" accent={accent.primary} on/>
          <LogLine time="00:02" text="SMS dispatched to carrier" accent={accent.primary} on={filled > 0}/>
          <LogLine time="00:03" text="Code received" accent={accent.primary} on={filled > 2}/>
          <LogLine time="00:04" text="Identity locked" accent={accent.primary} on={filled === 6}/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <CTAButton accent={accent} disabled={filled < 6} label={filled < 6 ? `ENTER ${filled}/6 DIGITS` : 'VERIFIED'} sub={filled === 6 ? '→ BUILDING IDENTITY' : ''} sticky/>
    </ScreenShell>
  );
}

function LogLine({ time, text, on, accent }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center',
      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
      color: on ? '#f5f6f7' : 'rgba(201,204,209,0.3)',
      transition: 'color 0.3s',
    }}>
      <span style={{ width: 6, height: 6, background: on ? accent : 'rgba(255,255,255,0.15)',
        boxShadow: on ? `0 0 6px ${accent}` : 'none', transition: 'all 0.3s' }}/>
      <span style={{ color: on ? accent : 'rgba(201,204,209,0.3)' }}>{time}</span>
      <span>{text}</span>
      {on && <span style={{ marginLeft: 'auto', color: 'rgba(201,204,209,0.45)' }}>OK</span>}
    </div>
  );
}

Object.assign(window, { ScreenLanding, ScreenInvite, ScreenCode, ScreenSMS });
