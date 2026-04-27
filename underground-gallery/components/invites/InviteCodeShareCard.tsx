"use client";

// components/invites/InviteCodeShareCard.tsx
// QR code + share buttons + native SMS invite.
// Requires: npm install qrcode @types/qrcode

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { colors, fonts } from "@/lib/design";

type Props = {
  code: string;
  shareLink: string;
  createdAt: string;
};

function smsUri(body: string): string {
  const encoded = encodeURIComponent(body);
  if (typeof navigator === "undefined") return `sms:?body=${encoded}`;
  const ua = navigator.userAgent || "";
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(ua);
  return isApple ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
}

function buildMessageBody(code: string, shareLink: string): string {
  return [
    "you're invited to underground gallery.",
    "",
    "invite only.",
    "",
    "accept: " + shareLink,
  ].join("\n");
}

export default function InviteCodeShareCard({ code, shareLink, createdAt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const c = canvasRef.current;
    if (!c) return;

    QRCode.toCanvas(
      c,
      shareLink,
      {
        width: 240,
        margin: 1,
        color: { dark: "#0a0a0a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (cancelled) return;
        if (err) {
          console.error("[QR] failed:", err);
          setQrError("QR failed to render.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shareLink]);

  async function copy(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  async function nativeShare() {
    const messageBody = buildMessageBody(code, shareLink);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Underground Gallery — invite",
          text: messageBody,
          url: shareLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy(shareLink, "link");
    }
  }

  function textInvite() {
    const body = buildMessageBody(code, shareLink);
    window.location.href = smsUri(body);
  }

  function downloadQr() {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `ug-invite-${code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div
      style={{
        background: colors.bgElevated,
        border: `0.5px solid ${colors.border}`,
        padding: 24,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 24,
        alignItems: "center",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            color: colors.textMuted,
            fontFamily: fonts.mono,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          YOUR CODE
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: colors.accent,
            marginBottom: 16,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {code}
        </div>

        <div
          style={{
            fontSize: 11,
            color: colors.textMuted,
            marginBottom: 8,
            fontFamily: fonts.mono,
          }}
        >
          SHARE LINK
        </div>
        <div
          style={{
            fontSize: 11,
            color: colors.textMuted,
            marginBottom: 16,
            fontFamily: fonts.mono,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            background: colors.bg,
            padding: "8px 10px",
            border: `0.5px solid ${colors.border}`,
            lineHeight: 1.5,
          }}
        >
          {shareLink}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <PrimaryBtn onClick={textInvite}>TEXT INVITE</PrimaryBtn>
          <ActionBtn onClick={nativeShare}>SHARE</ActionBtn>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionBtn onClick={() => copy(code, "code")}>
            {copied === "code" ? "COPIED" : "COPY CODE"}
          </ActionBtn>
          <ActionBtn onClick={() => copy(shareLink, "link")}>
            {copied === "link" ? "COPIED" : "COPY LINK"}
          </ActionBtn>
          <ActionBtn onClick={downloadQr}>SAVE QR</ActionBtn>
        </div>

        <p
          style={{
            fontSize: 10,
            color: colors.textDim,
            marginTop: 14,
            fontFamily: fonts.mono,
          }}
        >
          Issued {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <canvas ref={canvasRef} width={240} height={240} />
        {qrError && (
          <p
            style={{
              fontSize: 10,
              color: colors.danger,
              position: "absolute",
            }}
          >
            {qrError}
          </p>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        background: colors.accent,
        color: "#0a0a0a",
        border: "none",
        fontFamily: fonts.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.3em",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        background: "transparent",
        color: colors.text,
        border: `0.5px solid ${colors.border}`,
        fontFamily: fonts.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.3em",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
