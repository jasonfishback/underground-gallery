// brand.jsx — Underground Gallery logo + textures + shared primitives

// ── Logo: UG monogram — large U with G nested inside ──────────────────
function AILogo({ size = 40, color = '#ff2a2a', mono = false }) {
  const c = mono ? 'currentColor' : color;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" style={{ display: 'block' }}>
      {/* gallery frame */}
      <rect x="3" y="3" width="34" height="34" stroke={c} strokeWidth="1.5" fill="none" strokeOpacity="0.4"/>
      {/* corner ticks */}
      <path d="M3 3 L7 3 M37 3 L33 3 M3 37 L7 37 M37 37 L33 37" stroke={c} strokeWidth="2" strokeLinecap="square"/>
      {/* big U — square, dominant */}
      <path d="M8 8 L8 32 L32 32 L32 8" stroke={c} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      {/* small G nested inside the U */}
      <path d="M25 15 L15 15 L15 27 L25 27 L25 22 L20 22" stroke={c} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
    </svg>
  );
}

// ── Hero monogram — U with G inside, animated ──────────────────────────
function AIHeroMark({ size = 120, color = '#ff2a2a', accent = '#ff2a2a', animated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ display: 'block', overflow: 'visible' }}>
      {animated && (
        <style>{`
          @keyframes ugRingSpin { to { transform: rotate(360deg); } }
          @keyframes ugScanSweep { 0% { transform: translateY(-8px); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(94px); opacity: 0; } }
          @keyframes ugGPulse { 0%, 100% { filter: drop-shadow(0 0 0 transparent); } 50% { filter: drop-shadow(0 0 6px ${color}); } }
          .ug-ring { transform-origin: 60px 60px; animation: ugRingSpin 18s linear infinite; }
          .ug-scan { animation: ugScanSweep 4.2s ease-in-out infinite; }
          .ug-g { animation: ugGPulse 3.6s ease-in-out infinite; }
        `}</style>
      )}
      {/* registration crosshairs */}
      {[[6,6],[114,6],[6,114],[114,114]].map(([x,y],i)=>(
        <g key={i} stroke={color} strokeWidth="1" opacity="0.4">
          <path d={`M${x-4} ${y} L${x+4} ${y} M${x} ${y-4} L${x} ${y+4}`}/>
        </g>
      ))}
      {/* gallery frame */}
      <rect x="14" y="14" width="92" height="92" stroke={color} strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>
      {/* corner hang ticks */}
      <path d="M14 14 L26 14 M106 14 L94 14 M14 106 L26 106 M106 106 L94 106" stroke={color} strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <clipPath id="ug-clip">
          <rect x="14" y="14" width="92" height="92"/>
        </clipPath>
      </defs>
      {animated && (
        <g clipPath="url(#ug-clip)">
          <line className="ug-scan" x1="18" y1="18" x2="102" y2="18" stroke={color} strokeWidth="1" opacity="0.7" style={{ filter: `drop-shadow(0 0 4px ${color})` }}/>
        </g>
      )}
      {/* big U — dominant, square */}
      <path d="M28 24 L28 92 L92 92 L92 24"
        stroke={color} strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      {/* small G nested inside */}
      <g className={animated ? 'ug-g' : ''}>
        <path d="M80 44 L42 44 L42 80 L80 80 L80 64 L60 64"
          stroke={color} strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      </g>
      {/* outer scan ring */}
      <g className={animated ? 'ug-ring' : ''}>
        <circle cx="60" cy="60" r="56" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="2 4"/>
      </g>
    </svg>
  );
}

// ── Wordmark ────────────────────────────────────────────────────────────
function AIWordmark({ color = '#f5f6f7', size = 14, slashColor = '#ff2a2a', showSlash = true }) {
  return (
    <span style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontWeight: 700, fontSize: size, letterSpacing: '0.14em',
      color, textTransform: 'uppercase', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      UNDERGROUND{showSlash && <span style={{ color: slashColor, fontWeight: 900 }}>∕∕</span>}GALLERY
    </span>
  );
}

// ── Full lockup (logo + wordmark) ──────────────────────────────────────
function AILockup({ color = '#f5f6f7', accent = '#ff2a2a', size = 36 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <AILogo size={size} color={accent}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1 }}>
        <AIWordmark color={color} size={13} slashColor={accent}/>
        <span style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 8.5, letterSpacing: '0.3em',
          color: 'rgba(201,204,209,0.4)', textTransform: 'uppercase',
        }}>MEMBERS // EST. MMXXVI</span>
      </div>
    </div>
  );
}

// ── Textures ────────────────────────────────────────────────────────────
const carbonURL = (opacity = 0.55) => {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
    <rect width='14' height='14' fill='%230a0b10'/>
    <rect x='0' y='0' width='7' height='7' fill='%23121319' opacity='${opacity}'/>
    <rect x='7' y='7' width='7' height='7' fill='%23121319' opacity='${opacity}'/>
    <rect x='0' y='0' width='7' height='7' fill='none' stroke='%23191a22' stroke-opacity='0.5' stroke-width='0.5'/>
    <rect x='7' y='7' width='7' height='7' fill='none' stroke='%23191a22' stroke-opacity='0.5' stroke-width='0.5'/>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${s.replace(/\n\s*/g, '').replace(/#/g, '%23').replace(/'/g, "'")}")`;
};

// Subtle grain/noise as data URL (via fractalNoise)
const grainURL = `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`;

// Background chooser by texture tweak
function surfaceBg(texture, base = '#05060a') {
  if (texture === 'carbon') return { background: `${base} ${carbonURL()}`, backgroundSize: '14px 14px' };
  if (texture === 'grain') return { background: `${base}`, backgroundImage: grainURL, backgroundSize: '160px 160px' };
  return { background: base };
}

// ── Shared UI atoms ─────────────────────────────────────────────────────
function Mono({ children, size = 10, color, weight = 500, spacing = '0.18em', style = {} }) {
  return (
    <span style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: size, fontWeight: weight, letterSpacing: spacing,
      textTransform: 'uppercase', color,
      ...style,
    }}>{children}</span>
  );
}

function Hairline({ color = 'rgba(255,255,255,0.08)', vertical = false, style = {} }) {
  return (
    <div style={{
      background: color, flexShrink: 0,
      ...(vertical ? { width: 0.5, alignSelf: 'stretch' } : { height: 0.5, width: '100%' }),
      ...style,
    }}/>
  );
}

function TickBar({ value = 0, accent = '#ff2a2a', count = 40, height = 14 }) {
  const active = Math.round((value / 100) * count);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height }}>
      {Array.from({ length: count }).map((_, i) => {
        const isOn = i < active;
        const h = 5 + (i / count) * (height - 5);
        return (
          <div key={i} style={{
            width: 3, height: h,
            background: isOn ? accent : 'rgba(255,255,255,0.1)',
            boxShadow: isOn ? `0 0 6px ${accent}80` : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}/>
        );
      })}
    </div>
  );
}

// Accent color scheme
const ACCENTS = {
  red:    { primary: '#ff2a2a', glow: 'rgba(255,42,42,0.35)', soft: 'rgba(255,42,42,0.12)' },
  blue:   { primary: '#2b6cff', glow: 'rgba(43,108,255,0.4)',  soft: 'rgba(43,108,255,0.14)' },
  cyan:   { primary: '#00e0ff', glow: 'rgba(0,224,255,0.4)',   soft: 'rgba(0,224,255,0.12)' },
  silver: { primary: '#c9ccd1', glow: 'rgba(201,204,209,0.35)', soft: 'rgba(201,204,209,0.1)' },
};

Object.assign(window, {
  AILogo, AIHeroMark, AIWordmark, AILockup, Mono, Hairline, TickBar,
  carbonURL, grainURL, surfaceBg, ACCENTS,
});
