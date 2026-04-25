// request-flow.jsx — Request Access steps
// Globals: Mono, Hairline, ACCENTS, ScreenShell, TopBar, CTAButton, IOSFrame

// Step 0: Socials
function RAStepIdentity({ accent, data, setData }) {
  const setSoc = (k, v) => setData(d => ({ ...d, socials: { ...d.socials, [k]: v } }));
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <h1 style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 26, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
        margin: '6px 0 0', letterSpacing: '-0.02em',
      }}>Show us your<br/>build presence.</h1>
      <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10, lineHeight: 1.6 }}>
        Reviewers cross-reference at least one public profile.
      </Mono>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RASocialField icon="ig" prefix="@" placeholder="instagram handle" required value={data.socials.ig} onChange={(v) => setSoc('ig', v)} accent={accent}/>
        <RASocialField icon="tt" prefix="@" placeholder="tiktok handle" value={data.socials.tt} onChange={(v) => setSoc('tt', v)} accent={accent}/>
        <RASocialField icon="fb" prefix="" placeholder="facebook username" value={data.socials.fb} onChange={(v) => setSoc('fb', v)} accent={accent}/>
      </div>
    </div>
  );
}

function RASocialField({ icon, prefix, placeholder, required, value, onChange, accent }) {
  const icons = {
    ig: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
    tt: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2v3.5a4.5 4.5 0 004.5 4.5V13a8 8 0 01-4.5-1.4V17a5 5 0 11-5-5h.5v3.2a1.8 1.8 0 101.8 1.8V2z"/></svg>,
    fb: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 7h3V3h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1z"/></svg>,
  };
  const filled = !!value;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', background: '#0a0b10',
      border: `1px solid ${filled ? accent.primary : 'rgba(255,255,255,0.08)'}`,
    }}>
      <span style={{ color: filled ? accent.primary : 'rgba(201,204,209,0.45)', display: 'flex' }}>{icons[icon]}</span>
      {prefix && <Mono size={11} color="rgba(201,204,209,0.5)">{prefix}</Mono>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#f5f6f7',
        letterSpacing: '0.04em', minWidth: 0,
      }}/>
      {required && !filled && <Mono size={8.5} color="rgba(201,204,209,0.4)" spacing="0.22em">REQUIRED</Mono>}
      {filled && <Mono size={9} color={accent.primary} spacing="0.2em">LINKED</Mono>}
    </div>
  );
}

// Step 1: 3 photos
function RAStepPhotos({ accent, data, setData }) {
  const setPh = (id) => setData(d => ({ ...d, photos: { ...d.photos, [id]: !d.photos[id] } }));
  const slots = [
    { id: 'exterior', label: 'EXTERIOR', sub: 'Three-quarter · daylight' },
    { id: 'interior', label: 'INTERIOR', sub: 'Driver POV · dash + wheel' },
    { id: 'engine',   label: 'ENGINE',   sub: 'Bay open · clean shot' },
  ];
  const filled = Object.values(data.photos).filter(Boolean).length;
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <h1 style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 26, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
        margin: '6px 0 0', letterSpacing: '-0.02em',
      }}>Three photos.<br/>Make them count.</h1>
      <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10 }} spacing="0.22em">
        {filled} / 3 SUBMITTED
      </Mono>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slots.map(s => (
          <button key={s.id} onClick={() => setPh(s.id)} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left',
            display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 12, alignItems: 'center',
            padding: 8, background: '#0a0b10',
            border: `1px solid ${data.photos[s.id] ? accent.primary : 'rgba(255,255,255,0.08)'}`,
          }}>
            <div style={{
              width: 72, height: 56,
              background: data.photos[s.id]
                ? `radial-gradient(ellipse at 60% 60%, ${accent.soft}, transparent 70%), repeating-linear-gradient(135deg, #0a0b10 0 6px, #13141a 6px 7px)`
                : 'repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.04) 6px 7px)',
              border: `0.5px solid ${data.photos[s.id] ? accent.primary : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {data.photos[s.id] ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={accent.primary} strokeWidth="2"><path d="M4 9l4 4 7-8"/></svg>
              ) : (
                <span style={{ fontSize: 22, color: 'rgba(201,204,209,0.4)', lineHeight: 1, fontFamily: 'monospace' }}>+</span>
              )}
            </div>
            <div>
              <Mono size={11} color={data.photos[s.id] ? '#f5f6f7' : 'rgba(201,204,209,0.7)'} weight={700} spacing="0.22em">{s.label}</Mono>
              <Mono size={9} color="rgba(201,204,209,0.45)" style={{ display: 'block', marginTop: 2 }}>{s.sub}</Mono>
            </div>
            <Mono size={9} color={data.photos[s.id] ? accent.primary : 'rgba(201,204,209,0.4)'} spacing="0.2em">{data.photos[s.id] ? 'UPLOADED' : 'TAP'}</Mono>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 2: Mods
function RAStepMods({ accent, data, setData }) {
  const update = (i, key, val) => setData(d => ({
    ...d, mods: d.mods.map((x, j) => j === i ? { ...x, [key]: val } : x),
  }));
  const add = () => setData(d => ({ ...d, mods: [...d.mods, { sec: 'OTHER', name: '', shop: '' }] }));
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <h1 style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 26, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
        margin: '6px 0 0', letterSpacing: '-0.02em',
      }}>List your top<br/>mods for review.</h1>
      <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10, lineHeight: 1.6 }}>
        At least one entry. Reviewers verify against shop records.
      </Mono>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.mods.map((m, i) => (
          <div key={i} style={{
            padding: '12px 14px', background: '#0a0b10',
            border: `1px solid ${m.name ? accent.primary + '60' : 'rgba(255,255,255,0.08)'}`,
          }}>
            <Mono size={9} color={accent.primary} spacing="0.24em">{m.sec}</Mono>
            <input value={m.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Part / brand / model" style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#f5f6f7',
              padding: '6px 0 4px', fontWeight: 600,
            }}/>
            <Hairline color="rgba(255,255,255,0.06)"/>
            <input value={m.shop} onChange={(e) => update(i, 'shop', e.target.value)} placeholder="installed by · shop name" style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(201,204,209,0.7)',
              padding: '6px 0 0', letterSpacing: '0.06em',
            }}/>
          </div>
        ))}
        <button onClick={add} style={{
          appearance: 'none', cursor: 'pointer',
          padding: '12px', background: 'transparent',
          border: '0.5px dashed rgba(255,255,255,0.18)',
        }}>
          <Mono size={10} color={accent.primary} weight={700} spacing="0.22em">+ ADD ANOTHER MOD</Mono>
        </button>
      </div>
    </div>
  );
}

// Step 3: Submitted
function RAStepSubmitted({ accent }) {
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <h1 style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 30, fontWeight: 700, lineHeight: 0.95, color: '#f5f6f7',
        margin: '6px 0 0', letterSpacing: '-0.025em',
      }}>In the queue.</h1>
      <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10, lineHeight: 1.6 }}>
        Three veterans will look at your submission.<br/>We'll text you when they're done.
      </Mono>

      <div style={{ marginTop: 22, padding: '16px 18px', background: '#0a0b10',
        border: `0.5px solid ${accent.primary}50`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `1.5px solid ${accent.primary}`, borderLeft: `1.5px solid ${accent.primary}` }}/>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `1.5px solid ${accent.primary}`, borderRight: `1.5px solid ${accent.primary}` }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.24em">QUEUE POSITION</Mono>
          <Mono size={9} color={accent.primary} spacing="0.22em">EST. 36–48H</Mono>
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 36, fontWeight: 700,
          color: '#f5f6f7', marginTop: 6, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
        }}>#0247</div>
        <Mono size={9.5} color="rgba(201,204,209,0.5)" style={{ display: 'block', marginTop: 8 }} spacing="0.22em">
          OF 312 PENDING · LAST APPROVED 4H AGO
        </Mono>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px dashed rgba(255,255,255,0.12)' }}>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em" style={{ display: 'block' }}>WHILE YOU WAIT</Mono>
          <Mono size={9.5} color="rgba(201,204,209,0.65)" style={{ display: 'block', marginTop: 6, lineHeight: 1.7 }}>
            · Have a member vouch via DM — cuts queue time in half.<br/>
            · Add more photos to your IG. Reviewers check.<br/>
            · Don't ask twice. We see it.
          </Mono>
        </div>
      </div>
    </div>
  );
}

// Step: SMS Verification — proves it's a real human + real phone
function RAStepVerify({ accent, data, setData }) {
  const [phase, setPhase] = React.useState(data.verify?.phase || 'enter'); // enter | sent | verified
  const [phone, setPhone] = React.useState(data.verify?.phone || '');
  const [code, setCode] = React.useState(data.verify?.code || ['', '', '', '', '', '']);
  const refs = React.useRef([]);

  React.useEffect(() => {
    setData(d => ({ ...d, verify: { phase, phone, code } }));
  }, [phase, phone, code]);

  const sendCode = () => phone.length >= 10 && setPhase('sent');
  const onCodeChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every(x => x !== '')) setTimeout(() => setPhase('verified'), 400);
  };

  return (
    <div style={{ padding: '12px 24px 0' }}>
      <h1 style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 26, fontWeight: 700, lineHeight: 1.0, color: '#f5f6f7',
        margin: '6px 0 0', letterSpacing: '-0.02em',
      }}>{phase === 'verified' ? 'Verified.' : 'Verify your number.'}</h1>
      <Mono size={10} color="rgba(201,204,209,0.55)" style={{ display: 'block', marginTop: 10, lineHeight: 1.6 }}>
        {phase === 'enter' && 'We text a 6-digit code. No bots, no burners.'}
        {phase === 'sent' && 'Code sent. Enter the 6 digits.'}
        {phase === 'verified' && 'Phone confirmed. You can submit your request.'}
      </Mono>

      {phase === 'enter' && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', background: '#0a0b10',
            border: `1px solid ${phone.length >= 10 ? accent.primary : 'rgba(255,255,255,0.08)'}`,
          }}>
            <Mono size={12} color="rgba(201,204,209,0.6)">+1</Mono>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="000 000 0000"
              inputMode="numeric"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 14, color: '#f5f6f7',
                letterSpacing: '0.08em', minWidth: 0,
              }}
            />
            <Mono size={9} color={phone.length >= 10 ? accent.primary : 'rgba(201,204,209,0.4)'} spacing="0.22em">
              {phone.length >= 10 ? 'READY' : 'PHONE'}
            </Mono>
          </div>
          <button onClick={sendCode} disabled={phone.length < 10} style={{
            appearance: 'none', cursor: phone.length >= 10 ? 'pointer' : 'not-allowed',
            padding: '14px', background: phone.length >= 10 ? accent.primary : 'rgba(255,255,255,0.06)',
            border: 'none',
          }}>
            <Mono size={11} color={phone.length >= 10 ? '#05060a' : 'rgba(201,204,209,0.4)'} weight={700} spacing="0.22em">
              SEND CODE
            </Mono>
          </button>
        </div>
      )}

      {phase === 'sent' && (
        <div style={{ marginTop: 22 }}>
          <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em" style={{ display: 'block' }}>
            CODE SENT TO +1 ··· {phone.slice(-4)}
          </Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 12 }}>
            {code.map((c, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={c}
                onChange={(e) => onCodeChange(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus(); }}
                inputMode="numeric"
                maxLength={1}
                style={{
                  aspectRatio: '1 / 1.2', textAlign: 'center',
                  background: '#0a0b10',
                  border: `1px solid ${c ? accent.primary : 'rgba(255,255,255,0.1)'}`,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
                  color: '#f5f6f7', outline: 'none',
                  boxShadow: c ? `0 0 12px ${accent.glow}` : 'none',
                }}
              />
            ))}
          </div>
          <button onClick={() => { setCode(['', '', '', '', '', '']); setPhase('enter'); }} style={{
            appearance: 'none', cursor: 'pointer', background: 'transparent', border: 'none',
            padding: '14px 0 0', display: 'block',
          }}>
            <Mono size={9} color="rgba(201,204,209,0.5)" spacing="0.22em">∕∕ CHANGE NUMBER</Mono>
          </button>
        </div>
      )}

      {phase === 'verified' && (
        <div style={{ marginTop: 22, padding: '20px', background: '#0a0b10',
          border: `0.5px solid ${accent.primary}50`, position: 'relative',
          display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: accent.soft, border: `1.5px solid ${accent.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${accent.glow}`,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={accent.primary} strokeWidth="2.5">
              <path d="M5 11l4 4 8-9"/>
            </svg>
          </div>
          <div>
            <Mono size={11} color="#f5f6f7" weight={700} spacing="0.22em">+1 ··· {phone.slice(-4)}</Mono>
            <Mono size={9} color={accent.primary} spacing="0.22em" style={{ display: 'block', marginTop: 4 }}>VERIFIED · HUMAN</Mono>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { RAStepIdentity, RAStepPhotos, RAStepMods, RAStepSubmitted, RAStepVerify, RASocialField });
