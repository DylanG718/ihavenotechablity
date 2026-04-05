/**
 * MissionBoard + MissionDetail
 *
 * Implements:
 * - Mission list with tier/type/hitman slot status
 * - MissionDetail modal with:
 *   - role assignment for family members
 *   - OPTIONAL hitman specialist slot (external contractor, clearly labelled)
 *   - mission execution with outcome resolution
 *   - outcome summary (success/failure, heat changes, arrest list, hitman impact)
 *
 * UX assumption: "Run Mission" in this prototype uses a local outcome roll.
 * In production this would be a server-side call.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_INVITE_TRACKERS } from '../lib/diplomacyMockData';
import { InviteCapBadge } from '../components/ui/InviteCapBadge';
import { computeArrestChance, computeSentenceHours, jailTierFromMissionTier } from '../../../shared/jail';
import { MOCK_MISSIONS, MOCK_PLAYERS, MOCK_HITMAN_PROFILES, MOCK_FAMILY, fmt } from '../lib/mockData';
import { can } from '../lib/permissions';
import { PageHeader, SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { MissionBadge, TierBadge } from '../components/ui/Badges';
import { resolveMission, type MissionOutcomeResult } from '../lib/gameLogic';
import type { Mission, SlotRole } from '../../../shared/schema';
import { HITMAN_SLOT_EFFECT_LABELS } from '../../../shared/schema';

const SLOT_LABELS: Record<SlotRole, string> = {
  LEAD: 'Lead', ENFORCER: 'Enforcer', SHOOTER: 'Shooter',
  WHEELMAN: 'Wheelman', INSIDE_MAN: 'Inside Man', MONEY_MAN: 'Money Man',
};

// Spec-aligned slot labels imported from schema

// ─────────────────────────────────────────────
// Outcome display
// ─────────────────────────────────────────────

function OutcomePanel({ result, basePayout, onClose }: {
  result: MissionOutcomeResult;
  basePayout: number;
  onClose: () => void;
}) {
  const isSuccess = result.outcome === 'SUCCESS' || result.outcome === 'PARTIAL_SUCCESS';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '500px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <span className="panel-title">Mission Outcome</span>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: isSuccess ? '#4a9a4a' : '#cc3333', marginBottom: '4px' }}>
              {result.outcome.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>{result.notes}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
            <tbody>
              {[
                ['Payout',       fmt(result.payoutActual),           result.payoutActual > 0 ? '#4a9a4a' : '#cc3333'],
                ['Heat Change',  `+${result.heatDelta}`,             '#cc7700'],
                ['Suspicion',    `+${result.suspicionDelta}`,         result.suspicionDelta > 0 ? '#cc3333' : '#4a9a4a'],
                ['Respect',      result.respectDelta >= 0 ? `+${result.respectDelta}` : String(result.respectDelta), result.respectDelta >= 0 ? '#4a9a4a' : '#cc3333'],
              ].map(([l, v, c]) => (
                <tr key={String(l)}>
                  <td style={{ padding: '4px 0', color: '#888', borderBottom: '1px solid #1a1a1a' }}>{l}</td>
                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: c, textAlign: 'right', borderBottom: '1px solid #1a1a1a' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.arrests.length > 0 && (
            <div style={{ background: '#1a0808', border: '1px solid #3a1010', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#cc3333' }}>
              <strong>Arrests:</strong> {result.arrests.join(', ')} — sent to jail.
            </div>
          )}

          {/* Show arrest chance breakdown for failed missions */}
          {!isSuccess && result.arrests.length === 0 && (
            <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#888' }}>
              <div style={{ fontWeight: 'bold', color: '#e0e0e0', marginBottom: '3px' }}>Close Call — Not Arrested This Time</div>
              <div>Arrest risk factors: job tier, your rank, and family heat all contributed.</div>
              <a href="#/jail" style={{ color: '#cc3333', fontSize: '9px', display: 'block', marginTop: '4px' }}>
                View Jail System →
              </a>
            </div>
          )}

          {result.hitmanImpact && (
            <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#5580bb' }}>
              <strong>Hitman Specialist:</strong> {result.hitmanImpact}
            </div>
          )}

          {result.outcome === 'COMPROMISED' && (
            <div style={{ background: '#1a0808', border: '1px solid #3a1010', padding: '8px', marginBottom: '10px', fontSize: '10px', color: '#cc3333' }}>
              ⚠ Mission blown. Law enforcement alerted. Retaliation window may be active.
              TODO: wire real retaliation logic here.
            </div>
          )}

          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '8px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MissionDetail modal
// ─────────────────────────────────────────────

function MissionDetail({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const { player, gameRole, applyStatDeltas } = useGame();
  const isRecruit   = gameRole === 'RECRUIT';
  const canLaunch   = can(gameRole, 'START_MISSION');
  const canPost     = can(gameRole, 'POST_CONTRACT');

  // Role assignment state
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    mission.required_slots.forEach(s => {
      if (s.filled_by) init[s.role] = s.filled_by;
    });
    return init;
  });

  // Hitman specialist selection
  const [selectedHitman, setSelectedHitman] = useState<string | null>(
    mission.optional_hitman_slot?.filled_by ?? null
  );

  // Outcome state
  const [outcome, setOutcome] = useState<MissionOutcomeResult | null>(null);
  const [running, setRunning] = useState(false);

  const availableMembers = Object.values(MOCK_PLAYERS).filter(p => p.family_id && p.player_status === 'ACTIVE');

  const availableHitmen = MOCK_HITMAN_PROFILES.filter(
    h => ['FREE','FREE_REBUILT'].includes(h.availability)
  );

  const filledCount = mission.required_slots.filter(s => assignments[s.role]).length;
  const allFilled   = filledCount === mission.required_slots.length;
  const canRun      = canLaunch && allFilled;

  function handleRunMission() {
    setRunning(true);
    const leadPlayer = Object.values(MOCK_PLAYERS).find(p => p.id === assignments['LEAD']);
    const hitman = selectedHitman ? MOCK_HITMAN_PROFILES.find(h => h.player_id === selectedHitman) : undefined;

    const result = resolveMission({
      missionTier:    mission.tier,
      basePayout:     mission.payout,
      leadStats:      leadPlayer?.stats ?? {},
      memberCount:    Object.keys(assignments).length,
      hasHitmanSlot:  !!selectedHitman,
      hitmanAccuracy: hitman ? MOCK_PLAYERS[hitman.player_id]?.stats.accuracy : undefined,
    });

    // Wire outcome deltas back into live player stats
    applyStatDeltas({
      cash:      result.payoutActual,
      heat:      result.heatDelta,
      suspicion: result.suspicionDelta,
      respect:   result.respectDelta,
    });

    setOutcome(result);
    setRunning(false);
  }

  if (outcome) {
    return (
      <OutcomePanel
        result={outcome}
        basePayout={mission.payout}
        onClose={() => { setOutcome(null); onClose(); }}
      />
    );
  }

  return (
    <div className="ml-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} data-testid="mission-modal">
      <div className="panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Verdana, sans-serif' }}>

        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TierBadge tier={mission.tier} />
            <MissionBadge state={mission.state} />
            {mission.recruit_eligible && <span className="badge-green">Recruit OK</span>}
            <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>{mission.title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '12px' }}>

          {/* Brief */}
          <section style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Mission Brief</p>
            <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.55' }}>{mission.description}</p>
          </section>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              ['Payout',    fmt(mission.payout),  'text-cash'],
              ['Heat +',    `+${mission.heat_cost}`, 'text-heat'],
              ['Tier',      mission.tier,            `tier-${mission.tier}`],
              ['Type',      mission.type,            ''],
            ].map(([l, v, cls]) => (
              <div key={String(l)} style={{ background: '#181818', border: '1px solid #1a1a1a', padding: '6px 8px' }}>
                <div className="label-caps">{l}</div>
                <div className={`stat-val ${cls}`} style={{ fontSize: '13px' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Required role slots with assignment */}
          <section style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Required Roles ({filledCount}/{mission.required_slots.length} filled)
            </p>
            {mission.required_slots.map((slot, i) => {
              const assignedPlayer = assignments[slot.role] ? MOCK_PLAYERS[assignments[slot.role]] : null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ width: '24px', height: '24px', background: assignedPlayer ? '#1a3a1a' : '#1a1a1a', border: `1px solid ${assignedPlayer ? '#2a6a2a' : '#2a2a2a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: assignedPlayer ? '#4a9a4a' : '#444', flexShrink: 0 }}>
                    {assignedPlayer ? '✓' : '?'}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0', width: '100px', flexShrink: 0 }}>
                    {SLOT_LABELS[slot.role]}
                  </span>
                  <span className="badge-red" style={{ flexShrink: 0 }}>Required</span>
                  {canLaunch ? (
                    <select
                      value={assignments[slot.role] ?? ''}
                      onChange={e => setAssignments(a => ({ ...a, [slot.role]: e.target.value }))}
                      style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#e0e0e0', fontSize: '10px', padding: '2px 4px' }}
                    >
                      <option value="">— Assign Member —</option>
                      {availableMembers.map(p => (
                        <option key={p.id} value={p.id}>{p.alias} ({p.archetype})</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ flex: 1, fontSize: '10px', color: assignedPlayer ? '#4a9a4a' : '#888' }}>
                      {assignedPlayer ? `${assignedPlayer.alias} ✓` : 'Open'}
                    </span>
                  )}
                </div>
              );
            })}
          </section>

          {/* Optional hitman specialist slot */}
          {mission.optional_hitman_slot && (
            <section style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Optional Hitman Specialist Slot
              </p>
              <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge-blue">Optional</span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#e0e0e0' }}>
                    {HITMAN_SLOT_EFFECT_LABELS[mission.optional_hitman_slot.effect]}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#ffcc33', fontWeight: 'bold', fontSize: '10px' }}>
                    {fmt(mission.optional_hitman_slot.price_offered)}
                  </span>
                </div>

                <div style={{ background: '#07080f', border: '1px solid #12172a', padding: '6px 8px', marginBottom: '8px', fontSize: '10px', color: '#666' }}>
                  ⚠ <strong style={{ color: '#888' }}>External contractor only.</strong> The hitman is NOT a family member.
                  They have no access to family governance, treasury, or internal information.
                  Your family's identity is anonymized — the hitman sees only a client code.
                </div>

                <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '8px' }}>
                  Bonus if filled: <strong style={{ color: '#5580bb' }}>{mission.optional_hitman_slot.bonus_description}</strong>
                </p>

                {mission.optional_hitman_slot.state === 'FILLED' ? (
                  <div style={{ fontSize: '10px', color: '#4a9a4a' }}>
                    ✓ Specialist slot filled by {MOCK_PLAYERS[mission.optional_hitman_slot.filled_by!]?.alias}
                  </div>
                ) : canPost ? (
                  <div>
                    <select
                      value={selectedHitman ?? ''}
                      onChange={e => setSelectedHitman(e.target.value || null)}
                      style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#e0e0e0', fontSize: '10px', padding: '3px 6px', marginBottom: '6px' }}
                    >
                      <option value="">— No Hitman (mission runs without specialist) —</option>
                      {availableHitmen.map(h => (
                        <option key={h.player_id} value={h.player_id}>
                          {h.alias} · {h.rep_tier} · {Math.round(h.success_rate * 100)}% success · {fmt(h.price_min)}–{fmt(h.price_max)}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '9px', color: '#555' }}>
                      Mission will proceed without a hitman if no specialist is selected.
                      Hiring one improves success odds but costs escrow funds.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>
                    Boss or Underboss can post a hitman support contract for this slot.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Recruit restriction notice */}
          {isRecruit && !mission.recruit_eligible && (
            <InfoAlert variant="warn">
              This mission is above Recruit clearance. You must be promoted to Associate before joining.
            </InfoAlert>
          )}

          {/* Resolved outcome summary (for historical missions) */}
          {mission.outcome && (
            <section style={{ marginBottom: '10px' }}>
              <div style={{ background: mission.outcome === 'SUCCESS' ? '#0d1a0d' : '#1a0d0d', border: `1px solid ${mission.outcome === 'SUCCESS' ? '#2a4a2a' : '#3a1a1a'}`, padding: '8px 10px', fontSize: '10px' }}>
                <strong style={{ color: mission.outcome === 'SUCCESS' ? '#4a9a4a' : '#cc3333' }}>
                  Resolved: {mission.outcome}
                </strong>
                {mission.outcome_notes && <p style={{ color: '#aaa', marginTop: '4px' }}>{mission.outcome_notes}</p>}
              </div>
            </section>
          )}

          {/* Action buttons */}
          {mission.state === 'OPEN' && (
            <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #1a1a1a' }}>
              {canRun ? (
                <button
                  className="btn btn-primary"
                  data-testid="run-mission"
                  onClick={handleRunMission}
                  disabled={running}
                  style={{ flex: 1, padding: '8px', fontSize: '11px' }}
                >
                  {running ? 'Running...' : 'Run Mission'}
                  {selectedHitman ? ` (with ${MOCK_HITMAN_PROFILES.find(h => h.player_id === selectedHitman)?.alias})` : ' (no hitman)'}
                </button>
              ) : canLaunch ? (
                <div style={{ flex: 1, fontSize: '10px', color: '#cc9900', padding: '8px' }}>
                  Assign all required roles before running.
                </div>
              ) : null}
              {!isRecruit || mission.recruit_eligible ? (
                <button className="btn btn-ghost" data-testid="join-mission" style={{ padding: '8px' }}>
                  Join Mission
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MissionBoard
// ─────────────────────────────────────────────

export default function MissionBoard() {
  const { gameRole, player } = useGame();
  const inviteTracker = MOCK_INVITE_TRACKERS[player.id];
  const isRecruit = gameRole === 'RECRUIT';
  const canCreate = can(gameRole, 'CREATE_MISSION');

  const [selected, setSelected] = useState<Mission | null>(null);
  const [filter, setFilter] = useState<'ALL'|'OPEN'|'ACTIVE'|'RESOLVED'>('ALL');

  const missions = MOCK_MISSIONS.filter(m => {
    if (isRecruit && !m.recruit_eligible && !['SUCCESS','PARTIAL_SUCCESS','FAILURE'].includes(m.state)) return false;
    if (filter === 'OPEN')     return m.state === 'OPEN';
    if (filter === 'ACTIVE')   return m.state === 'ACTIVE';
    if (filter === 'RESOLVED') return ['SUCCESS','PARTIAL_SUCCESS','FAILURE','COMPROMISED'].includes(m.state);
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Mission Board"
        sub="Family operations. Assign roles, optionally attach hitman specialist, run the job."
        action={canCreate && (
          <button className="btn btn-primary" data-testid="new-mission">+ New Mission</button>
        )}
      />

      {isRecruit && (
        <InfoAlert variant="warn">
          Recruit access: Starter missions only. Missions marked "Recruit OK" are available to you.
        </InfoAlert>
      )}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {(['ALL','OPEN','ACTIVE','RESOLVED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">Operations</span>
          <span style={{ fontSize: '10px', color: '#666' }}>{missions.length} shown</span>
        </div>
        <div className="ml-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mission</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Payout</th>
              <th>Heat</th>
              <th title="Arrest chance on failure (based on tier, rank, heat)">Arrest Risk</th>
              <th>Slots</th>
              <th>Hitman Slot</th>
              <th>Status</th>
              <th>Recruit OK</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(m => {
              const filled = m.required_slots.filter(s => s.filled_by).length;
              const hmState = m.optional_hitman_slot?.state;
              return (
                <tr key={m.id} onClick={() => setSelected(m)} style={{ cursor: 'pointer' }}
                  data-testid={`mission-${m.id}`}
                >
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>
                    {m.title}
                    {/* Show invite cap warning if this player has a tracker and is an invite recipient */}
                    {inviteTracker && inviteTracker.reward_multiplier < 1.0 && (
                      <span style={{ marginLeft: '6px' }}>
                        <InviteCapBadge tracker={inviteTracker} isInvited={true} baseReward={m.payout} />
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#888' }}>{m.type}</td>
                  <td><TierBadge tier={m.tier} /></td>
                  <td className="text-cash">{fmt(m.payout)}</td>
                  <td className="text-heat">+{m.heat_cost}</td>
                  <td style={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '10px', color: (() => {
                    const pct = Math.round(computeArrestChance({ tier: m.tier, role: player.family_role ?? 'UNAFFILIATED', familyHeat: player.stats.heat }) * 100);
                    return pct >= 40 ? '#cc3333' : pct >= 20 ? '#cc9900' : '#4a9a4a';
                  })() }}>
                    {Math.round(computeArrestChance({ tier: m.tier, role: player.family_role ?? 'UNAFFILIATED', familyHeat: player.stats.heat }) * 100)}%
                  </td>
                  <td style={{ color: '#888' }}>{filled}/{m.required_slots.length}</td>
                  <td>
                    {m.optional_hitman_slot
                      ? hmState === 'FILLED'
                        ? <span className="badge-green">Filled</span>
                        : <span className="badge-blue">Open</span>
                      : <span style={{ color: '#444' }}>—</span>
                    }
                  </td>
                  <td><MissionBadge state={m.state} /></td>
                  <td>
                    {m.recruit_eligible
                      ? <span className="badge-green">Yes</span>
                      : <span className="badge-gray">No</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {selected && <MissionDetail mission={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
