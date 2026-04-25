// car-show.jsx — Underground Gallery · Virtual Car Show
// Tinder-style swipe voting + ranked leaderboard
// Uses globals: Mono, Hairline, AILogo, ACCENTS, surfaceBg, grainURL,
//               ScreenShell, TopBar, CTAButton, StripedPlaceholder

const SHOW_CARS = [
  { id: 'r34',     model: '1999 NISSAN SKYLINE GT-R',  build: 'R34 · STREET',  user: '@NOVA_K',     city: 'SEATTLE, WA',    hp: 612, votes: 847,  socials: { ig: 'nova_k.r34',    tt: 'nova_k',     fb: 'nova.k.builds' } },
  { id: 'e30',     model: '1989 BMW M3',                build: 'E30 · TRACK',   user: '@HEXBOX',     city: 'AUSTIN, TX',     hp: 380, votes: 1042, socials: { ig: 'hexbox.e30',    tt: 'hexbox',     fb: null } },
  { id: 'rx7',     model: '1993 MAZDA RX-7',            build: 'FD3S · STANCE', user: '@KOSAKI',     city: 'PORTLAND, OR',   hp: 540, votes: 612,  socials: { ig: 'kosaki.fd',     tt: 'kosaki.rotary', fb: 'kosaki.builds' } },
  { id: 'porsche', model: '1995 PORSCHE 993 RS',        build: 'AIR-COOLED',    user: '@WIDEBODY',   city: 'MIAMI, FL',      hp: 295, votes: 1218, socials: { ig: 'widebody.air',  tt: null,         fb: 'widebody.miami' } },
  { id: 'civic',   model: '2000 HONDA CIVIC EK',        build: 'B18 SWAP · K',  user: '@APEX_11',    city: 'SAN JOSE, CA',   hp: 240, votes: 318,  socials: { ig: 'apex_11.ek',    tt: 'apex11',     fb: null } },
  { id: 'svt',     model: '2003 FORD MUSTANG COBRA',    build: 'TERMINATOR',    user: '@LATEAPEX',   city: 'DETROIT, MI',    hp: 720, votes: 489,  socials: { ig: 'lateapex.svt',  tt: 'lateapex',   fb: 'lateapex.detroit' } },
];

function SocialIcons({ socials, accent, size = 18 }) {
  if (!socials) return null;
  const open = (url) => (e) => { e.stopPropagation(); window.open(url, '_blank'); };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {socials.ig && (
        <button onClick={open(`https://instagram.com/${socials.ig}`)} title={`@${socials.ig}`} style={socialBtnStyle(size, accent)}>
          <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </button>
      )}
      {socials.tt && (
        <button onClick={open(`https://tiktok.com/@${socials.tt}`)} title={`@${socials.tt}`} style={socialBtnStyle(size, accent)}>
          <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill="currentColor"><path d="M16 2v3.5a4.5 4.5 0 004.5 4.5V13a8 8 0 01-4.5-1.4V17a5 5 0 11-5-5h.5v3.2a1.8 1.8 0 101.8 1.8V2z"/></svg>
        </button>
      )}
      {socials.fb && (
        <button onClick={open(`https://facebook.com/${socials.fb}`)} title={socials.fb} style={socialBtnStyle(size, accent)}>
          <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill="currentColor"><path d="M14 7h3V3h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1z"/></svg>
        </button>
      )}
    </div>
  );
}

function socialBtnStyle(size, accent) {
  return {
    appearance: 'none', width: size + 12, height: size + 12,
    background: 'transparent', border: `0.5px solid rgba(255,255,255,0.15)`,
    color: accent.primary, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s',
  };
}

function ScreenCarShow({ tweaks, accent, onBack }) {
  const [view, setView] = React.useState('swipe'); // swipe | leaderboard
  const [stack, setStack] = React.useState(SHOW_CARS);
  const [scores, setScores] = React.useState(() => {
    const s = {}; SHOW_CARS.forEach(c => s[c.id] = c.votes); return s;
  });
  const [drag, setDrag] = React.useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = React.useState(null); // 'up' | 'down' | null
  const [lastVote, setLastVote] = React.useState(null); // {id, dir}

  const top = stack[0];
  const next = stack[1];

  const commitVote = (dir) => {
    if (!top || exiting) return;
    setExiting(dir);
    setScores(s => ({ ...s, [top.id]: s[top.id] + (dir === 'up' ? 50 : -25) }));
    setLastVote({ id: top.id, dir });
    setTimeout(() => {
      setStack(prev => [...prev.slice(1), prev[0]]);
      setDrag({ x: 0, y: 0, active: false });
      setExiting(null);
    }, 280);
  };

  // Drag handlers
  const startRef = React.useRef({ x: 0, y: 0 });
  const onPointerDown = (e) => {
    if (exiting) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.active) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      active: true,
    });
  };
  const onPointerUp = () => {
    if (!drag.active) return;
    const threshold = 90;
    if (drag.y < -threshold) commitVote('up');
    else if (drag.y > threshold) commitVote('down');
    else setDrag({ x: 0, y: 0, active: false });
  };

  // Card transform
  const dragRot = drag.x * 0.06;
  const cardTransform = exiting === 'up'
    ? 'translate(0, -120%) rotate(-6deg)'
    : exiting === 'down'
      ? 'translate(0, 120%) rotate(6deg)'
      : `translate(${drag.x}px, ${drag.y}px) rotate(${dragRot}deg)`;

  const voteIntent = drag.y < -40 ? 'up' : (drag.y > 40 ? 'down' : null);

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      {/* Top bar with tab toggle */}
      <div style={{
        padding: '14px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', background: 'transparent', border: 'none', padding: 6, margin: -6,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L3 7l6 5" stroke={accent.primary} strokeWidth="1.8" strokeLinecap="square"/>
          </svg>
          <Mono size={9.5} color="rgba(201,204,209,0.7)">BACK</Mono>
        </button>
        <Mono size={10} color={accent.primary} weight={700} spacing="0.24em">VIRTUAL CAR SHOW</Mono>
        <div style={{ width: 30 }}/>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', padding: '12px 20px 0', gap: 0 }}>
        {[{id:'swipe', l:'JUDGE'}, {id:'leaderboard', l:'RANKED'}].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            appearance: 'none', flex: 1, padding: '10px 0',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${view === t.id ? accent.primary : 'rgba(255,255,255,0.08)'}`,
          }}>
            <Mono size={10.5} color={view === t.id ? '#f5f6f7' : 'rgba(201,204,209,0.4)'}
              weight={view === t.id ? 700 : 500} spacing="0.24em">{t.l}</Mono>
          </button>
        ))}
      </div>

      {view === 'swipe' && (
        <SwipeView
          top={top} next={next} drag={drag} cardTransform={cardTransform}
          voteIntent={voteIntent} accent={accent}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onVote={commitVote}
          lastVote={lastVote} scoreFor={(id) => scores[id]}
        />
      )}

      {view === 'leaderboard' && (
        <Leaderboard scores={scores} accent={accent} cars={SHOW_CARS} highlight={lastVote?.id}/>
      )}
    </ScreenShell>
  );
}

// ─── Swipe view ─────────────────────────────────────────────────────────
function SwipeView({ top, next, drag, cardTransform, voteIntent, accent,
                     onPointerDown, onPointerMove, onPointerUp, onVote, lastVote, scoreFor }) {
  if (!top) return null;
  return (
    <>
      {/* Stack area */}
      <div style={{ position: 'relative', padding: '20px 20px 0', flex: 1, minHeight: 460 }}>
        {/* Background card (next) */}
        {next && (
          <div style={{
            position: 'absolute', inset: '20px 28px 0', zIndex: 1,
            transform: 'scale(0.94) translateY(8px)', opacity: 0.6,
          }}>
            <CarCard car={next} accent={accent} score={scoreFor(next.id)} muted/>
          </div>
        )}
        {/* Top draggable card */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'absolute', inset: '20px 20px 0', zIndex: 2,
            transform: cardTransform,
            transition: drag.active ? 'none' : 'transform 0.3s cubic-bezier(.2,.8,.2,1)',
            cursor: drag.active ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <CarCard car={top} accent={accent} score={scoreFor(top.id)} voteIntent={voteIntent}/>
        </div>
      </div>

      {/* Swipe hint + buttons */}
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => onVote('down')} style={voteBtnStyle(false, accent)}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 6l6 6 6-6" stroke="rgba(201,204,209,0.7)" strokeWidth="2" fill="none" strokeLinecap="square"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">SWIPE UP TO PROMOTE · DOWN TO PASS</Mono>
        </div>
        <button onClick={() => onVote('up')} style={voteBtnStyle(true, accent)}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M14 10L8 4 2 10" stroke="#05060a" strokeWidth="2" fill="none" strokeLinecap="square"/></svg>
        </button>
      </div>

      {lastVote && (
        <div style={{ padding: '12px 20px 0', textAlign: 'center' }}>
          <Mono size={9} color={lastVote.dir === 'up' ? accent.primary : 'rgba(201,204,209,0.5)'} spacing="0.24em">
            {lastVote.dir === 'up' ? '◉ +50 RANK · PROMOTED' : '× -25 RANK · PASSED'}
          </Mono>
        </div>
      )}

      <div style={{ height: 24 }}/>
    </>
  );
}

function voteBtnStyle(isUp, accent) {
  return {
    appearance: 'none',
    width: 52, height: 52,
    background: isUp ? accent.primary : 'transparent',
    border: `1px solid ${isUp ? accent.primary : 'rgba(255,255,255,0.18)'}`,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: isUp ? `0 0 24px ${accent.soft}` : 'none',
    transition: 'transform 0.12s',
  };
}

// ─── Car card ───────────────────────────────────────────────────────────
function CarCard({ car, accent, score, voteIntent, muted }) {
  return (
    <div style={{
      position: 'relative',
      background: '#0a0b10',
      border: `1px solid ${voteIntent === 'up' ? accent.primary : voteIntent === 'down' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
      boxShadow: voteIntent === 'up' ? `0 0 30px ${accent.glow}` : 'none',
      overflow: 'hidden', transition: 'border-color 0.12s, box-shadow 0.12s',
      userSelect: 'none',
    }}>
      {/* Photo */}
      <div style={{
        height: 280, position: 'relative',
        background: `repeating-linear-gradient(135deg, #0a0b10 0 8px, #13141a 8px 9px, #0a0b10 9px 17px)`,
      }}>
        <div style={{ position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${accent.soft}, transparent 70%)` }}/>

        {/* Vote intent overlays */}
        {voteIntent === 'up' && (
          <div style={{
            position: 'absolute', top: 16, right: 16, padding: '8px 14px',
            background: accent.primary, color: '#05060a',
            transform: 'rotate(8deg)',
          }}>
            <Mono size={14} color="#05060a" weight={700} spacing="0.24em">PROMOTE</Mono>
          </div>
        )}
        {voteIntent === 'down' && (
          <div style={{
            position: 'absolute', top: 16, left: 16, padding: '8px 14px',
            background: 'rgba(255,255,255,0.95)', color: '#05060a',
            transform: 'rotate(-8deg)',
          }}>
            <Mono size={14} color="#05060a" weight={700} spacing="0.24em">PASS</Mono>
          </div>
        )}

        {/* Corner brackets */}
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

        <Mono size={9} color="rgba(201,204,209,0.45)" style={{ position: 'absolute', bottom: 12, left: 14 }}>
          ENTRY · {car.id.toUpperCase()}
        </Mono>
        <Mono size={9} color="rgba(201,204,209,0.45)" style={{ position: 'absolute', bottom: 12, right: 14 }}>
          {car.hp} HP
        </Mono>
      </div>

      {/* Caption */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 18, fontWeight: 700,
          color: '#f5f6f7', letterSpacing: '-0.01em', lineHeight: 1.15,
        }}>{car.model}</div>
        <Mono size={10} color={accent.primary} style={{ marginTop: 4, display: 'block' }}>
          {car.build}
        </Mono>

        <Hairline color="rgba(255,255,255,0.06)" style={{ margin: '12px 0' }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #333, #111)',
            border: `1px solid ${accent.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 11, color: accent.primary,
          }}>{car.user.charAt(1)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, color: '#f5f6f7', fontWeight: 600 }}>
              {car.user}
            </span>
            <Mono size={9} color="rgba(201,204,209,0.5)">{car.city}</Mono>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">RANK SCORE</Mono>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 700,
              color: accent.primary, letterSpacing: '0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}>{score}</div>
          </div>
        </div>

        {/* Socials */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">FOLLOW THE BUILD</Mono>
          <SocialIcons socials={car.socials} accent={accent}/>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard ────────────────────────────────────────────────────────
function Leaderboard({ scores, accent, cars, highlight }) {
  const ranked = [...cars].sort((a, b) => scores[b.id] - scores[a.id]);
  const max = Math.max(...Object.values(scores));
  return (
    <div style={{ padding: '16px 20px 24px', flex: 1, overflow: 'auto' }} className="no-scrollbar">
      <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.24em" style={{ display: 'block', marginBottom: 12 }}>
        TOP {ranked.length} · UPDATES LIVE
      </Mono>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ranked.map((car, i) => {
          const pct = (scores[car.id] / max) * 100;
          const isTop = i === 0;
          const flash = highlight === car.id;
          return (
            <div key={car.id} style={{
              position: 'relative',
              background: isTop ? `linear-gradient(90deg, ${accent.soft}, transparent 60%)` : '#0a0b10',
              border: `0.5px solid ${isTop ? accent.primary : (flash ? accent.primary : 'rgba(255,255,255,0.06)')}`,
              padding: '12px 14px',
              display: 'grid', gridTemplateColumns: '34px 40px 1fr auto', gap: 12, alignItems: 'center',
              transition: 'border-color 0.3s',
            }}>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: isTop ? 22 : 16, fontWeight: 700,
                color: isTop ? accent.primary : 'rgba(201,204,209,0.5)',
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>{String(i + 1).padStart(2, '0')}</div>

              <div style={{
                width: 40, height: 28,
                background: `repeating-linear-gradient(135deg, #0a0b10 0 4px, #13141a 4px 5px)`,
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', inset: 0,
                  background: `radial-gradient(circle at 60% 50%, ${accent.soft}, transparent 70%)` }}/>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 600,
                  color: '#f5f6f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {car.model.split(' ').slice(1).join(' ')}
                </div>
                <Mono size={8.5} color="rgba(201,204,209,0.5)" style={{ marginTop: 2, display: 'block' }}>
                  {car.user} · {car.city}
                </Mono>
                <div style={{ marginTop: 6, height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: accent.primary,
                    boxShadow: `0 0 6px ${accent.primary}`, transition: 'width 0.4s' }}/>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 15, fontWeight: 700,
                  color: isTop ? accent.primary : '#f5f6f7', letterSpacing: '0.04em',
                  fontVariantNumeric: 'tabular-nums',
                }}>{scores[car.id]}</div>
                <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.18em">PTS</Mono>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', border: '0.5px dashed rgba(255,255,255,0.12)' }}>
        <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.18em">
          MONTHLY WINNER · CROWNED 1ST OF EACH MONTH
        </Mono>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCarShow });
