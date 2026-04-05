/**
 * AppShell — responsive layout wrapper.
 *
 * Desktop: fixed 960px centered wrapper with 180px sidebar.
 * Mobile (≤768px): full-width, sidebar becomes a slide-in drawer,
 *   bottom tab bar provides primary navigation.
 *
 * The sidebar can be toggled open/closed on mobile via hamburger button.
 */

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'wouter';
import { Home, Briefcase, Users, Globe, Building2 } from 'lucide-react';

const TICKER_ITEMS = [
  'The Cardinal completes contract #42 — streak: ×15',
  'Corrado Family seizes South Port — power 8,420',
  'Ferrante Crew declares war on West Side Outfit',
  'Pale Ghost sent to The Box — traced failure',
  'Round standings updated — Corrado Family leads',
];

// Bottom nav tabs for mobile (most critical screens)
const BOTTOM_TABS = [
  { href: '/',            label: 'Home',   icon: <Home   size={20} /> },
  { href: '/jobs',        label: 'Jobs',   icon: <Briefcase size={20} /> },
  { href: '/family',     label: 'Family', icon: <Users  size={20} /> },
  { href: '/districts',  label: 'World',  icon: <Globe  size={20} /> },
  { href: '/family/turf',label: 'Assets', icon: <Building2 size={20} /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loc] = useLocation();

  const tickerText = TICKER_ITEMS[Math.floor(Date.now() / 12000) % TICKER_ITEMS.length];

  return (
    <>
      {/* ── Top bar ──
           Lives OUTSIDE the page wrapper so it sticks to the
           viewport (html/body scroll), not a sub-scroll container. */}
      <div className="ml-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <button
            className="ml-menu-toggle"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ touchAction: 'manipulation' }}
          >
            ☰
          </button>
          <span className="ml-topbar-logo">MafiaLife</span>
        </div>
        <div className="ml-topbar-right">
          <span className="ml-topbar-round">Round ends: <strong style={{ color: '#ffcc33' }}>4d 13h</strong></span>
          <span><span style={{ color: '#4a9a4a' }}>●</span> <strong style={{ color: '#ffcc33' }}>1,247</strong></span>
        </div>
      </div>

      {/* ── Overlay for mobile sidebar ── */}
      <div
        className={`ml-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Page wrapper + sidebar + main ── */}
      <div className="ml-page-wrapper">
        <div className={`ml-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <Sidebar onNavClick={() => setSidebarOpen(false)} />
        </div>
        <main className="ml-main">
          {children}
        </main>
      </div>

      {/* ── Bottom navigation (mobile only) ── */}
      <nav className="ml-bottom-nav" aria-label="Main navigation">
        <div className="ml-bottom-nav-inner">
          {BOTTOM_TABS.map(tab => {
            const isActive = tab.href === '/' ? loc === '/' : loc.startsWith(tab.href);
            return (
              <a
                key={tab.href}
                href={`#${tab.href}`}
                className={`ml-bottom-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {tab.icon}
                {tab.label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* ── Shared layout helpers ─────────────────── */

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontFamily: 'Verdana, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#ffcc33', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '2px', wordBreak: 'break-word' }}>
            {title}
          </h1>
          {sub && (
            <p style={{ fontSize: '10px', color: '#888', fontFamily: 'Verdana, sans-serif', fontStyle: 'italic', marginBottom: '2px', wordBreak: 'break-word' }}>
              {sub}
            </p>
          )}
        </div>
        {action && (
          <div style={{ flexShrink: 0, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{action}</div>
        )}
      </div>
    </div>
  );
}

export function SectionPanel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ overflow: 'hidden', marginBottom: '8px' }}>
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        {right && <span style={{ fontSize: '10px', color: '#666', flexShrink: 0 }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

export function InfoAlert({ variant, children }: { variant?: 'warn' | 'danger' | 'purple'; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    warn:   { background: '#1a1500', border: '1px solid #3a2a00', color: '#cc9900' },
    danger: { background: '#1a0808', border: '1px solid #3a1010', color: '#cc3333' },
    purple: { background: '#15091a', border: '1px solid #3a1a5a', color: '#9955cc' },
  };
  const s = styles[variant ?? 'warn'];
  return (
    <div style={{ ...s, padding: '6px 8px', fontSize: '10px', fontFamily: 'Verdana, sans-serif', marginBottom: '8px', lineHeight: '1.5', wordBreak: 'break-word' }}>
      {children}
    </div>
  );
}

export function EmptySlate({ msg, sub }: { msg: string; sub?: string }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', color: '#666' }}>{msg}</p>
      {sub && <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}
