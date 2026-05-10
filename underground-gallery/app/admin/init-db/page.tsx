// app/admin/init-db/page.tsx
// Simple admin page to initialize the database tables.
// Visit /admin/init-db, paste the ADMIN_TOKEN, click the button.
// One-time use during setup.

'use client';

import { useState } from 'react';

export default function InitDbPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const run = async () => {
    if (!token.trim()) {
      setStatus('error');
      setResult('Paste your ADMIN_TOKEN first.');
      return;
    }
    setStatus('loading');
    setResult('');
    try {
      const res = await fetch('/api/db-init', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
      setStatus(res.ok && json.ok ? 'done' : 'error');
    } catch (err) {
      setStatus('error');
      setResult(err instanceof Error ? err.message : 'Network error');
    }
  };

  const checkExisting = async () => {
    setStatus('loading');
    setResult('');
    try {
      const res = await fetch('/api/db-init');
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setResult(err instanceof Error ? err.message : 'Network error');
    }
  };

  const runMarketplace = async () => {
    if (!token.trim()) {
      setStatus('error');
      setResult('Paste your ADMIN_TOKEN first.');
      return;
    }
    setStatus('loading');
    setResult('');
    try {
      const res = await fetch('/api/db-init/marketplace', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
      setStatus(res.ok && json.ok ? 'done' : 'error');
    } catch (err) {
      setStatus('error');
      setResult(err instanceof Error ? err.message : 'Network error');
    }
  };

  const checkMarketplace = async () => {
    setStatus('loading');
    setResult('');
    try {
      const res = await fetch('/api/db-init/marketplace');
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setResult(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#05060a',
        color: '#f5f6f7',
        fontFamily: '"Inter Tight", system-ui, sans-serif',
        padding: '48px 24px',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: '#ff2a2a',
          letterSpacing: '0.4em',
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        ∕∕ ADMIN · DATABASE INITIALIZATION
      </div>

      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 16px',
          lineHeight: 1.05,
        }}
      >
        Create database tables
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'rgba(201,204,209,0.7)',
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        One-time setup. Creates the users, accounts, sessions, verification_tokens,
        and applications tables. Safe to re-run; uses CREATE IF NOT EXISTS.
      </p>

      <label
        style={{
          display: 'block',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          color: 'rgba(201,204,209,0.7)',
          letterSpacing: '0.25em',
          marginBottom: 10,
        }}
      >
        ADMIN_TOKEN
      </label>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your ADMIN_TOKEN env var value"
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'rgba(0,0,0,0.4)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          color: '#f5f6f7',
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          marginBottom: 24,
          boxSizing: 'border-box',
        }}
        autoComplete="off"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={run}
          disabled={status === 'loading'}
          style={{
            padding: '14px 28px',
            background: '#ff2a2a',
            color: '#05060a',
            border: 'none',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: status === 'loading' ? 'default' : 'pointer',
            opacity: status === 'loading' ? 0.5 : 1,
          }}
        >
          {status === 'loading' ? 'WORKING…' : 'CREATE TABLES'}
        </button>
        <button
          onClick={checkExisting}
          disabled={status === 'loading'}
          style={{
            padding: '14px 28px',
            background: 'transparent',
            color: 'rgba(201,204,209,0.85)',
            border: '0.5px solid rgba(255,255,255,0.2)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: status === 'loading' ? 'default' : 'pointer',
          }}
        >
          CHECK EXISTING
        </button>
      </div>

      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: '#ff2a2a',
            letterSpacing: '0.4em',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          ∕∕ STAGE 4 · MARKETPLACE
        </div>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(201,204,209,0.7)',
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          Adds the listings, listing_messages, listing_offers, and listing_watches
          tables. Extends photos, notifications, and flags enums to include
          marketplace events. Idempotent — safe to rerun.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={runMarketplace}
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px',
              background: '#ff2a2a',
              color: '#05060a',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: status === 'loading' ? 'default' : 'pointer',
              opacity: status === 'loading' ? 0.5 : 1,
            }}
          >
            {status === 'loading' ? 'WORKING…' : 'RUN MARKETPLACE MIGRATION'}
          </button>
          <button
            onClick={checkMarketplace}
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px',
              background: 'transparent',
              color: 'rgba(201,204,209,0.85)',
              border: '0.5px solid rgba(255,255,255,0.2)',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: status === 'loading' ? 'default' : 'pointer',
            }}
          >
            CHECK MARKETPLACE TABLES
          </button>
        </div>
      </div>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 20,
            border: `0.5px solid ${
              status === 'error' ? '#ff2a2a' : 'rgba(255,255,255,0.12)'
            }`,
            background:
              status === 'error' ? 'rgba(255,42,42,0.06)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: status === 'error' ? '#ff2a2a' : 'rgba(201,204,209,0.5)',
              letterSpacing: '0.3em',
              marginBottom: 12,
            }}
          >
            ∕∕ {status === 'error' ? 'ERROR' : 'RESULT'}
          </div>
          <pre
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: '#f5f6f7',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </main>
  );
}
