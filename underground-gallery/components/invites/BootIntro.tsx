"use client";

import { useEffect, useState } from "react";

export default function BootIntro({ children }: { children: React.ReactNode }) {
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes ugInviteBootFade {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
        @keyframes ugInviteLogoIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ugInviteContentIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ugInviteBlink {
          0%, 60% { opacity: 1; }
          80%, 100% { opacity: 0.2; }
        }
        #ug-invite-boot {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ugInviteBootFade 1.8s ease-in-out forwards;
          pointer-events: none;
        }
        .ug-invite-boot-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: ugInviteLogoIn 0.6s ease-out;
        }
        .ug-invite-boot-wordmark {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.3em;
          color: #f5f6f7;
        }
        .ug-invite-boot-line {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: 0.3em;
          color: rgba(255, 42, 42, 0.8);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ug-invite-boot-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #ff2a2a;
          border-radius: 50%;
          animation: ugInviteBlink 0.7s ease-in-out infinite;
        }
        .ug-invite-content-wrap {
          opacity: 0;
          animation: ugInviteContentIn 0.5s ease-out 1.4s forwards;
        }
      `}</style>

      {!bootDone && (
        <div id="ug-invite-boot" aria-hidden="true">
          <div className="ug-invite-boot-inner">
            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" style={{ filter: "drop-shadow(0 0 16px rgba(255, 42, 42, 0.5))" }}>
              <rect x="3" y="3" width="34" height="34" stroke="#ff2a2a" strokeWidth="1.5" fill="none" strokeOpacity="0.4" />
              <path d="M3 3 L7 3 M37 3 L33 3 M3 37 L7 37 M37 37 L33 37" stroke="#ff2a2a" strokeWidth="2" strokeLinecap="square" />
              <path d="M8 8 L8 32 L32 32 L32 8" stroke="#ff2a2a" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
              <path d="M25 15 L15 15 L15 27 L25 27 L25 22 L20 22" stroke="#ff2a2a" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
            </svg>
            <div className="ug-invite-boot-wordmark">UNDERGROUND GALLERY</div>
            <div className="ug-invite-boot-line">
              <span className="ug-invite-boot-dot" />
              <span>INVITE VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      <div className="ug-invite-content-wrap">
        {children}
      </div>
    </>
  );
}