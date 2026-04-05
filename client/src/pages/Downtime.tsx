/**
 * DowntimeActions — Hitman downtime loop
 *
 * Available activities:
 *  - Surveillance Job
 *  - Cleanup Job
 *  - Mercenary Side Contract
 *  - Training & Calibration
 *  - Informant Network
 *  - Safehouse Management
 *
 * Each activity shows:
 *  - description, duration, risk
 *  - reward breakdown (cash, rep, heat delta, readiness, intel, next-contract bonus)
 *  - execution flow: Start → "In Progress" timer → Complete → Outcome summary
 *
 * Outcomes use resolveDowntime() from gameLogic.ts.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_DOWNTIME_JOBS, fmt } from '../lib/mockData';
import { PageHeader, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { StatGrid } from '../components/ui/StatGrid';
import type { DowntimeActivityType } from '../../../shared/schema';
import { resolveDowntime, type DowntimeOutcome } from '../lib/gameLogic';
import { DOWNTIME_LABELS } from '../lib/downtimeLabels';
import { Clock } from 'lucide-react';

// Spec-aligned activity labels
const ACTIVITY_LABEL = DOWNTIME_LABELS;

// ─────────────────────────────────────────────
// Activity execution modal
// ─────────────────────────────────────────────

function ActivityModal({ job, onClose }: {
  job: typeof MOCK_DOWNTIME_JOBS[0];
  onClose: () => void;
}) {
  const { player, applyStatDeltas } = useGame();
  const [phase, setPhase] = useState<'confirm' | 'running' | 'done'>('confirm');
  const [outcome, setOutcome] = useState<DowntimeOutcome | null>(null);

  function handleStart() {
    setPhase('running');
    setTimeout(() => {
      const result = resolveDowntime(job.activity, player.stats);
      // Wire outcome deltas back into live player stats
      applyStatDeltas({
        cash:      result.cashEarned,
        heat:      result.heatDelta,
        suspicion: result.suspicionDelta,
      });
      setOutcome(result);
      setPhase('done');
    }, 800);
  }

  return (
    <div className="ml-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '480px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <span className="panel-title">{ACTIVITY_LABEL[job.activity]}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '14px' }}>

          {/* Confirm phase */}
          {phase === 'confirm' && (
            <>
              <p style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.55', marginBottom: '12px' }}>
                {job.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {[
                  ['Duration',   `${job.duration_hours}h`,  ''],
                  ['Risk',       job.risk_level,             job.risk_level === 'HIGH' ? 'text-danger' : job.risk_level === 'MEDIUM' ? 'text-warn' : 'text-success'],
                  ['Cash',       job.reward_cash < 0 ? `${fmt(job.reward_cash)} (cost)` : fmt(job.reward_cash), job.reward_cash >= 0 ? 'text-cash' : 'text-danger'],
                  ['Rep',        job.reward_rep > 0 ? `+${job.reward_rep}` : '—', ''],
                  ['Heat',       job.reward_heat_reduction > 0 ? `-${job.reward_heat_reduction}` : '—', 'text-success'],
                  ['Readiness',  job.reward_readiness > 0 ? `+${job.reward_readiness}` : '—', ''],
                  ['Intel',      job.reward_intel > 0 ? `+${job.reward_intel}` : '—', ''],
                ].map(([l, v, cls]) => (
                  <div key={String(l)} style={{ background: '#181818', border: '1px solid #1a1a1a', padding: '6px 8px' }}>
                    <div className="label-caps">{l}</div>
                    <div className={`stat-val ${cls}`} style={{ fontSize: '12px' }}>{v}</div>
                  </div>
                ))}
              </div>

              {job.next_contract_bonus && (
                <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '8px 10px', marginBottom: '12px', fontSize: '10px', color: '#5580bb' }}>
                  Next contract bonus: {job.next_contract_bonus}
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#555', marginBottom: '12px' }}>
                Duration is simulated in this prototype. In production, activities run on a real timer.
                {/* TODO: replace with real server-side duration timer */}
              </div>

              <button onClick={handleStart} className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '11px' }}
                data-testid={`start-activity-${job.id}`}
              >
                Start {ACTIVITY_LABEL[job.activity]}
              </button>
            </>
          )}

          {/* Running phase */}
          {phase === 'running' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid #cc3333', borderTop: '2px solid transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '11px', color: '#aaa' }}>Activity in progress...</p>
              <p style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>Simulating {job.duration_hours}h duration</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Done phase — outcome */}
          {phase === 'done' && outcome && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a9a4a', marginBottom: '4px' }}>
                  ✓ Activity Complete
                </div>
                <div style={{ fontSize: '10px', color: '#aaa' }}>{outcome.notes}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
                <tbody>
                  {[
                    outcome.cashEarned !== 0  && ['Cash',        outcome.cashEarned < 0 ? fmt(outcome.cashEarned) : `+${fmt(outcome.cashEarned)}`, outcome.cashEarned >= 0 ? '#4a9a4a' : '#cc3333'],
                    outcome.repDelta !== 0    && ['Reputation',  `${outcome.repDelta > 0 ? '+' : ''}${outcome.repDelta}`, outcome.repDelta >= 0 ? '#4a9a4a' : '#cc3333'],
                    outcome.heatDelta !== 0   && ['Heat',        `${outcome.heatDelta > 0 ? '+' : ''}${outcome.heatDelta}`, outcome.heatDelta > 0 ? '#cc7700' : '#4a9a4a'],
                    outcome.readinessDelta !== 0 && ['Readiness', `+${outcome.readinessDelta}`, '#5580bb'],
                    outcome.intelDelta !== 0  && ['Intel',       `+${outcome.intelDelta}`, '#9955cc'],
                  ].filter(Boolean).map(row => {
                    const [l, v, c] = row as [string, string, string];
                    return (
                      <tr key={l}>
                        <td style={{ padding: '4px 0', color: '#888', borderBottom: '1px solid #1a1a1a' }}>{l}</td>
                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: c, textAlign: 'right', borderBottom: '1px solid #1a1a1a' }}>{v}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {outcome.nextContractBonus && (
                <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#5580bb' }}>
                  Next contract bonus unlocked: {outcome.nextContractBonus}
                </div>
              )}

              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '8px' }}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DowntimeCard — individual activity card
// ─────────────────────────────────────────────

function DowntimeCard({ job }: { job: typeof MOCK_DOWNTIME_JOBS[0] }) {
  const [showModal, setShowModal] = useState(false);

  const riskColor = job.risk_level === 'HIGH' ? '#cc3333' : job.risk_level === 'MEDIUM' ? '#cc9900' : '#4a9a4a';

  return (
    <>
      <div className="panel" style={{ padding: '10px 12px', fontFamily: 'Verdana, sans-serif' }} data-testid={`downtime-card-${job.id}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '3px' }}>
              <span className="badge-gray" style={{ fontSize: '9px' }}>{ACTIVITY_LABEL[job.activity]}</span>
              <span style={{ fontSize: '9px', color: riskColor, border: `1px solid ${riskColor}`, padding: '1px 4px' }}>
                {job.risk_level} RISK
              </span>
            </div>
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#e0e0e0', margin: 0 }}>{job.title}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#888', flexShrink: 0 }}>
            <Clock size={10} /> {job.duration_hours}h
          </div>
        </div>

        <p style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.45', marginBottom: '8px' }}>{job.description}</p>

        {/* Reward summary */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '9px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {job.reward_cash !== 0 && (
            <span style={{ color: job.reward_cash >= 0 ? '#ffcc33' : '#cc3333' }}>
              {job.reward_cash < 0 ? '−' : '+'}{fmt(Math.abs(job.reward_cash))}
            </span>
          )}
          {job.reward_rep > 0    && <span style={{ color: '#5580bb' }}>+{job.reward_rep} rep</span>}
          {job.reward_heat_reduction > 0 && <span style={{ color: '#4a9a4a' }}>−{job.reward_heat_reduction} heat</span>}
          {job.reward_readiness > 0     && <span style={{ color: '#9955cc' }}>+{job.reward_readiness} readiness</span>}
          {job.reward_intel > 0         && <span style={{ color: '#9955cc' }}>+{job.reward_intel} intel</span>}
        </div>

        {job.next_contract_bonus && (
          <div style={{ fontSize: '9px', color: '#5580bb', marginBottom: '8px' }}>
            Contract bonus: {job.next_contract_bonus}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          data-testid={`open-activity-${job.id}`}
          style={{ width: '100%', padding: '5px' }}
        >
          Start Activity
        </button>
      </div>

      {showModal && <ActivityModal job={job} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────
// DowntimeActions main
// ─────────────────────────────────────────────

export default function DowntimeActions() {
  const { gameRole, player } = useGame();

  if (gameRole !== 'SOLO_HITMAN') {
    return (
      <div>
        <PageHeader title="Downtime Activities" sub="Hitman-only." />
        <EmptySlate
          msg="Downtime activities are exclusive to Solo Hitmen."
          sub="Family members take missions through the Mission Board."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Downtime Activities"
        sub="No active contract? Run a downtime activity to earn money, build intel, reduce heat, or prepare safehouse."
      />

      {/* Current stats */}
      <div className="panel" style={{ padding: '10px 12px', marginBottom: '10px', overflow: 'hidden' }}>
        <div className="panel-header" style={{ margin: '-10px -12px 10px', padding: '5px 12px' }}>
          <span className="panel-title">Current Stats</span>
        </div>
        <StatGrid stats={player.stats} role="SOLO_HITMAN" />
      </div>

      <InfoAlert>
        High-risk activities raise heat. Safehouse upgrades and training reduce risk before your next contract.
        Each completed activity may unlock a bonus that carries into your next job.
        {/* TODO: wire next-contract bonuses to contract resolution system */}
      </InfoAlert>

      <div className="ml-grid-auto">
        {MOCK_DOWNTIME_JOBS.map(j => <DowntimeCard key={j.id} job={j} />)}
      </div>
    </div>
  );
}
