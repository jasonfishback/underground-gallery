// ── Boot Sequence ─────────────────────────────────────────────────────
// Cinematic intro that plays once before LoginApproval mounts.
// Sequence (~5.5s total):
//   0.0s  near-black carbon canvas, faint scanlines fade in
//   0.6s  perimeter brackets snap in
//   1.0s  AI logo crosshair fades up + slow pulse
//   1.6s  "ACCESS RESTRICTED" types out, glitch flicker
//   2.6s  status mono lines run (handshake / scan / clearance)
//   4.4s  rapid flicker, dolly-in scale on logo
//   5.0s  whole layer fades to transparent → reveals landing
//
// We persist a flag in sessionStorage so the boot only plays once per
// session — refreshing inside the same tab won't replay it.

function BootSequence({ accent, texture, onComplete, force = false, contained = false }) {
  const [phase, setPhase] = React.useState(0);
  // 0=fade-in 1=brackets 2=logo 3=text 4=status 5=flicker 6=fade-out 7=done
  const [statusLine, setStatusLine] = React.useState(0);
  const [titleText, setTitleText] = React.useState('');
  const [glitch, setGlitch] = React.useState(false);

  // Skip if already played this session (unless force=true)
  React.useEffect(() => {
    if (!force && sessionStorage.getItem('ai_boot_played') === '1') {
      onComplete && onComplete();
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 350),    // brackets
      setTimeout(() => setPhase(2), 800),    // logo
      setTimeout(() => setPhase(3), 1300),   // start typing
      setTimeout(() => setPhase(4), 2600),   // status lines
      setTimeout(() => setPhase(5), 4200),   // flicker
      setTimeout(() => setPhase(6), 4900),   // fade out
      setTimeout(() => { sessionStorage.setItem('ai_boot_played', '1'); onComplete && onComplete(); }, 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Type out "ACCESS RESTRICTED"
  React.useEffect(() => {
    if (phase < 3) return;
    const target = 'ACCESS RESTRICTED';
    let i = 0;
    const t = setInterval(() => {
      if (i > target.length) { clearInterval(t); return; }
      setTitleText(target.slice(0, i));
      i++;
    }, 60);
    return () => clearInterval(t);
  }, [phase >= 3]);

  // Status line ticker
  React.useEffect(() => {
    if (phase < 4) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setStatusLine(i);
      if (i >= 5) clearInterval(t);
    }, 280);
    return () => clearInterval(t);
  }, [phase >= 4]);

  // Final flicker
  React.useEffect(() => {
    if (phase < 5) return;
    const seq = [40, 90, 30, 70, 20, 120, 40];
    let on = true;
    let elapsed = 0;
    const timers = seq.map(d => {
      elapsed += d;
      return setTimeout(() => { on = !on; setGlitch(!on); }, elapsed);
    });
    return () => timers.forEach(clearTimeout);
  }, [phase >= 5]);

  if (phase >= 7) return null;

  const statusLines = [
    'PERIMETER · ESTABLISHING',
    'HANDSHAKE · NEGOTIATING TLS',
    'INVITE LEDGER · QUERYING',
    'CLEARANCE · UNVERIFIED',
    'SIGN-IN REQUIRED',
  ];

  const grain = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
  const carbon = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><rect width='8' height='8' fill='%23090a0d'/><path d='M0 4h8M4 0v8' stroke='%23121419' stroke-width='0.5'/></svg>\")";

  return (
    <div style={{
      position: contained ? 'absolute' : 'fixed', inset: 0, zIndex: contained ? 1 : 9999,
      background: '#02030566',
      backgroundImage: `${grain}, ${carbon}, radial-gradient(ellipse at center, #0a0b10 0%, #020305 70%)`,
      backgroundBlendMode: 'overlay, normal, normal',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase >= 6 ? 0 : 1,
      transition: 'opacity 0.6s ease-out',
      pointerEvents: phase >= 6 ? 'none' : 'auto',
      overflow: 'hidden',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, #000 100%)', pointerEvents: 'none' }}/>

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.018) 2px, rgba(255,255,255,0.018) 3px)',
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.8s',
      }}/>

      {/* Sweeping scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 80,
        background: `linear-gradient(180deg, transparent, ${accent.soft}, transparent)`,
        pointerEvents: 'none',
        animation: phase >= 2 ? 'aiBootScan 3.2s linear infinite' : 'none',
        opacity: 0.7,
      }}/>

      {/* Corner brackets */}
      {phase >= 1 && <BootBrackets accent={accent.primary}/>}

      {/* Center stack */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36,
        transform: phase >= 5 ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.7s cubic-bezier(.2,.8,.2,1)',
        opacity: glitch ? 0.4 : 1,
        filter: glitch ? `hue-rotate(8deg) saturate(1.4)` : 'none',
      }}>
        {/* Logo */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
          transition: 'all 0.8s cubic-bezier(.2,.8,.2,1)',
          filter: `drop-shadow(0 0 24px ${accent.soft})`,
          animation: phase >= 2 ? 'aiBootPulse 2.8s ease-in-out infinite' : 'none',
        }}>
          <BootLogo accent={accent.primary}/>
        </div>

        {/* Title */}
        <div style={{
          minHeight: 64,
          textAlign: 'center',
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 0.4s',
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11, color: accent.primary, letterSpacing: '0.4em', fontWeight: 700,
            marginBottom: 14,
            textShadow: `0 0 8px ${accent.soft}`,
          }}>
            ∕∕ SYSTEM CHECK
          </div>
          <div style={{
            fontFamily: '"Inter Tight", system-ui, sans-serif',
            fontSize: contained ? 26 : 'clamp(28px, 5vw, 52px)',
            fontWeight: 800, color: '#f5f6f7',
            letterSpacing: '0.06em',
            lineHeight: 1, position: 'relative', display: 'inline-block',
            textShadow: `0 0 32px ${accent.soft}, 0 0 4px ${accent.soft}`,
          }}>
            {titleText}
            <span style={{
              display: 'inline-block', width: 14, height: '0.85em',
              background: accent.primary, marginLeft: 6,
              verticalAlign: '-0.08em',
              animation: 'aiBlink 0.7s steps(1) infinite',
              boxShadow: `0 0 12px ${accent.soft}`,
            }}/>
          </div>
        </div>

        {/* Status lines */}
        <div style={{
          minHeight: 110, width: contained ? 260 : 320, maxWidth: '85vw',
          display: 'flex', flexDirection: 'column', gap: 6,
          opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.3s',
        }}>
          {statusLines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: i < statusLine ? 1 : 0,
              transform: i < statusLine ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'all 0.25s',
              fontSize: 10,
              color: i === 4 ? accent.primary : 'rgba(201,204,209,0.6)',
              letterSpacing: '0.2em', fontWeight: 700,
            }}>
              <span style={{
                width: 6, height: 6,
                background: i === 4 ? accent.primary : 'rgba(201,204,209,0.6)',
                boxShadow: i === 4 ? `0 0 8px ${accent.soft}` : 'none',
              }}/>
              <span style={{ flex: 1 }}>{line}</span>
              <span style={{ color: i === 4 ? accent.primary : 'rgba(201,204,209,0.4)' }}>
                {i === 4 ? '!!' : 'OK'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom telemetry */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 24,
        display: 'flex', justifyContent: 'space-between', padding: '0 28px',
        fontSize: 9, letterSpacing: '0.24em', color: 'rgba(201,204,209,0.4)', fontWeight: 700,
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s',
      }}>
        <span>UG · BOOT · v2.6.1</span>
        <span style={{ color: accent.primary }}>● LIVE</span>
        <span>NODE · PNW-03</span>
      </div>

      <style>{`
        @keyframes aiBootScan { 0% { transform: translateY(-100vh); } 100% { transform: translateY(100vh); } }
        @keyframes aiBootPulse { 0%, 100% { opacity: 1; filter: drop-shadow(0 0 24px ${accent.soft}); } 50% { opacity: 0.85; filter: drop-shadow(0 0 8px ${accent.soft}); } }
      `}</style>
    </div>
  );
}

function BootBrackets({ accent }) {
  const arm = 28;
  const corner = (style) => (
    <div style={{ position: 'absolute', width: arm, height: arm, ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
    </div>
  );
  return (
    <>
      {corner({ top: 24, left: 24 })}
      <div style={{ position: 'absolute', top: 24, right: 24, width: arm, height: arm, transform: 'scaleX(-1)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 24, width: arm, height: arm, transform: 'scaleY(-1)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 24, width: arm, height: arm, transform: 'scale(-1, -1)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1.5, background: accent, boxShadow: `0 0 6px ${accent}` }}/>
      </div>
    </>
  );
}

// Standalone logo for the boot — uses AILogo if available
function BootLogo({ accent }) {
  if (window.AILogo) return <window.AILogo accent={accent} size={84}/>;
  // Fallback geometric mark
  return (
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="40" fill="none" stroke={accent} strokeWidth="1.5"/>
      <circle cx="42" cy="42" r="28" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
      <path d="M42 6v16M42 62v16M6 42h16M62 42h16" stroke={accent} strokeWidth="1.5"/>
      <text x="42" y="48" textAnchor="middle" fill={accent} fontSize="14" fontWeight="800" fontFamily="Inter Tight, sans-serif" letterSpacing="-0.02em">UG</text>
    </svg>
  );
}

Object.assign(window, { BootSequence });
