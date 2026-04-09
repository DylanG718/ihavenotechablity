/**
 * ArchetypeSelect — First-run screen.
 *
 * UX assumption: archetype is locked for the round.
 * Choosing HITMAN routes to the hitman experience (no family prompt).
 * All others route to the family/unaffiliated funnel.
 *
 * This component is standalone (no AppShell) because it's a pre-game flow.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { ARCHETYPES, type Archetype, type ArchetypeDefinition } from '../lib/archetypes';
import { useGame } from '../lib/gameContext';

const WEIGHT_PX: Record<string, number> = { HIGH: 100, MEDIUM: 60, LOW: 25 };
const WEIGHT_COLOR: Record<string, string> = {
  HIGH:   'background: #4a9a4a',
  MEDIUM: 'background: #cc9900',
  LOW:    'background: #3a3a3a',
};

function StatBar({ label, weight }: { label: string; weight: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
      <span style={{ width: '90px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ height: '6px', width: '120px', background: '#222', border: '1px solid #333' }}>
        <div style={{ height: '100%', width: `${WEIGHT_PX[weight] ?? 40}px`, ...(WEIGHT_COLOR[weight] ? { background: WEIGHT_COLOR[weight].replace('background: ','') } : {}) }} />
      </div>
      <span style={{ fontSize: '9px', color: '#666' }}>{weight}</span>
    </div>
  );
}

function ArchetypeCard({
  arch,
  isSelected,
  onSelect,
}: {
  arch: ArchetypeDefinition;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      data-testid={`arch-${arch.type}`}
      onClick={onSelect}
      style={{
        textAlign: 'left',
        width: '100%',
        padding: '10px',
        background: isSelected ? '#1a0d0d' : '#181818',
        border: isSelected ? '1px solid #cc3333' : '1px solid #2a2a2a',
        cursor: 'pointer',
        color: '#e0e0e0',
        fontFamily: 'Verdana, sans-serif',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isSelected ? '#cc3333' : '#e0e0e0' }}>
            {arch.name}
          </span>
          {arch.solo_only && (
            <span style={{ marginLeft: '6px', fontSize: '9px', background: '#2a1a00', color: '#cc9900', border: '1px solid #3a2a00', padding: '1px 4px' }}>
              SOLO ONLY
            </span>
          )}
        </div>
        <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {arch.playstyle}
        </span>
      </div>

      <p style={{ fontSize: '9px', color: '#cc3333', fontStyle: 'italic', margin: '0 0 6px 0' }}>
        "{arch.tagline}"
      </p>

      <p style={{ fontSize: '10px', color: '#aaa', margin: '0 0 8px 0', lineHeight: '1.45' }}>
        {arch.description}
      </p>

      <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '6px', fontSize: '9px' }}>
        <span style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role: </span>
        <span style={{ color: '#bbb' }}>{arch.role}</span>
      </div>
    </button>
  );
}

function DetailPanel({ arch }: { arch: ArchetypeDefinition }) {
  const statKeys = Object.keys(arch.stat_weights);
  return (
    <div style={{ padding: '12px', height: '100%', overflowY: 'auto', fontFamily: 'Verdana, sans-serif' }}>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffcc33', margin: '0 0 2px 0' }}>
          {arch.name}
        </h2>
        <p style={{ fontSize: '9px', color: '#cc3333', fontStyle: 'italic', margin: '0 0 8px 0' }}>
          "{arch.tagline}"
        </p>
        <p style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.5', margin: '0 0 10px 0' }}>
          {arch.description}
        </p>
      </div>

      {arch.solo_only && (
        <div style={{ background: '#1a1000', border: '1px solid #3a2a00', padding: '6px 8px', marginBottom: '10px', fontSize: '10px', color: '#cc9900' }}>
          ⚠ Solo path. Choosing Hitman locks you out of family membership for this round.
          You operate independently on the contract board.
        </div>
      )}

      <section style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
          Stat Profile
        </p>
        {statKeys.map(k => (
          <StatBar key={k} label={k} weight={arch.stat_weights[k]} />
        ))}
      </section>

      <section style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
          Starting Bonuses
        </p>
        {arch.starting_bonuses.map(b => (
          <div key={b} style={{ fontSize: '10px', color: '#4a9a4a', marginBottom: '2px' }}>+ {b}</div>
        ))}
      </section>

      <section style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
          Soft Penalties
        </p>
        {arch.soft_penalties.map(p => (
          <div key={p} style={{ fontSize: '10px', color: '#cc3333', marginBottom: '2px' }}>− {p}</div>
        ))}
      </section>

      <section>
        <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
          Best At
        </p>
        {arch.best_at.map(b => (
          <div key={b} style={{ fontSize: '10px', color: '#bbb', marginBottom: '2px' }}>· {b}</div>
        ))}
      </section>
    </div>
  );
}

export default function ArchetypeSelect() {
  const [selected, setSelected] = useState<Archetype | null>(null);
  const [, nav] = useLocation();
  const { setPlayer } = useGame();

  const arch = ARCHETYPES.find(a => a.type === selected);

  // Maps archetype to a demo player that best represents that archetype
  const ARCHETYPE_DEMO_PLAYER: Record<string, string> = {
    HITMAN:     'p-hitman-1',
    RUNNER:     'p-boss',  // p-boss migrated from BOSS to RUNNER archetype
    SCHEMER:    'p-consigliere',
    RACKETEER:  'p-capo',
    MUSCLE:     'p-underboss',
    SHOOTER:    'p-soldier',
    EARNER:     'p-associate',
  };

  function handleConfirm() {
    if (!arch) return;
    const pid = ARCHETYPE_DEMO_PLAYER[arch.type] ?? 'p-unaffiliated';
    setPlayer(pid);
    nav('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', fontFamily: 'Verdana, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#151515', borderBottom: '1px solid #000', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffcc33' }}>The Last Firm</span>
          <span style={{ fontSize: '10px', color: '#888', marginLeft: '12px' }}>Character Creation — Choose Your Archetype</span>
        </div>
        <span style={{ fontSize: '10px', color: '#555' }}>Step 1 of 1</span>
      </div>

      {/* Instruction bar */}
      <div style={{ background: '#191919', borderBottom: '1px solid #000', padding: '5px 16px', fontSize: '10px', color: '#888' }}>
        Your archetype defines starting stat weights, growth biases, and action efficiency.
        It is <strong style={{ color: '#e0e0e0' }}>locked for the round</strong> — choose carefully.
        Archetypes are biases, not hard classes. You can still evolve.
      </div>

      {/* Body: grid + detail */}
      <div className="arch-layout">

        {/* Card grid */}
        <div className="arch-grid">
            {ARCHETYPES.map(a => (
              <ArchetypeCard
                key={a.type}
                arch={a}
                isSelected={selected === a.type}
                onSelect={() => setSelected(a.type)}
              />
            ))}
        </div>

        {/* Detail panel */}
        <div className="arch-detail">
          {arch ? (
            <>
              <DetailPanel arch={arch} />
              <div style={{ padding: '10px', borderTop: '1px solid #000', flexShrink: 0 }}>
                <button
                  data-testid="confirm-archetype"
                  onClick={handleConfirm}
                  style={{
                    width: '100%', padding: '8px', background: '#1a0d0d', color: '#cc3333',
                    border: '1px solid #4a1e1e', cursor: 'pointer', fontWeight: 'bold',
                    fontSize: '11px', fontFamily: 'Verdana, sans-serif',
                  }}
                >
                  Confirm — {arch.name}
                  {arch.solo_only ? ' (Solo Path)' : ' (Family Path)'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '10px', color: '#555', textAlign: 'center', padding: '20px' }}>
                Select an archetype to see full details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
