/**
 * HitmanPrison — "The Box"
 *
 * Hitman-only prison. Separate from regular jail.
 * Shows sentence state, prison status, and interactive actions.
 *
 * Actions: Bribe Guard, Stay Silent, Cleanup Work, Cooperate
 * Each uses resolvePrisonAction() from gameLogic.ts.
 *
 * State machine: INTAKE → CONFINED → (MAX_SECURITY ↔ CONFINED) → RELEASE_ELIGIBLE → (released)
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_HITMAN_PROFILES, MOCK_PLAYERS, fmt } from '../lib/mockData';
import { PageHeader, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { BlacksiteBadge } from '../components/ui/Badges';
import type { BlacksiteState } from '../../../shared/schema';
import { resolvePrisonAction, type PrisonActionResult } from '../lib/gameLogic';
import { Shield } from 'lucide-react';

// ─────────────────────────────────────────────
// State descriptions
// ─────────────────────────────────────────────

const STATE_DESC: Record<BlacksiteState, string> = {
  BLACKSITE_INTAKE:
    'You have been picked up. Processing. No actions available. ' +
    'Your contract board listing has been suspended.',
  BLACKSITE_CONFINED:
    'Standard confinement. Limited actions available. ' +
    'You can attempt to negotiate, work your sentence, or wait it out.',
  BLACKSITE_MAX_SECURITY:
    'Full lockdown. No actions. You will stay here until they decide to move you. ' +
    'Request a transfer to standard confinement first.',
  BLACKSITE_RELEASE_ELIGIBLE:
    'Sentence served. You can walk out — but the door comes with surveillance. ' +
    'Or wait longer for a cleaner exit.',
};

// ─────────────────────────────────────────────
// Available actions per state
// ─────────────────────────────────────────────

type PrisonActionDef = {
  id: 'BRIBE' | 'STAY_SILENT' | 'CLEANUP_WORK' | 'COOPERATE';
  label: string;
  desc: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  cost?: string;
  /** If set, action transitions state to this value */
  transitionTo?: BlacksiteState | null;
};

const STATE_ACTIONS: Record<BlacksiteState, PrisonActionDef[]> = {
  BLACKSITE_INTAKE: [],
  BLACKSITE_CONFINED: [
    { id: 'STAY_SILENT', label: 'Stay Silent',    desc: 'Do not cooperate. Reduce trace risk. Sentence unchanged. Rep preserved.', risk: 'LOW' },
    { id: 'BRIBE',       label: 'Bribe a Guard',  desc: 'Pay for early release. Heat penalty applied. Success not guaranteed.', risk: 'MEDIUM', cost: '$40,000 est.', transitionTo: null },
    { id: 'CLEANUP_WORK',label: 'Cleanup Work',   desc: 'Take on prison tasks. Sentence reduced by 1 day. Small rep gain.', risk: 'LOW' },
    { id: 'COOPERATE',   label: 'Cooperate',      desc: 'Work with authorities. Sentence halved. Rep takes major damage. Moves to Release Eligible.', risk: 'HIGH', transitionTo: 'BLACKSITE_RELEASE_ELIGIBLE' },
  ],
  BLACKSITE_MAX_SECURITY: [
    { id: 'STAY_SILENT', label: 'Stay Silent',    desc: 'Maintain silence. Preserve reputation. No sentence change.', risk: 'LOW' },
    { id: 'CLEANUP_WORK',label: 'Request Transfer', desc: 'Complete assigned work. Request move to standard confinement.', risk: 'LOW', transitionTo: 'BLACKSITE_CONFINED' },
  ],
  BLACKSITE_RELEASE_ELIGIBLE: [
    { id: 'BRIBE',       label: 'Accept Release', desc: 'Walk out now. 48h surveillance window. Heat +25.', risk: 'MEDIUM', transitionTo: null },
    { id: 'STAY_SILENT', label: 'Wait It Out',    desc: 'Stay put until heat cools. Cleaner exit, no surveillance.', risk: 'LOW' },
  ],
};

// State transition order for "advance" button (INTAKE → CONFINED in demo)
const NEXT_STATE: Partial<Record<BlacksiteState, BlacksiteState>> = {
  BLACKSITE_INTAKE:          'BLACKSITE_CONFINED',
  BLACKSITE_CONFINED:        'BLACKSITE_RELEASE_ELIGIBLE',
  BLACKSITE_MAX_SECURITY:    'BLACKSITE_CONFINED',
  BLACKSITE_RELEASE_ELIGIBLE: 'BLACKSITE_RELEASE_ELIGIBLE',
};

// ─────────────────────────────────────────────
// ActionButton with outcome display
// ─────────────────────────────────────────────

function ActionButton({ action, currentHeat, currentSentenceDays, onTransition }: {
  action: PrisonActionDef;
  currentHeat: number;
  currentSentenceDays: number;
  onTransition?: (to: BlacksiteState | null) => void;
}) {
  const [result, setResult] = useState<PrisonActionResult | null>(null);
  const [done, setDone]     = useState(false);

  function handleAction() {
    const r = resolvePrisonAction(action.id, currentHeat, currentSentenceDays);
    setResult(r);
    setDone(true);
    // If this action has a state transition, fire it after a short delay
    if (action.transitionTo !== undefined && onTransition) {
      setTimeout(() => onTransition(action.transitionTo!), 1200);
    }
  }

  const riskColor = action.risk === 'HIGH' ? '#cc3333' : action.risk === 'MEDIUM' ? '#cc9900' : '#4a9a4a';

  return (
    <div style={{ border: `1px solid ${done ? '#2a4a2a' : '#2a2a2a'}`, background: done ? '#0d1a0d' : '#181818', padding: '10px', marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: done ? '#4a9a4a' : '#e0e0e0' }}>
            {done ? '✓ ' : ''}{action.label}
          </span>
          {action.cost && <span style={{ fontSize: '9px', color: '#cc9900', marginLeft: '8px' }}>{action.cost}</span>}
        </div>
        <span style={{ fontSize: '9px', color: riskColor, border: `1px solid ${riskColor}`, padding: '1px 5px', flexShrink: 0 }}>
          {action.risk} RISK
        </span>
      </div>
      <p style={{ fontSize: '10px', color: '#888', marginBottom: '6px', lineHeight: '1.45' }}>{action.desc}</p>

      {!done ? (
        <button onClick={handleAction} className="btn btn-ghost" style={{ fontSize: '10px', padding: '3px 10px' }}
          data-testid={`prison-action-${action.id.toLowerCase()}`}
        >
          Execute
        </button>
      ) : result && (
        <div style={{ fontSize: '10px', color: '#aaa', borderTop: '1px solid #2a2a2a', paddingTop: '6px', marginTop: '6px' }}>
          <div style={{ marginBottom: '4px', color: result.success ? '#4a9a4a' : '#cc3333', fontWeight: 'bold' }}>
            {result.success ? 'Action succeeded.' : 'Action failed.'}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {result.heatDelta !== 0 && (
              <span style={{ color: result.heatDelta > 0 ? '#cc7700' : '#4a9a4a' }}>
                Heat: {result.heatDelta > 0 ? '+' : ''}{result.heatDelta}
              </span>
            )}
            {result.repDelta !== 0 && (
              <span style={{ color: result.repDelta > 0 ? '#4a9a4a' : '#cc3333' }}>
                Rep: {result.repDelta > 0 ? '+' : ''}{result.repDelta}
              </span>
            )}
            {result.sentenceDeltaDays !== 0 && (
              <span style={{ color: result.sentenceDeltaDays < 0 ? '#4a9a4a' : '#cc3333' }}>
                Sentence: {result.sentenceDeltaDays}d
              </span>
            )}
          </div>
          {action.transitionTo !== undefined && (
            <div style={{ marginTop: '4px', color: '#5580bb', fontSize: '9px' }}>
              {action.transitionTo === null ? '→ Released. Updating status...' : `→ Transitioning to ${action.transitionTo.replace('BLACKSITE_','')}...`}
            </div>
          )}
          <div style={{ color: '#666', marginTop: '3px' }}>{result.notes}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BlacksiteCell — one detained hitman
// ─────────────────────────────────────────────

function BlacksiteCell({ profile }: { profile: typeof MOCK_HITMAN_PROFILES[0] }) {
  const [state, setState] = useState<BlacksiteState>(profile.blacksite_state!);
  const [released, setReleased] = useState(false);
  const [sentenceDays, setSentenceDays] = useState(3);

  const actions = STATE_ACTIONS[state] ?? [];
  const player  = MOCK_PLAYERS[profile.player_id];
  const mockHeat = player?.stats.heat ?? 70;

  function handleTransition(to: BlacksiteState | null) {
    if (to === null) {
      setReleased(true);
    } else {
      setState(to);
    }
  }

  // Demo: advance state manually for INTAKE (no actions available)
  function handleIntakeAdvance() {
    setState('BLACKSITE_CONFINED');
  }

  if (released) {
    return (
      <div className="panel" style={{ padding: '20px', textAlign: 'center', fontFamily: 'Verdana, sans-serif' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a9a4a', marginBottom: '8px' }}>✓ Released</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{profile.alias} has been released from The Box.</div>
        <div style={{ fontSize: '9px', color: '#555', marginTop: '6px' }}>
          Heat penalty and rep impact applied. 48h surveillance window active.
        </div>
      </div>
    );
  }

  return (
    <div className="panel" data-testid={`blacksite-${profile.player_id}`} style={{ overflow: 'hidden', marginBottom: '12px' }}>
      {/* Header */}
      <div className="panel-header" style={{ background: '#130d1a', borderBottomColor: '#3a1a5a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BlacksiteBadge state={state} />
          <span style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '11px' }}>{profile.alias}</span>
          <span style={{ fontSize: '10px', color: '#888' }}>· {sentenceDays} days remaining</span>
        </div>
        <Shield size={14} style={{ color: '#9955cc' }} />
      </div>

      {/* State description */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a', fontSize: '10px', color: '#888', lineHeight: '1.5' }}>
        {STATE_DESC[state]}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
        {[
          ['Cash',      fmt(player?.stats.cash ?? 0),     'text-cash'],
          ['Heat',      `${mockHeat}/100`, mockHeat > 70 ? 'text-danger' : 'text-warn'],
          ['Suspicion', player?.stats.suspicion ?? 0,     ''],
          ['HP',        `${player?.stats.hp ?? 0}/100`,   ''],
        ].map(([l, v, cls]) => (
          <div key={String(l)}>
            <div className="label-caps">{l}</div>
            <div className={`stat-val ${cls}`} style={{ fontSize: '13px' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* State nav — show current state + transition buttons */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#555', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>State:</span>
        {(['BLACKSITE_INTAKE','BLACKSITE_CONFINED','BLACKSITE_MAX_SECURITY','BLACKSITE_RELEASE_ELIGIBLE'] as BlacksiteState[]).map(s => (
          <button key={s} onClick={() => setState(s)}
            className={`btn ${state === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '9px', padding: '2px 7px' }}
            data-testid={`state-btn-${s.toLowerCase()}`}
          >
            {s.replace('BLACKSITE_','')}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 12px' }}>
        {state === 'BLACKSITE_INTAKE' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: '10px', color: '#555', marginBottom: '10px' }}>Processing. No actions available yet.</p>
            <button onClick={handleIntakeAdvance} className="btn btn-ghost" style={{ fontSize: '10px' }}
              data-testid="intake-advance"
            >
              Advance to Confinement →
            </button>
          </div>
        ) : actions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: '10px', color: '#555' }}>
            No actions available in this state.
          </div>
        ) : (
          <>
            <p className="label-caps" style={{ marginBottom: '8px' }}>Available Actions</p>
            {actions.map(a => (
              <ActionButton
                key={a.id}
                action={a}
                currentHeat={mockHeat}
                currentSentenceDays={sentenceDays}
                onTransition={handleTransition}
              />
            ))}
          </>
        )}
      </div>

      {/* Outcome model explanation */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#444', lineHeight: '1.5' }}>
        Release outcome affects: heat level, reputation on contract board, future contract eligibility, and access to top-tier contracts.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HitmanPrison main
// ─────────────────────────────────────────────

export default function HitmanPrison() {
  const { player, gameRole } = useGame();
  const isHitman   = gameRole === 'SOLO_HITMAN';
  const myProfile  = MOCK_HITMAN_PROFILES.find(p => p.player_id === player.id);
  const inBox      = MOCK_HITMAN_PROFILES.filter(p => p.blacksite_state !== null);

  return (
    <div>
      <PageHeader
        title='The Box — Hitman Prison'
        sub="Separate from regular jail. Hitmen only. Contract board suspended while detained."
      />

      <InfoAlert variant="purple">
        <strong>The Box Rules:</strong> Hitman-only detention. Completely separate from regular criminal jail.
        Traced contract failures send you here. While detained: removed from the public contract board,
        leaderboard status paused, no new contracts can be accepted.
        Hiring family receives 2× contract value in blowback compensation.
        Target gains a 7-day retaliation advantage against the hiring family.
      </InfoAlert>

      {/* Hitman-specific view — their own status */}
      {isHitman && !myProfile?.blacksite_state && (
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Shield size={32} style={{ color: '#333', margin: '0 auto 10px' }} />
          <p style={{ fontSize: '12px', color: '#666' }}>No blacksite record. Stay clean.</p>
          <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>
            Traced contract failures send you here. The box pauses your contract board access.
          </p>
        </div>
      )}

      {/* Show all detained hitmen */}
      {inBox.length === 0 && !isHitman && (
        <EmptySlate msg="No hitmen currently detained in The Box." />
      )}

      <div className="ml-grid-auto">
        {inBox.map(p => <BlacksiteCell key={p.player_id} profile={p} />)}
      </div>
    </div>
  );
}
