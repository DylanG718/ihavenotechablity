/**
 * ContractBoard
 *
 * Dual view: family leadership sees contracts they posted (with target info).
 * Hitmen see anonymized contracts (client code only, never real family name).
 *
 * Full flow: browse → accept → scouting → preparation → execution → outcome
 * Outcome uses resolveContract() stub from gameLogic.ts.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_CONTRACTS, MOCK_HITMAN_PROFILES, fmt } from '../lib/mockData';
import { can } from '../lib/permissions';
import { PageHeader, SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { ContractBadge, OutcomeBadge } from '../components/ui/Badges';
import { resolveContract, type ContractOutcomeResult } from '../lib/gameLogic';
import type { Contract } from '../../../shared/schema';
import { EyeOff } from 'lucide-react';

// ─────────────────────────────────────────────
// ContractPhaseTracker
// ─────────────────────────────────────────────

function PhaseTracker({ phases, onAdvance, canAdvance }: {
  phases: Contract['phases'];
  onAdvance: () => void;
  canAdvance: boolean;
}) {
  const doneCount = phases.filter(p => p.completed).length;
  return (
    <div>
      {phases.map((phase, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '24px', height: '24px', flexShrink: 0, border: `1px solid ${phase.completed ? '#2a6a2a' : '#2a2a2a'}`,
            background: phase.completed ? '#1a3a1a' : '#151515', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '9px', color: phase.completed ? '#4a9a4a' : '#555',
          }}>
            {phase.completed ? '✓' : i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#e0e0e0', marginBottom: '2px' }}>{phase.label}</div>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>{phase.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {phase.actions.map(a => <span key={a} className="badge-gray">{a}</span>)}
            </div>
          </div>
        </div>
      ))}
      {canAdvance && doneCount < phases.length && (
        <button onClick={onAdvance} className="btn btn-primary" style={{ width: '100%', padding: '6px', marginTop: '6px' }}>
          Advance Phase ({doneCount + 1}/{phases.length})
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ContractOutcomePanel
// ─────────────────────────────────────────────

function ContractOutcomePanel({ result, onClose }: { result: ContractOutcomeResult; onClose: () => void }) {
  const isSuccess = result.outcome === 'SUCCESS_CLEAN' || result.outcome === 'SUCCESS_MESSY';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '460px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header"><span className="panel-title">Contract Outcome</span></div>
        <div style={{ padding: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSuccess ? '#4a9a4a' : '#cc3333', marginBottom: '4px' }}>
              {result.outcome.replace(/_/g,' ')}
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>{result.notes}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
            <tbody>
              {[
                ['Payout',        fmt(result.payoutActual),                    result.payoutActual > 0 ? '#4a9a4a' : '#cc3333'],
                ['Heat Change',   `+${result.heatDelta}`,                      '#cc7700'],
                ['Rep Change',    result.repDelta >= 0 ? `+${result.repDelta}` : String(result.repDelta), result.repDelta >= 0 ? '#4a9a4a' : '#cc3333'],
                ['Traced',        result.traced ? 'YES — identity exposed' : 'No', result.traced ? '#cc3333' : '#4a9a4a'],
              ].map(([l, v, c]) => (
                <tr key={String(l)}>
                  <td style={{ padding: '4px 0', color: '#888', borderBottom: '1px solid #1a1a1a' }}>{l}</td>
                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: c, textAlign: 'right', borderBottom: '1px solid #1a1a1a' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.traced && (
            <div style={{ background: '#1a0808', border: '1px solid #3a1010', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#cc3333' }}>
              <strong>Traced Failure.</strong> Your alias is now known to the target.
              The hiring family has been exposed. Target receives {fmt(result.blowbackCompensation)} in blowback compensation.
              7-day retaliation window is now active against the hiring family.
              {/* TODO: wire real blowback penalty + 7-day timer here */}
            </div>
          )}

          {result.outcome === 'CATASTROPHIC_BLOWBACK' && (
            <div style={{ background: '#1a0808', border: '1px solid #4a1010', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#cc3333' }}>
              ⚠ Catastrophic failure. You may be sent to The Box. Check your status.
              {/* TODO: trigger BLACKSITE_INTAKE state here */}
            </div>
          )}

          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '8px' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ContractDetail modal
// ─────────────────────────────────────────────

function ContractDetail({ contract, isHitman, onClose }: {
  contract: Contract;
  isHitman: boolean;
  onClose: () => void;
}) {
  const [phases, setPhases] = useState(contract.phases.map(p => ({ ...p })));
  const [accepted, setAccepted] = useState(contract.hitman_id !== null);
  const [outcome, setOutcome] = useState<ContractOutcomeResult | null>(null);

  const { player, applyStatDeltas } = useGame();
  const myProfile = MOCK_HITMAN_PROFILES.find(h => h.player_id === player.id);

  const doneCount = phases.filter(p => p.completed).length;
  const allDone   = doneCount === phases.length;
  const canExecute = accepted && allDone && contract.state !== 'SUCCESS_CLEAN' && contract.state !== 'SUCCESS_MESSY';

  function handleAccept() {
    setAccepted(true);
    // TODO: call backend to lock contract + escrow
  }

  function handleAdvancePhase() {
    setPhases(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => !p.completed);
      if (idx !== -1) next[idx] = { ...next[idx], completed: true };
      return next;
    });
  }

  function handleExecute() {
    const result = resolveContract({
      difficulty:     contract.target_difficulty,
      hitmanStats:    player.stats,
      contractPrice:  contract.price,
      urgency:        contract.urgency,
      secrecy:        contract.secrecy,
    });
    // Wire outcome deltas back into live player stats
    applyStatDeltas({
      cash:       result.payoutActual,
      heat:       result.heatDelta,
      suspicion:  result.suspicionDelta,
    });
    setOutcome(result);
  }

  if (outcome) {
    return <ContractOutcomePanel result={outcome} onClose={() => { setOutcome(null); onClose(); }} />;
  }

  return (
    <div className="ml-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      data-testid="contract-detail"
    >
      <div className="panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Verdana, sans-serif' }}>

        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ContractBadge state={contract.state} />
            <span style={{ fontWeight: 'bold' }}>Target: {contract.target_alias}</span>
            <span className="badge-gray">{contract.contract_type}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '12px' }}>

          {/* Anonymity notice — only for hitman view */}
          {isHitman && (
            <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px 10px', marginBottom: '12px', fontSize: '10px', color: '#888', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <EyeOff size={12} style={{ flexShrink: 0, marginTop: '1px', color: '#555' }} />
              <span>
                <strong style={{ color: '#e0e0e0' }}>Client: {contract.anonymized_poster_id}</strong> —
                The hiring party's real identity is never revealed to you.
                If you fail and the hit is traced, your alias is exposed to the target.
                A traced failure costs you 2× the contract value in blowback, paid to the attacked side.
              </span>
            </div>
          )}

          {/* Blowback notice */}
          {contract.state === 'FAILED_TRACED' && (
            <div style={{ background: '#1a0808', border: '1px solid #3a1010', padding: '8px', marginBottom: '12px', fontSize: '10px', color: '#cc3333' }}>
              <strong>Traced Failure — Blowback Active.</strong><br />
              Target knows the hiring family. 7-day retaliation window active.
              Blowback compensation: {fmt(contract.price * 2)} paid to attacked side.
            </div>
          )}

          {/* Contract details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              ['Price',       fmt(contract.price),         'text-cash'],
              ['Escrow',      fmt(contract.escrow_locked),  ''],
              ['Difficulty',  contract.target_difficulty,   ''],
              ['Urgency',     contract.urgency,             ''],
              ['Secrecy',     contract.secrecy,             ''],
              ['Type',        contract.contract_type,       ''],
            ].map(([l, v, cls]) => (
              <div key={String(l)} style={{ background: '#181818', border: '1px solid #1a1a1a', padding: '6px 8px' }}>
                <div className="label-caps">{l}</div>
                <div className={`stat-val ${cls}`} style={{ fontSize: '12px' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Intel notes */}
          {contract.notes && (
            <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px 10px', marginBottom: '12px', fontSize: '10px', color: '#aaa', fontStyle: 'italic' }}>
              Intel: "{contract.notes}"
            </div>
          )}

          {/* Accept button — hitman only, contract must be POSTED */}
          {isHitman && (contract.state === 'POSTED' || contract.state === 'ACCEPTED') && !accepted && (
            <button
              onClick={handleAccept}
              className="btn btn-primary"
              data-testid={`accept-${contract.id}`}
              style={{ width: '100%', padding: '8px', marginBottom: '14px', fontSize: '11px' }}
            >
              Accept Contract — {fmt(contract.price)}
            </button>
          )}

          {/* Phase tracker */}
          {(accepted || !isHitman) && (
            <section style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Contract Phases ({doneCount}/{phases.length})
              </p>
              <PhaseTracker
                phases={phases}
                onAdvance={handleAdvancePhase}
                canAdvance={isHitman && accepted}
              />
            </section>
          )}

          {/* Execute */}
          {isHitman && canExecute && (
            <button
              onClick={handleExecute}
              className="btn btn-danger"
              data-testid="execute-contract"
              style={{ width: '100%', padding: '8px', marginTop: '6px', fontSize: '11px' }}
            >
              Execute Contract
            </button>
          )}

          {/* Outcome display for resolved contracts */}
          {contract.outcome && (
            <div style={{ marginTop: '10px' }}>
              <OutcomeBadge outcome={contract.outcome} />
              <p style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>This contract has been resolved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Post Contract form
// ─────────────────────────────────────────────

function NewContractForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="ml-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '440px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header"><span className="panel-title">Post Contract</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '12px' }}>
          <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px', fontSize: '10px', color: '#888', marginBottom: '12px', display: 'flex', gap: '6px' }}>
            <EyeOff size={11} style={{ flexShrink: 0, marginTop: '1px', color: '#555' }} />
            Your identity is anonymized. The hitman sees only a client code.
            Traced failures expose your family to the target.
          </div>
          {[
            { label: 'Target Alias', id: 'target', type: 'text', ph: 'Target name or alias' },
            { label: 'Contract Price ($)', id: 'price', type: 'number', ph: '50000' },
          ].map(f => (
            <div key={f.id} style={{ marginBottom: '10px' }}>
              <div className="label-caps" style={{ marginBottom: '4px' }}>{f.label}</div>
              <input type={f.type} placeholder={f.ph} className="game-input" data-testid={`contract-${f.id}`} />
            </div>
          ))}
          <div style={{ marginBottom: '10px' }}>
            <div className="label-caps" style={{ marginBottom: '4px' }}>Intel Notes (optional)</div>
            <textarea rows={3} className="game-input" style={{ width: '100%', resize: 'none' }}
              placeholder="Known locations, schedule, protection detail..." data-testid="contract-notes" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[['Urgency', ['LOW','MEDIUM','HIGH']], ['Secrecy', ['LOW','MEDIUM','HIGH']]].map(([l, opts]) => (
              <div key={String(l)}>
                <div className="label-caps" style={{ marginBottom: '4px' }}>{l}</div>
                <select className="game-input" style={{ width: '100%' }}>
                  {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 12px 12px', display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" data-testid="submit-contract" style={{ flex: 1, padding: '8px' }}>
            Post Contract (escrow funds)
          </button>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ContractBoard main
// ─────────────────────────────────────────────

export default function ContractBoard() {
  const { gameRole } = useGame();
  const isHitman = gameRole === 'SOLO_HITMAN';
  const canPost  = can(gameRole, 'POST_CONTRACT');

  const [selected, setSelected]   = useState<Contract | null>(null);
  const [showNew,  setShowNew]     = useState(false);
  const [filter, setFilter]        = useState<'ALL'|'OPEN'|'ACTIVE'|'COMPLETED'|'FAILED'>('ALL');

  const contracts = MOCK_CONTRACTS.filter(c => {
    if (filter === 'OPEN')      return c.state === 'POSTED' || c.state === 'ACCEPTED';
    if (filter === 'ACTIVE')    return c.state === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return c.state === 'SUCCESS_CLEAN' || c.state === 'SUCCESS_MESSY';
    if (filter === 'FAILED')    return c.state.startsWith('FAILED') || c.state === 'CATASTROPHIC_BLOWBACK';
    return true;
  });

  const open    = MOCK_CONTRACTS.filter(c => c.state === 'POSTED' || c.state === 'ACCEPTED').length;
  const active  = MOCK_CONTRACTS.filter(c => c.state === 'IN_PROGRESS').length;
  const traced  = MOCK_CONTRACTS.filter(c => c.state === 'FAILED_TRACED').length;

  return (
    <div>
      <PageHeader
        title="Contract Board"
        sub={isHitman
          ? 'Anonymous contracts. Client identities are always protected.'
          : 'Manage assassination contracts. Your identity is anonymized to the hitman.'}
        action={canPost && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Post Contract</button>
        )}
      />

      {isHitman && (
        <InfoAlert>
          <EyeOff size={11} style={{ display: 'inline', marginRight: '4px' }} />
          All client identities are anonymized. You will see a client code only.
          Failing a traced hit exposes your alias to the target and triggers blowback compensation (2× contract value to attacked side).
        </InfoAlert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
        {[
          { l: 'Open',           v: open,   cls: '' },
          { l: 'In Progress',    v: active, cls: active > 0 ? 'text-warn' : '' },
          { l: 'Traced Failures',v: traced, cls: traced > 0 ? 'text-danger' : '' },
        ].map(({ l, v, cls }) => (
          <div key={l} className="panel" style={{ padding: '8px 10px' }}>
            <div className="label-caps">{l}</div>
            <div className={`stat-val ${cls}`}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {(['ALL','OPEN','ACTIVE','COMPLETED','FAILED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>{f}</button>
        ))}
      </div>

      <div className="ml-grid-auto">
        {contracts.map(c => (
          <button key={c.id} onClick={() => setSelected(c)} className="panel"
            style={{ textAlign: 'left', padding: '10px', cursor: 'pointer', fontFamily: 'Verdana, sans-serif' }}
            data-testid={`contract-${c.id}`}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                  <ContractBadge state={c.state} />
                  {c.state === 'FAILED_TRACED' && <span className="badge-red">Blowback</span>}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>Target: {c.target_alias}</div>
                {isHitman
                  ? <div style={{ fontSize: '10px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <EyeOff size={10} /> {c.anonymized_poster_id}
                    </div>
                  : <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Client: {c.anonymized_poster_id}</div>
                }
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffcc33' }}>{fmt(c.price)}</div>
            </div>
            {c.notes && (
              <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{c.notes}"
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: '#555' }}>
              <span>Diff: {c.target_difficulty}</span>
              <span>Urgency: {c.urgency}</span>
              <span>Secrecy: {c.secrecy}</span>
            </div>
            {c.outcome && <div style={{ marginTop: '6px' }}><OutcomeBadge outcome={c.outcome} /></div>}
          </button>
        ))}
      </div>

      {selected && <ContractDetail contract={selected} isHitman={isHitman} onClose={() => setSelected(null)} />}
      {showNew && <NewContractForm onClose={() => setShowNew(false)} />}
    </div>
  );
}
