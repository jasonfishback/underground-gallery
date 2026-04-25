// build-garage.jsx — Underground Gallery: Build page · Garage · QR · Shop
// Uses globals: Mono, Hairline, ACCENTS, ScreenShell, TopBar, CTAButton, AILogo, AIWordmark

// ─── Shared sample build (used across screens) ─────────────────────────
const SAMPLE_BUILD = {
  id: 'r34-nova',
  year: 1999, make: 'NISSAN', model: 'SKYLINE GT-R', trim: 'V-SPEC',
  chassis: 'BNR34',
  owner: { user: '@NOVA_K', city: 'SEATTLE, WA', joined: 'EST. 2026.03', verified: true },
  hero: { tone: '#7a1212' }, // placeholder color tint
  stats: { hp: 612, tq: 580, weight: 3450, ptw: 5.64, rank: 4, score: 847 },
  // Standalone engine management (when present, surfaces tuner credit on the build)
  ecu: {
    system: 'HALTECH ELITE 2500',
    map: 'STREET / RACE · DUAL MAP',
    tuner: { name: 'RAY OKADA',  shop: 'BOOST DEPOT', city: 'KENT, WA', verified: true, ig: 'ray.tunes' },
  },
  socials: { ig: 'nova_k.r34', tt: 'nova_k', fb: 'nova.k.builds' },
  // Tagged points on the hero photo (x/y 0-100)
  tags: [
    { x: 22, y: 64, name: 'VOLK TE37 SAGA', spec: '18×10.5 +12 · BRONZE' },
    { x: 56, y: 54, name: 'NISMO Z-TUNE FLARES', spec: '+50MM REAR ARCH · CARBON' },
    { x: 78, y: 68, name: 'BREMBO GT 6-POT', spec: '380MM · TWO-PIECE FLOATING' },
    { x: 48, y: 32, name: 'TOMEI ARMS M8280', spec: 'TWIN-SCROLL · 1.05 A/R' },
  ],
  mods: [
    { sec: 'POWERTRAIN', items: [
      { name: 'TOMEI ARMS M8280 TURBO', shop: 'BOOST DEPOT',  ts: '2026.04.18', verified: true,  spec: 'TWIN-SCROLL · 1.05 A/R' },
      { name: 'HKS 272° CAMSHAFTS',     shop: 'BOOST DEPOT',  ts: '2026.04.18', verified: true,  spec: 'INTAKE + EXHAUST' },
      { name: 'TOMEI 2.8L STROKER',     shop: 'POWERHOUSE',   ts: '2026.03.02', verified: true,  spec: 'FORGED · 9.0:1' },
    ]},
    { sec: 'CHASSIS', items: [
      { name: 'NISMO COILOVERS R-TUNE', shop: 'TRACK FACTORY',ts: '2026.02.14', verified: true,  spec: '12K/10K' },
      { name: 'CUSCO ROLL CAGE',        shop: 'TRACK FACTORY',ts: '2026.02.14', verified: false, spec: '8-POINT · WELDED' },
    ]},
    { sec: 'EXTERIOR', items: [
      { name: 'NISMO Z-TUNE BODY KIT',  shop: 'CARBON ATELIER',ts: '2026.01.20',verified: true,  spec: 'DRY CARBON · OEM FIT' },
      { name: 'VOLK TE37 SAGA',         shop: 'WHEEL HOUSE',  ts: '2026.01.20', verified: true,  spec: '18×10.5 +12 · BRONZE' },
    ]},
  ],
  milestones: [
    { ts: '2026.04.18', label: '612WHP DYNO', detail: 'BOOST DEPOT · 24PSI · 98 OCT' },
    { ts: '2026.03.10', label: 'FEATURED · UG #4', detail: 'PROMOTED 1042 → 847 RANK' },
    { ts: '2026.02.14', label: 'TRACK CERTIFIED', detail: 'PACIFIC RACEWAYS · 1:42.3' },
    { ts: '2026.01.05', label: 'BUILD STARTED', detail: 'CHASSIS ACQUIRED · 47K KM' },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SCREEN: BUILD PAGE (magazine feature)
// ──────────────────────────────────────────────────────────────────────────
function ScreenBuildPage({ tweaks, accent, onBack, build = SAMPLE_BUILD }) {
  const [activeTag, setActiveTag] = React.useState(null);

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      {/* Compact top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '12px 18px', background: 'rgba(5,6,10,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L3 7l6 5" stroke={accent.primary} strokeWidth="1.8" fill="none"/></svg>
        </button>
        <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.24em">BUILD · {build.id.toUpperCase()}</Mono>
        <button style={iconBtn()}>
          <svg width="14" height="14" viewBox="0 0 14 14" stroke={accent.primary} fill="none" strokeWidth="1.5">
            <path d="M3 5l4-3 4 3M7 2v8M3 12h8"/>
          </svg>
        </button>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative' }}>
        <HeroPhoto build={build} accent={accent} activeTag={activeTag} setActiveTag={setActiveTag}/>

        {/* Floating verified badge */}
        {build.owner.verified && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            padding: '4px 8px', background: 'rgba(5,6,10,0.85)',
            border: `1px solid ${accent.primary}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, background: accent.primary, borderRadius: '50%' }}/>
            <Mono size={9} color={accent.primary} weight={700} spacing="0.22em">VERIFIED</Mono>
          </div>
        )}

        {/* Bottom-left rank badge */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          padding: '6px 10px', background: '#05060a',
          border: `1px solid ${accent.primary}`,
        }}>
          <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">UG RANK</Mono>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 700, color: accent.primary, lineHeight: 1, marginTop: 2 }}>
            #{String(build.stats.rank).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* HEADLINE */}
      <div style={{ padding: '20px 20px 0' }}>
        <Mono size={9.5} color={accent.primary} spacing="0.24em">FEATURE · ISSUE 04</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 30, fontWeight: 700,
          lineHeight: 0.95, color: '#f5f6f7', margin: '10px 0 0',
          letterSpacing: '-0.025em',
        }}>
          {build.year} {build.make}<br/>
          <span style={{ color: accent.primary }}>{build.model}</span>
        </h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 8 }}>
          {build.trim} · CHASSIS {build.chassis} · {build.owner.user} · {build.owner.city}
        </Mono>
      </div>

      {/* PULL QUOTE */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          padding: '16px 18px',
          borderLeft: `2px solid ${accent.primary}`,
          background: 'linear-gradient(90deg, rgba(255,42,42,0.05), transparent)',
        }}>
          <div style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 17, fontWeight: 500,
            color: '#f5f6f7', lineHeight: 1.3, fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}>
            "It started as a clean V-Spec. Three years later it's still daily. The point isn't horsepower, it's that the car still drives like a Skyline."
          </div>
          <Mono size={9} color="rgba(201,204,209,0.4)" style={{ marginTop: 10, display: 'block' }} spacing="0.2em">
            — OWNER STATEMENT · 2026.04
          </Mono>
        </div>
      </div>

      {/* SPEC TABLE */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="SPEC SHEET" accent={accent} sub="MEASURED · DYNO VERIFIED"/>
        <div style={{
          marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          border: '0.5px solid rgba(255,255,255,0.08)', background: '#0a0b10',
        }}>
          <SpecCell label="HP" val={build.stats.hp} unit="WHP" accent={accent}/>
          <SpecCell label="TORQUE" val={build.stats.tq} unit="WLB-FT" accent={accent}/>
          <SpecCell label="WEIGHT" val={build.stats.weight} unit="LB" accent={accent}/>
          <SpecCell label="P/W" val={build.stats.ptw} unit="LB / HP" accent={accent}/>
        </div>
      </div>

      {/* STANDALONE ECU + TUNER CREDIT (only when present) */}
      {build.ecu && (
        <div style={{ padding: '24px 20px 0' }}>
          <SectionHeader label="ENGINE MANAGEMENT" accent={accent} sub="STANDALONE · TUNED BY"/>
          <TunerCard ecu={build.ecu} accent={accent}/>
        </div>
      )}

      {/* MOD LIST */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="MOD LIST" accent={accent} sub={`${build.mods.reduce((n,s)=>n+s.items.length,0)} ENTRIES · TAP TO INSPECT`}/>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {build.mods.map(sec => (
            <div key={sec.sec}>
              <Mono size={9} color={accent.primary} spacing="0.28em">{sec.sec}</Mono>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {sec.items.map((m, i) => <ModRow key={i} m={m} accent={accent}/>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TIMELINE */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="MILESTONES" accent={accent} sub="BUILD HISTORY · NEWEST FIRST"/>
        <div style={{ marginTop: 14, position: 'relative', paddingLeft: 16 }}>
          <div style={{ position: 'absolute', left: 4, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,0.1)' }}/>
          {build.milestones.map((m, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
              <div style={{
                position: 'absolute', left: -16, top: 4,
                width: 9, height: 9, background: i === 0 ? accent.primary : '#05060a',
                border: `1px solid ${accent.primary}`,
                boxShadow: i === 0 ? `0 0 8px ${accent.glow}` : 'none',
              }}/>
              <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.22em">{m.ts}</Mono>
              <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, fontWeight: 700, color: '#f5f6f7', marginTop: 2, letterSpacing: '-0.01em' }}>
                {m.label}
              </div>
              <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ marginTop: 2, display: 'block' }}>{m.detail}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* OWNER + SOCIAL FOOTER */}
      <div style={{ padding: '28px 20px 36px' }}>
        <Hairline color="rgba(255,255,255,0.08)"/>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #333, #111)',
            border: `1px solid ${accent.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 18, color: accent.primary,
          }}>{build.owner.user.charAt(1)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f6f7' }}>{build.owner.user}</div>
            <Mono size={9} color="rgba(201,204,209,0.5)">{build.owner.city} · {build.owner.joined}</Mono>
          </div>
          <BuildSocials socials={build.socials} accent={accent}/>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Hero photo with tag dots ───────────────────────────────────────────
function HeroPhoto({ build, accent, activeTag, setActiveTag }) {
  return (
    <div style={{
      position: 'relative', height: 320,
      background: `
        radial-gradient(ellipse at 50% 70%, ${build.hero.tone}55, transparent 60%),
        repeating-linear-gradient(135deg, #0a0b10 0 8px, #13141a 8px 9px, #0a0b10 9px 17px)
      `,
      overflow: 'hidden',
    }}>
      {/* simulated car silhouette */}
      <svg width="100%" height="100%" viewBox="0 0 320 320" style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="carGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1b22"/>
            <stop offset="100%" stopColor="#0a0b10"/>
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="280" rx="140" ry="14" fill={accent.primary} opacity="0.18"/>
        {/* simplified low-poly car shape */}
        <path d="M30 230 L60 180 L100 165 L140 145 L200 145 L240 160 L275 175 L290 200 L290 235 L260 245 L240 240 L80 240 L60 245 L30 235 Z"
          fill="url(#carGrad)" stroke={accent.primary} strokeOpacity="0.4" strokeWidth="0.5"/>
        {/* windows */}
        <path d="M105 170 L140 150 L195 150 L225 170 L210 190 L120 190 Z" fill="#05060a" stroke={accent.primary} strokeOpacity="0.25"/>
        {/* wheels */}
        <circle cx="90" cy="240" r="22" fill="#05060a" stroke={accent.primary} strokeWidth="1.5"/>
        <circle cx="90" cy="240" r="14" fill="#0a0b10" stroke={accent.primary} strokeOpacity="0.4"/>
        <circle cx="240" cy="240" r="22" fill="#05060a" stroke={accent.primary} strokeWidth="1.5"/>
        <circle cx="240" cy="240" r="14" fill="#0a0b10" stroke={accent.primary} strokeOpacity="0.4"/>
        {/* headlight */}
        <ellipse cx="280" cy="195" rx="6" ry="3" fill={accent.primary} opacity="0.7"/>
      </svg>

      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(p => (
        <div key={p} style={{
          position: 'absolute', width: 16, height: 16,
          borderColor: accent.primary, borderStyle: 'solid', borderWidth: 0,
          ...(p[0]==='t' ? { top: 10 } : { bottom: 10 }),
          ...(p[1]==='l' ? { left: 10 } : { right: 10 }),
          ...(p[0]==='t' ? { borderTopWidth: 1.5 } : { borderBottomWidth: 1.5 }),
          ...(p[1]==='l' ? { borderLeftWidth: 1.5 } : { borderRightWidth: 1.5 }),
        }}/>
      ))}

      {/* Tag dots */}
      {build.tags.map((t, i) => (
        <button key={i} onClick={() => setActiveTag(activeTag === i ? null : i)} style={{
          position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
          transform: 'translate(-50%, -50%)',
          appearance: 'none', cursor: 'pointer',
          width: 22, height: 22, borderRadius: '50%',
          background: activeTag === i ? accent.primary : 'rgba(5,6,10,0.85)',
          border: `1.5px solid ${accent.primary}`,
          boxShadow: `0 0 12px ${accent.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700,
            color: activeTag === i ? '#05060a' : accent.primary, lineHeight: 1,
          }}>{i + 1}</span>
        </button>
      ))}

      {/* Active tag tooltip */}
      {activeTag !== null && (
        <div style={{
          position: 'absolute', left: 12, right: 12, bottom: 56,
          padding: '10px 12px', background: '#05060a',
          border: `1px solid ${accent.primary}`,
          animation: 'aiSlideIn 0.18s ease-out',
        }}>
          <Mono size={9} color={accent.primary} spacing="0.22em">TAG {String(activeTag + 1).padStart(2, '0')}</Mono>
          <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, fontWeight: 700, color: '#f5f6f7', marginTop: 2 }}>
            {build.tags[activeTag].name}
          </div>
          <Mono size={9.5} color="rgba(201,204,209,0.6)" style={{ marginTop: 2, display: 'block' }}>{build.tags[activeTag].spec}</Mono>
        </div>
      )}
    </div>
  );
}

// ─── Tuner credit card (when standalone ECU present) ───────────────────
function TunerCard({ ecu, accent }) {
  const open = (e) => { e.stopPropagation(); if (ecu.tuner.ig) window.open(`https://instagram.com/${ecu.tuner.ig}`, '_blank'); };
  return (
    <div style={{
      marginTop: 10, position: 'relative',
      background: '#0a0b10', border: `0.5px solid ${accent.primary}50`,
      padding: '16px 16px',
    }}>
      {/* corner brackets */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: `1.5px solid ${accent.primary}`, borderLeft: `1.5px solid ${accent.primary}` }}/>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: `1.5px solid ${accent.primary}`, borderRight: `1.5px solid ${accent.primary}` }}/>

      {/* ECU row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">ECU · STANDALONE</Mono>
          <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 16, fontWeight: 700, color: '#f5f6f7', marginTop: 2, letterSpacing: '-0.01em' }}>
            {ecu.system}
          </div>
          <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }}>{ecu.map}</Mono>
        </div>
        <div style={{
          padding: '4px 8px', background: accent.soft,
          border: `0.5px solid ${accent.primary}`, alignSelf: 'flex-start',
        }}>
          <Mono size={8.5} color={accent.primary} weight={700} spacing="0.22em">CALIBRATED</Mono>
        </div>
      </div>

      {/* Tuner credit */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px dashed rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2a2b32, #0a0b10)',
          border: `1px solid ${accent.primary}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 13, color: accent.primary,
          flexShrink: 0,
        }}>{ecu.tuner.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.24em">TUNED BY</Mono>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, fontWeight: 700, color: '#f5f6f7', letterSpacing: '-0.005em' }}>
              {ecu.tuner.name}
            </span>
            {ecu.tuner.verified && (
              <span style={{
                width: 12, height: 12, background: accent.primary,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#05060a', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>
              </span>
            )}
          </div>
          <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }} spacing="0.16em">
            {ecu.tuner.shop} · {ecu.tuner.city}
          </Mono>
        </div>
        {ecu.tuner.ig && (
          <button onClick={open} style={{
            appearance: 'none', padding: '6px 10px',
            background: 'transparent', border: `0.5px solid ${accent.primary}`,
            color: accent.primary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            <Mono size={9} color={accent.primary} weight={700} spacing="0.2em">FOLLOW</Mono>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Spec cells ─────────────────────────────────────────────────────────
function SpecCell({ label, val, unit, accent }) {
  return (
    <div style={{
      padding: '14px 14px',
      borderRight: '0.5px solid rgba(255,255,255,0.08)',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    }}>
      <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">{label}</Mono>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
          color: '#f5f6f7', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
        }}>{val}</span>
        <Mono size={9} color={accent.primary} spacing="0.18em">{unit}</Mono>
      </div>
    </div>
  );
}

// ─── Mod row ────────────────────────────────────────────────────────────
function ModRow({ m, accent }) {
  return (
    <div style={{
      padding: '10px 0',
      borderTop: '0.5px solid rgba(255,255,255,0.06)',
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 600, color: '#f5f6f7' }}>
            {m.name}
          </span>
          {m.verified && (
            <span style={{
              padding: '1px 4px', background: accent.soft,
              border: `0.5px solid ${accent.primary}`,
            }}>
              <Mono size={7.5} color={accent.primary} weight={700} spacing="0.18em">✓ VERIFIED</Mono>
            </span>
          )}
        </div>
        <Mono size={9} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 3 }}>{m.spec}</Mono>
        <Mono size={8.5} color="rgba(201,204,209,0.35)" style={{ display: 'block', marginTop: 2 }} spacing="0.18em">
          {m.shop} · {m.ts}
        </Mono>
      </div>
      <button style={{ ...iconBtn(), width: 22, height: 22 }}>
        <svg width="10" height="10" viewBox="0 0 14 14"><path d="M5 2l6 5-6 5" stroke={accent.primary} strokeWidth="1.5" fill="none"/></svg>
      </button>
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────
function SectionHeader({ label, sub, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `0.5px solid ${accent.primary}50`, paddingBottom: 6 }}>
      <Mono size={11} color="#f5f6f7" weight={700} spacing="0.24em">{label}</Mono>
      {sub && <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.2em">{sub}</Mono>}
    </div>
  );
}

// ─── Build socials (row) ────────────────────────────────────────────────
function BuildSocials({ socials, accent }) {
  const open = (url) => (e) => { e.stopPropagation(); window.open(url, '_blank'); };
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {socials.ig && <SocialBtn onClick={open(`https://instagram.com/${socials.ig}`)} accent={accent}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
      </SocialBtn>}
      {socials.tt && <SocialBtn onClick={open(`https://tiktok.com/@${socials.tt}`)} accent={accent}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2v3.5a4.5 4.5 0 004.5 4.5V13a8 8 0 01-4.5-1.4V17a5 5 0 11-5-5h.5v3.2a1.8 1.8 0 101.8 1.8V2z"/></svg>
      </SocialBtn>}
      {socials.fb && <SocialBtn onClick={open(`https://facebook.com/${socials.fb}`)} accent={accent}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M14 7h3V3h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1z"/></svg>
      </SocialBtn>}
    </div>
  );
}
function SocialBtn({ children, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', width: 28, height: 28,
      background: 'transparent', border: '0.5px solid rgba(255,255,255,0.15)',
      color: accent.primary, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

function iconBtn() {
  return {
    appearance: 'none', width: 30, height: 30,
    background: 'transparent', border: '0.5px solid rgba(255,255,255,0.12)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// SCREEN: GARAGE DASHBOARD
// ──────────────────────────────────────────────────────────────────────────
function ScreenGarage({ tweaks, accent, onBack }) {
  const stats = {
    rank: 4, score: 847, swipesGiven: 312, swipesGot: 1042,
    promoteRate: 71, badges: 7, builds: 2,
  };

  const badges = [
    { id: 'verified', label: 'VERIFIED BUILD', icon: '◉', earned: true,  rarity: 'COMMON' },
    { id: 'featured', label: 'FEATURED · ISSUE 04', icon: '★', earned: true,  rarity: 'RARE' },
    { id: 'judge',    label: 'JUDGE · 50+ SWIPES',  icon: '∕∕', earned: true, rarity: 'COMMON' },
    { id: 'top10',    label: 'TOP 10 · MARCH',      icon: '#', earned: true,  rarity: 'EPIC' },
    { id: 'firstinv', label: 'FIRST INVITE',         icon: '+', earned: true,  rarity: 'COMMON' },
    { id: 'localrep', label: 'PNW REGIONAL',         icon: '⌖', earned: true,  rarity: 'RARE' },
    { id: 'verifiedshop', label: 'SHOP-VERIFIED',    icon: '✓', earned: true,  rarity: 'COMMON' },
    { id: 'monthly',  label: 'CROWN · TBD',          icon: '♛', earned: false, rarity: 'LEGENDARY' },
    { id: '100swipe', label: '100 SWIPES GIVEN',     icon: '×100', earned: false, rarity: 'COMMON' },
  ];

  const activity = [
    { ts: '2H', t: 'PROMOTED  ', sub: '@HEXBOX · 1989 BMW M3 (E30)' },
    { ts: '5H', t: 'NEW BADGE',  sub: 'TOP 10 · MARCH RANKINGS' },
    { ts: '1D', t: 'PROMOTED',   sub: '@KOSAKI · 1993 MAZDA RX-7' },
    { ts: '2D', t: 'MOD ADDED',  sub: 'TOMEI ARMS M8280 · VERIFIED' },
    { ts: '3D', t: 'INVITE SENT', sub: '+1 / 3 · @M_VOLT' },
  ];

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="GARAGE"/>

      {/* Identity card */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
          padding: '16px 18px', position: 'relative', overflow: 'hidden',
        }}>
          {/* corner brackets */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `1.5px solid ${accent.primary}`, borderLeft: `1.5px solid ${accent.primary}` }}/>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `1.5px solid ${accent.primary}`, borderRight: `1.5px solid ${accent.primary}` }}/>

          <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.24em">MEMBER · UG-0247</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 26, fontWeight: 700, color: '#f5f6f7', letterSpacing: '-0.02em' }}>
              @NOVA_K
            </span>
            <Mono size={10} color={accent.primary} spacing="0.2em">VERIFIED</Mono>
          </div>
          <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }}>
            SEATTLE · PNW-03 · EST. 2026.03
          </Mono>

          {/* Big stats row */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <BigStat label="RANK" val={`#${String(stats.rank).padStart(2, '0')}`} accent={accent} primary/>
            <BigStat label="SCORE" val={stats.score} accent={accent}/>
            <BigStat label="BUILDS" val={stats.builds} accent={accent}/>
          </div>
        </div>
      </div>

      {/* My builds carousel */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="MY BUILDS" accent={accent} sub="2 · TAP TO OPEN"/>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          <MiniBuildCard build={SAMPLE_BUILD} accent={accent} active/>
          <MiniBuildCard build={{...SAMPLE_BUILD, id:'civic-track', year:2002, model:'CIVIC EK', stats:{...SAMPLE_BUILD.stats, hp:240, rank: 18, score: 412}}} accent={accent}/>
          <button style={{
            minWidth: 140, height: 110, appearance: 'none',
            background: 'transparent', border: `0.5px dashed rgba(255,255,255,0.18)`,
            color: 'rgba(201,204,209,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 22, color: accent.primary, lineHeight: 1 }}>+</span>
            <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.2em">ADD BUILD</Mono>
          </button>
        </div>
      </div>

      {/* REV stats */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="REV · ACTIVITY" accent={accent} sub="LAST 30 DAYS"/>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatTile label="SWIPES GIVEN" val={stats.swipesGiven} sub="+47 THIS WK" accent={accent}/>
          <StatTile label="VOTES RECEIVED" val={stats.swipesGot} sub={`${stats.promoteRate}% PROMOTE`} accent={accent}/>
        </div>
      </div>

      {/* Badges grid */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="BADGES" accent={accent} sub={`${badges.filter(b=>b.earned).length} / ${badges.length} UNLOCKED`}/>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {badges.map(b => <Badge key={b.id} b={b} accent={accent}/>)}
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ padding: '24px 20px 36px' }}>
        <SectionHeader label="LOG" accent={accent} sub="RECENT"/>
        <div style={{ marginTop: 10 }}>
          {activity.map((a, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '38px 1fr',
              padding: '8px 0', borderTop: '0.5px solid rgba(255,255,255,0.06)',
              alignItems: 'center', gap: 8,
            }}>
              <Mono size={9} color={accent.primary} spacing="0.18em">{a.ts}</Mono>
              <div>
                <Mono size={10} color="#f5f6f7" weight={700} spacing="0.2em">{a.t}</Mono>
                <Mono size={9.5} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 1 }}>{a.sub}</Mono>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function BigStat({ label, val, accent, primary }) {
  return (
    <div style={{ borderRight: '0.5px solid rgba(255,255,255,0.06)', padding: '0 8px', textAlign: 'left' }}>
      <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">{label}</Mono>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
        color: primary ? accent.primary : '#f5f6f7', marginTop: 2, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
      }}>{val}</div>
    </div>
  );
}

function StatTile({ label, val, sub, accent }) {
  return (
    <div style={{
      padding: '12px 14px', background: '#0a0b10',
      border: '0.5px solid rgba(255,255,255,0.06)',
    }}>
      <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">{label}</Mono>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
        color: '#f5f6f7', marginTop: 4, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>{val}</div>
      <Mono size={9} color={accent.primary} style={{ display: 'block', marginTop: 4 }} spacing="0.18em">{sub}</Mono>
    </div>
  );
}

function Badge({ b, accent }) {
  const rarityColors = {
    COMMON: 'rgba(201,204,209,0.6)',
    RARE: '#5bbeff',
    EPIC: '#c47dff',
    LEGENDARY: '#ffd700',
  };
  const c = rarityColors[b.rarity];
  return (
    <div style={{
      padding: '12px 8px',
      background: b.earned ? '#0a0b10' : 'transparent',
      border: `0.5px solid ${b.earned ? c + '60' : 'rgba(255,255,255,0.06)'}`,
      opacity: b.earned ? 1 : 0.35,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      textAlign: 'center', position: 'relative',
    }}>
      <div style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${b.earned ? c : 'rgba(255,255,255,0.1)'}`,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 700,
        color: b.earned ? c : 'rgba(201,204,209,0.3)',
        boxShadow: b.earned ? `0 0 10px ${c}30` : 'none',
      }}>{b.icon}</div>
      <Mono size={7.5} color={b.earned ? '#f5f6f7' : 'rgba(201,204,209,0.5)'} weight={700} spacing="0.16em" style={{ lineHeight: 1.2 }}>
        {b.label}
      </Mono>
      {b.earned && <Mono size={7} color={c} spacing="0.2em">{b.rarity}</Mono>}
    </div>
  );
}

function MiniBuildCard({ build, accent, active }) {
  return (
    <div style={{
      minWidth: 160, padding: 10,
      background: active ? `linear-gradient(135deg, ${accent.soft}, transparent)` : '#0a0b10',
      border: `0.5px solid ${active ? accent.primary : 'rgba(255,255,255,0.08)'}`,
      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        height: 56, background: `repeating-linear-gradient(135deg, #0a0b10 0 6px, #13141a 6px 7px)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 60% 60%, ${accent.soft}, transparent 70%)` }}/>
        <div style={{ position: 'absolute', top: 4, right: 4 }}>
          <Mono size={8} color={accent.primary} spacing="0.2em" weight={700}>#{String(build.stats.rank).padStart(2,'0')}</Mono>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 11, fontWeight: 700, color: '#f5f6f7', letterSpacing: '-0.01em' }}>
          {build.year} {build.model}
        </div>
        <Mono size={8} color={accent.primary} spacing="0.2em">{build.stats.hp} WHP · {build.stats.score} PTS</Mono>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SCREEN: QR MEMBER ID
// ──────────────────────────────────────────────────────────────────────────
function ScreenQR({ tweaks, accent, onBack }) {
  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="MEMBER ID"/>

      <div style={{ padding: '12px 24px 0' }}>
        <Mono size={10} color={accent.primary}>∕∕ SCAN AT MEETS</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 28, fontWeight: 700,
          lineHeight: 1.0, color: '#f5f6f7', margin: '12px 0 0', letterSpacing: '-0.02em',
        }}>Your build,<br/>one tap away.</h1>
        <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10 }}>
          Print on dash, window, or hand it over. Scanners see your full feature page.
        </Mono>
      </div>

      {/* QR card */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{
          background: '#0a0b10', border: `0.5px solid ${accent.primary}50`,
          padding: 18, position: 'relative',
        }}>
          {/* tick corners */}
          {['tl','tr','bl','br'].map(p => (
            <div key={p} style={{
              position: 'absolute', width: 14, height: 14,
              borderColor: accent.primary, borderStyle: 'solid', borderWidth: 0,
              ...(p[0]==='t' ? { top: 0 } : { bottom: 0 }),
              ...(p[1]==='l' ? { left: 0 } : { right: 0 }),
              ...(p[0]==='t' ? { borderTopWidth: 2 } : { borderBottomWidth: 2 }),
              ...(p[1]==='l' ? { borderLeftWidth: 2 } : { borderRightWidth: 2 }),
            }}/>
          ))}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">UNDERGROUND GALLERY</Mono>
              <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f6f7', marginTop: 2 }}>
                @NOVA_K
              </div>
            </div>
            <AILogo size={28} color={accent.primary}/>
          </div>

          {/* QR */}
          <div style={{ marginTop: 16, padding: 14, background: '#f5f6f7', position: 'relative' }}>
            <FakeQR accent={accent}/>
            {/* center logo */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 36, height: 36, background: '#05060a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AILogo size={20} color={accent.primary}/>
            </div>
          </div>

          {/* Build identifier */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">BUILD</Mono>
              <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 700, color: '#f5f6f7', marginTop: 2 }}>
                1999 SKYLINE GT-R · BNR34
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">RANK</Mono>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, color: accent.primary, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                #04 · 847 PTS
              </div>
            </div>
          </div>

          {/* permanent URL */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px dashed rgba(255,255,255,0.12)' }}>
            <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">PERMANENT LINK</Mono>
            <Mono size={10} color={accent.primary} style={{ display: 'block', marginTop: 2 }}>
              UG.GALLERY/NOVA_K/R34
            </Mono>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ActionTile icon="↓" label="DOWNLOAD" sub="PNG · PRINT" accent={accent}/>
        <ActionTile icon="↗" label="SHARE" sub="STORY · POST · SHEET" accent={accent}/>
      </div>

      <div style={{ padding: '12px 24px 36px' }}>
        <Mono size={9} color="rgba(201,204,209,0.4)" spacing="0.2em" style={{ display: 'block', textAlign: 'center' }}>
          MEMBER-ONLY · ANYONE WITH LINK CAN VIEW BUILD
        </Mono>
      </div>
    </ScreenShell>
  );
}

// Pseudo QR pattern (deterministic noise)
function FakeQR({ accent }) {
  const SIZE = 25;
  const cells = React.useMemo(() => {
    // simple deterministic pattern; finder squares at corners
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    // pseudo-random fill
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      grid[r][c] = ((r * 31 + c * 17 + r*c) % 7 < 3) ? 1 : 0;
    }
    // finder
    const finder = (r0, c0) => {
      for (let r = r0; r < r0 + 7; r++) for (let c = c0; c < c0 + 7; c++) {
        if (r === r0 || r === r0+6 || c === c0 || c === c0+6) grid[r][c] = 1;
        else if (r >= r0+2 && r <= r0+4 && c >= c0+2 && c <= c0+4) grid[r][c] = 1;
        else grid[r][c] = 0;
      }
    };
    finder(0, 0); finder(0, SIZE-7); finder(SIZE-7, 0);
    return grid;
  }, []);
  const cell = 100 / SIZE;
  return (
    <svg width="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
      <rect width="100" height="100" fill="#f5f6f7"/>
      {cells.map((row, r) => row.map((v, c) => v ? (
        <rect key={`${r}-${c}`} x={c*cell} y={r*cell} width={cell} height={cell} fill="#05060a"/>
      ) : null))}
    </svg>
  );
}

function ActionTile({ icon, label, sub, accent }) {
  return (
    <button style={{
      appearance: 'none', padding: '14px 12px',
      background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.1)',
      cursor: 'pointer', textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Mono size={11} color="#f5f6f7" weight={700} spacing="0.22em">{label}</Mono>
        <span style={{ fontSize: 16, color: accent.primary, lineHeight: 1 }}>{icon}</span>
      </div>
      <Mono size={9} color="rgba(201,204,209,0.45)" spacing="0.2em">{sub}</Mono>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SCREEN: SHOP PAGE (verified vendor)
// ──────────────────────────────────────────────────────────────────────────
function ScreenShop({ tweaks, accent, onBack }) {
  const shop = {
    name: 'BOOST DEPOT',
    tagline: 'TURBO + ENGINE BUILDS · EST. 2008',
    city: 'KENT, WA',
    verified: true,
    rating: 4.9,
    builds: 47,
    parts: 'JDM TURBO · 2JZ · RB · K-SERIES',
    discount: 'UG-NOVA10 · 10% OFF',
    member: '@RAY.TURBO',
  };

  const partsUsed = [
    { name: 'TOMEI ARMS M8280', use: '14 BUILDS' },
    { name: 'PRECISION 6870 GEN2', use: '9 BUILDS' },
    { name: 'GARRETT G35-1050', use: '7 BUILDS' },
    { name: 'BORG WARNER EFR 9180', use: '5 BUILDS' },
  ];

  const recentBuilds = [
    { user: '@NOVA_K', car: '1999 SKYLINE GT-R', work: 'TURBO + 2.8L STROKER' },
    { user: '@HEXBOX', car: '2003 EVO VIII', work: 'EFR 8374 SWAP' },
    { user: '@LATEAPEX', car: '2003 MUSTANG COBRA', work: 'PRECISION 7675' },
  ];

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={onBack} step="SHOP"/>

      {/* Shop hero */}
      <div style={{ position: 'relative', padding: '14px 20px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.08)',
          padding: '20px 18px', position: 'relative', overflow: 'hidden',
        }}>
          {/* diagonal stripe accent */}
          <div style={{
            position: 'absolute', top: -20, right: -40, width: 120, height: 120,
            background: `repeating-linear-gradient(45deg, transparent 0 6px, ${accent.soft} 6px 7px)`,
            opacity: 0.6,
          }}/>

          {shop.verified && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px',
              background: accent.soft, border: `0.5px solid ${accent.primary}`, marginBottom: 10 }}>
              <div style={{ width: 5, height: 5, background: accent.primary, borderRadius: '50%' }}/>
              <Mono size={9} color={accent.primary} weight={700} spacing="0.22em">UG VERIFIED SHOP</Mono>
            </div>
          )}

          <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 26, fontWeight: 800, color: '#f5f6f7', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {shop.name}
          </div>
          <Mono size={9.5} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 6 }}>
            {shop.tagline} · {shop.city}
          </Mono>

          {/* Stats row */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <BigStat label="RATING" val={shop.rating} accent={accent} primary/>
            <BigStat label="BUILDS" val={shop.builds} accent={accent}/>
            <BigStat label="MEMBER" val="UG-04" accent={accent}/>
          </div>

          {/* Discount strip */}
          <div style={{
            marginTop: 14, padding: '10px 12px',
            background: '#05060a', border: `1px dashed ${accent.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <div>
              <Mono size={8.5} color="rgba(201,204,209,0.5)" spacing="0.22em">MEMBER PERK</Mono>
              <Mono size={11} color={accent.primary} weight={700} spacing="0.18em" style={{ display: 'block', marginTop: 2 }}>
                {shop.discount}
              </Mono>
            </div>
            <button style={{
              appearance: 'none', padding: '6px 10px', background: accent.primary,
              border: 'none', cursor: 'pointer',
            }}>
              <Mono size={9.5} color="#05060a" weight={700} spacing="0.2em">COPY CODE</Mono>
            </button>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="SPECIALTIES" accent={accent}/>
        <Mono size={11} color="#f5f6f7" style={{ display: 'block', marginTop: 10 }} spacing="0.18em">
          {shop.parts}
        </Mono>
      </div>

      {/* Top parts */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionHeader label="MOST INSTALLED" accent={accent} sub="LAST 12 MONTHS"/>
        <div style={{ marginTop: 10 }}>
          {partsUsed.map((p, i) => (
            <div key={i} style={{
              padding: '10px 0', borderTop: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 600, color: '#f5f6f7' }}>{p.name}</div>
              <Mono size={9} color={accent.primary} style={{ display: 'block', marginTop: 2 }} spacing="0.18em">{p.use}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* Recent builds */}
      <div style={{ padding: '24px 20px 36px' }}>
        <SectionHeader label="RECENT BUILDS" accent={accent} sub="VERIFIED · TAP TO VIEW"/>
        <div style={{ marginTop: 10 }}>
          {recentBuilds.map((b, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
              padding: '10px 0', borderTop: '0.5px solid rgba(255,255,255,0.06)', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 600, color: '#f5f6f7' }}>{b.car}</div>
                <Mono size={9} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 2 }} spacing="0.16em">{b.user} · {b.work}</Mono>
              </div>
              <button style={{ ...iconBtn(), width: 24, height: 24 }}>
                <svg width="10" height="10" viewBox="0 0 14 14"><path d="M5 2l6 5-6 5" stroke={accent.primary} strokeWidth="1.5" fill="none"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  ScreenBuildPage, ScreenGarage, ScreenQR, ScreenShop, SAMPLE_BUILD,
});
