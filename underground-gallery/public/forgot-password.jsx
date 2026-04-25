// ── Forgot Password Flow ──────────────────────────────────────────────
// Three steps inside the iOS frame:
//   1. PHONE      → user enters phone number, taps SEND CODE
//   2. CODE       → 6-digit SMS code (auto-fills for demo)
//   3. NEW PASS   → set new password (with strength meter) → confirm
//   4. SUCCESS    → unlock animation, return to sign-in
//
// Uses globals: Mono, ScreenShell, TopBar, CTAButton

function ScreenForgotPassword({ tweaks, accent, onBack, onComplete }) {
  const [step, setStep] = React.useState(0); // 0=phone 1=code 2=new 3=done
  const [phone, setPhone] = React.useState('+1 (425) 555-44··');
  const [digits, setDigits] = React.useState(['','','','','','']);
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [resend, setResend] = React.useState(0);

  // Resend countdown when on code step
  React.useEffect(() => {
    if (step !== 1) return;
    setResend(28);
    const t = setInterval(() => setResend(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  // Auto-fill code on step 1
  React.useEffect(() => {
    if (step !== 1) return;
    setDigits(['','','','','','']);
    const seq = ['8','1','4','9','0','2'];
    const timers = seq.map((d, i) => setTimeout(() => {
      setDigits(prev => { const n = [...prev]; n[i] = d; return n; });
    }, 700 + i * 240));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const filled = digits.filter(Boolean).length;
  const pwScore = passwordScore(pw);
  const pwMatch = pw.length >= 8 && pw === pw2;

  return (
    <ScreenShell tweaks={tweaks} accent={accent}>
      <TopBar accent={accent} onBack={() => step === 0 ? onBack && onBack() : setStep(s => s - 1)} step={`${String(step + 1).padStart(2,'0')} / 04`}/>

      {/* Step rail */}
      <div style={{ padding: '8px 24px 0', display: 'flex', gap: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 2,
            background: i <= step ? accent.primary : 'rgba(255,255,255,0.1)',
            boxShadow: i <= step ? `0 0 8px ${accent.soft}` : 'none',
            transition: 'all 0.3s',
          }}/>
        ))}
      </div>

      {step === 0 && <FPPhone tweaks={tweaks} accent={accent} phone={phone} setPhone={setPhone} onNext={() => setStep(1)}/>}
      {step === 1 && <FPCode  tweaks={tweaks} accent={accent} digits={digits} setDigits={setDigits} resend={resend} phone={phone} onNext={() => setStep(2)} filled={filled}/>}
      {step === 2 && <FPNewPass tweaks={tweaks} accent={accent} pw={pw} setPw={setPw} pw2={pw2} setPw2={setPw2} show={showPw} setShow={setShowPw} score={pwScore} match={pwMatch} onNext={() => setStep(3)}/>}
      {step === 3 && <FPSuccess tweaks={tweaks} accent={accent} onComplete={onComplete}/>}
    </ScreenShell>
  );
}

// ── Step 1: phone entry ───────────────────────────────────────────────
function FPPhone({ accent, phone, setPhone, onNext }) {
  return (
    <>
      <div style={{ padding: '16px 24px 0' }}>
        <Mono size={10} color={accent.primary} spacing="0.22em">∕∕ RESET PASSWORD · STEP 01</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 30, fontWeight: 700, lineHeight: 1.0,
          color: '#f5f6f7', margin: '12px 0 8px', letterSpacing: '-0.02em',
        }}>Lost the<br/>keys?</h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, lineHeight: 1.6,
          color: 'rgba(201,204,209,0.6)', margin: 0, letterSpacing: '0.02em',
        }}>
          Enter the phone number on file. We'll text you a 6-digit reset code.
        </p>
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" style={{ display: 'block', marginBottom: 8 }} spacing="0.22em">PHONE NUMBER</Mono>
        <div style={{
          borderBottom: `2px solid ${accent.primary}`, paddingBottom: 6,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (___) ___-____"
            inputMode="tel"
            style={{
              flex: 1, appearance: 'none', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700,
              color: '#f5f6f7', letterSpacing: '0.04em', lineHeight: 1, padding: 0,
            }}
          />
        </div>
        <Mono size={8.5} color="rgba(201,204,209,0.4)" style={{ marginTop: 8, display: 'block' }} spacing="0.06em">
          Standard SMS rates apply. Code expires in 10 minutes.
        </Mono>
      </div>

      {/* Pre-flight checks */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.06)', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <CheckRow accent={accent} on label="Phone format valid"/>
          <CheckRow accent={accent} on label="Account found · @apex_11"/>
          <CheckRow accent={accent} label="Carrier reachable"/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onNext} disabled={!phone || phone.length < 10} label="SEND RESET CODE" sub="→ SMS DISPATCH" sticky/>
    </>
  );
}

// ── Step 2: code entry ────────────────────────────────────────────────
function FPCode({ accent, digits, setDigits, resend, phone, onNext, filled }) {
  return (
    <>
      <div style={{ padding: '16px 24px 0' }}>
        <Mono size={10} color={accent.primary} spacing="0.22em">∕∕ RESET PASSWORD · STEP 02</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 30, fontWeight: 700, lineHeight: 1.0,
          color: '#f5f6f7', margin: '12px 0 8px', letterSpacing: '-0.02em',
        }}>Verify it's<br/>you.</h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, lineHeight: 1.6,
          color: 'rgba(201,204,209,0.6)', margin: 0, letterSpacing: '0.02em',
        }}>
          6-digit code sent to <span style={{ color: '#f5f6f7' }}>{phone}</span>
        </p>
      </div>

      <div style={{ padding: '32px 24px 0', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {digits.map((d, i) => (
          <div key={i} style={{
            flex: 1, aspectRatio: '1 / 1.25', maxWidth: 44,
            borderBottom: `2px solid ${d ? accent.primary : 'rgba(255,255,255,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 26, fontWeight: 700,
            color: '#f5f6f7', position: 'relative', transition: 'border-color 0.2s',
          }}>{d || (i === filled && <span style={{ width: 1.5, height: 22, background: accent.primary, animation: 'aiBlink 1s step-end infinite' }}/>)}</div>
        ))}
      </div>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <Mono size={9.5} color="rgba(201,204,209,0.5)" spacing="0.18em">
          {resend > 0
            ? <>RESEND CODE IN <span style={{ color: accent.primary }}>{String(resend).padStart(2, '0')}s</span></>
            : <span style={{ color: accent.primary, cursor: 'pointer', textDecoration: 'underline' }}>RESEND CODE</span>
          }
        </Mono>
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        <div style={{
          background: '#0a0b10', border: '0.5px solid rgba(255,255,255,0.06)', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <FPLogLine accent={accent.primary} time="00:00" text="Reset request initiated" on/>
          <FPLogLine accent={accent.primary} time="00:01" text="SMS dispatched · Twilio" on/>
          <FPLogLine accent={accent.primary} time="00:02" text="Code received" on={filled > 0}/>
          <FPLogLine accent={accent.primary} time="00:03" text="Code verified" on={filled === 6}/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onNext} disabled={filled < 6} label={filled < 6 ? `ENTER ${filled}/6 DIGITS` : 'CODE VERIFIED'} sub={filled === 6 ? '→ NEW PASSWORD' : ''} sticky/>
    </>
  );
}

// ── Step 3: new password ──────────────────────────────────────────────
function FPNewPass({ accent, pw, setPw, pw2, setPw2, show, setShow, score, match, onNext }) {
  return (
    <>
      <div style={{ padding: '16px 24px 0' }}>
        <Mono size={10} color={accent.primary} spacing="0.22em">∕∕ RESET PASSWORD · STEP 03</Mono>
        <h1 style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 30, fontWeight: 700, lineHeight: 1.0,
          color: '#f5f6f7', margin: '12px 0 8px', letterSpacing: '-0.02em',
        }}>Cut a new<br/>key.</h1>
        <p style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, lineHeight: 1.6,
          color: 'rgba(201,204,209,0.6)', margin: 0, letterSpacing: '0.02em',
        }}>Min 8 chars. Mix letters, numbers, symbols.</p>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PasswordField label="NEW PASSWORD" value={pw} onChange={setPw} show={show} setShow={setShow} accent={accent}/>

        {/* Strength meter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.22em">STRENGTH</Mono>
            <Mono size={9} color={STRENGTH_COLORS[score]} weight={700} spacing="0.22em">{STRENGTH_LABELS[score]}</Mono>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                flex: 1, height: 4,
                background: i <= score ? STRENGTH_COLORS[score] : 'rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
              }}/>
            ))}
          </div>
        </div>

        <PasswordField label="CONFIRM PASSWORD" value={pw2} onChange={setPw2} show={show} accent={accent}
          status={pw2.length === 0 ? null : (pw === pw2 ? 'match' : 'nomatch')}/>
      </div>

      <div style={{ flex: 1 }}/>
      <CTAButton accent={accent} onClick={onNext} disabled={!match || score < 2}
        label={!pw ? 'ENTER NEW PASSWORD' : score < 2 ? 'PASSWORD TOO WEAK' : !match ? 'PASSWORDS MUST MATCH' : 'COMMIT NEW KEY'}
        sub={match && score >= 2 ? '→ ENGINE STARTING' : ''} sticky/>
    </>
  );
}

// ── Step 4: success ───────────────────────────────────────────────────
function FPSuccess({ accent, onComplete }) {
  const [count, setCount] = React.useState(3);
  React.useEffect(() => {
    if (count <= 0) { onComplete && onComplete(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', gap: 24 }}>
        {/* Big checkmark */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          border: `2px solid ${accent.primary}`, background: 'rgba(255,42,42,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px ${accent.soft}`, animation: 'aiPulse 2.4s ease-in-out infinite',
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path d="M10 22l8 8 16-18" fill="none" stroke={accent.primary} strokeWidth="3" strokeLinecap="square"/>
          </svg>
        </div>

        <div>
          <Mono size={10} color={accent.primary} spacing="0.32em">∕∕ KEY CUT</Mono>
          <h1 style={{
            fontFamily: '"Inter Tight", sans-serif', fontSize: 32, fontWeight: 700,
            lineHeight: 1, color: '#f5f6f7', margin: '12px 0 0', letterSpacing: '-0.02em',
          }}>Engine restarted.</h1>
          <p style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, lineHeight: 1.6,
            color: 'rgba(201,204,209,0.6)', margin: '12px 0 0',
          }}>
            Password updated. All other sessions signed out.<br/>
            Returning to sign-in in <span style={{ color: accent.primary }}>{count}</span>…
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 220 }}>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{
              height: '100%', background: accent.primary,
              width: `${((3 - count) / 3) * 100}%`, transition: 'width 0.9s linear',
              boxShadow: `0 0 8px ${accent.soft}`,
            }}/>
          </div>
        </div>
      </div>

      <CTAButton accent={accent} onClick={onComplete} label="RETURN TO SIGN IN" sticky/>
    </>
  );
}

// ── helpers ───────────────────────────────────────────────────────────
const STRENGTH_LABELS = ['VERY WEAK', 'WEAK', 'GOOD', 'STRONG', 'IRONCLAD'];
const STRENGTH_COLORS = ['#ff2a2a', '#ff7a2a', '#ffd700', '#5bbeff', '#2aff8a'];

function passwordScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

function PasswordField({ label, value, onChange, show, setShow, accent, status }) {
  const borderColor = status === 'match' ? '#2aff8a'
    : status === 'nomatch' ? accent.primary
    : value ? accent.primary : 'rgba(255,255,255,0.18)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <Mono size={9} color="rgba(255,255,255,0.4)" spacing="0.22em">{label}</Mono>
        {status === 'match' && <Mono size={8.5} color="#2aff8a" weight={700} spacing="0.22em">✓ MATCH</Mono>}
        {status === 'nomatch' && <Mono size={8.5} color={accent.primary} weight={700} spacing="0.22em">✕ NO MATCH</Mono>}
      </div>
      <div style={{
        borderBottom: `2px solid ${borderColor}`, paddingBottom: 6,
        display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s',
      }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{
            flex: 1, appearance: 'none', background: 'transparent', border: 'none', outline: 'none',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 700,
            color: '#f5f6f7', letterSpacing: show ? '0.04em' : '0.2em', lineHeight: 1, padding: 0,
          }}
        />
        {setShow && (
          <button onClick={() => setShow(!show)} style={{
            appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, color: 'rgba(201,204,209,0.6)',
          }}>
            <Mono size={9} color="rgba(201,204,209,0.6)" spacing="0.18em">{show ? 'HIDE' : 'SHOW'}</Mono>
          </button>
        )}
      </div>
    </div>
  );
}

function CheckRow({ accent, on, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 14, height: 14, border: `1px solid ${on ? accent.primary : 'rgba(255,255,255,0.2)'}`,
        background: on ? 'rgba(255,42,42,0.1)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {on && <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 4l2.5 2L8 1" fill="none" stroke={accent.primary} strokeWidth="1.6" strokeLinecap="square"/></svg>}
      </span>
      <Mono size={10} color={on ? '#f5f6f7' : 'rgba(201,204,209,0.4)'} spacing="0.06em">{label}</Mono>
    </div>
  );
}

function FPLogLine({ time, text, on, accent }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center',
      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
      color: on ? '#f5f6f7' : 'rgba(201,204,209,0.3)', transition: 'color 0.3s',
    }}>
      <span style={{ width: 6, height: 6, background: on ? accent : 'rgba(255,255,255,0.15)',
        boxShadow: on ? `0 0 6px ${accent}` : 'none', transition: 'all 0.3s' }}/>
      <span style={{ color: on ? accent : 'rgba(201,204,209,0.3)' }}>{time}</span>
      <span>{text}</span>
      {on && <span style={{ marginLeft: 'auto', color: 'rgba(201,204,209,0.45)' }}>OK</span>}
    </div>
  );
}

Object.assign(window, { ScreenForgotPassword });
