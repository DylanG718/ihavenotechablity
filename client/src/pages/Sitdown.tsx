/**
 * Sitdown.tsx — Real-time diplomatic meeting room.
 *
 * Roles:
 *   Don (my family)     → can Accept, Decline, Counter-propose
 *   Consigliere/Underboss → can view and add chat notes; cannot commit
 *
 * States handled:
 *   PENDING   → Waiting for other Don to join
 *   ACTIVE    → Timer running, proposals exchangeable
 *   AGREED    → Deal reached — shows outcome + new state
 *   DECLINED  → Don declined — shows result
 *   SNUBBED   → Timeout — shows debuffs applied
 *   EXPIRED   → Session timer ran out
 *
 * DEV MODE: "Fast-forward timer" button collapses session clock for testing.
 *
 * URL params: ?family=<id>&proposal=<type>&to=<state> for initiating new sitdowns
 * Default view: loads MOCK_SITDOWNS[0] (ACTIVE) for demo purposes.
 */

import { useState, useEffect, useRef } from 'react';
import { useGame } from '../lib/gameContext';
import { useLocation } from 'wouter';
import { MOCK_SITDOWNS, MOCK_POLITICAL_TAGS, FAM_CORRADO, FAM_FERRANTE, FAM_WESTSIDE, FAM_RIZZO } from '../lib/diplomacyMockData';
import {
  acceptSitdownProposal, declineSitdownProposal, counterSitdownProposal,
  markSitdownSnubbed, computeSnubEffects, proposalTypeLabel,
  formatTimeRemaining, diplomaticStateColor, diplomaticStateLabel,
} from '../lib/diplomacyEngine';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import type { Sitdown, SitdownProposal, SitdownProposalType } from '../../../shared/diplomacy';
import {
  Clock, CheckCircle, XCircle, RefreshCw, Shield, Swords,
  Users, ChevronLeft, AlertTriangle, Handshake, Timer,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const FAMILY_NAMES: Record<string, string> = {
  'fam-1': 'The Corrado Family',
  'fam-2': 'The Ferrante Crew',
  'fam-3': 'West Side Outfit',
  'fam-4': 'The Rizzo Outfit',
};

function SitdownStateChip({ state }: { state: Sitdown['state'] }) {
  const config: Record<Sitdown['state'], { color: string; label: string }> = {
    PENDING:  { color: '#cc9900', label: 'Waiting for Other Don' },
    ACTIVE:   { color: '#4a9a4a', label: 'Session Active' },
    AGREED:   { color: '#4a9a4a', label: 'Agreement Reached' },
    DECLINED: { color: '#cc3333', label: 'Declined' },
    EXPIRED:  { color: '#888',    label: 'Expired' },
    SNUBBED:  { color: '#cc3333', label: 'Snubbed' },
  };
  const { color, label } = config[state];
  return (
    <span style={{
      fontSize: '10px', fontWeight: 'bold', color,
      border: `1px solid ${color}44`, padding: '2px 8px', background: `${color}11`,
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Countdown timer hook
// ─────────────────────────────────────────────

function useCountdown(target: string | null, devSkip: boolean): string {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!target || devSkip) { setDisplay(devSkip ? '0:00 (DEV)' : '—'); return; }

    function update() {
      const diff = new Date(target!).getTime() - Date.now();
      if (diff <= 0) { setDisplay('00:00'); return; }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setDisplay(`${mins}:${String(secs).padStart(2, '0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target, devSkip]);

  return display;
}

// ─────────────────────────────────────────────
// Proposal history row
// ─────────────────────────────────────────────

function ProposalRow({ proposal, index, total, familyNames }: {
  proposal: SitdownProposal;
  index: number;
  total: number;
  familyNames: Record<string, string>;
}) {
  const responseColors: Record<string, string> = {
    ACCEPTED: '#4a9a4a', DECLINED: '#cc3333', COUNTERED: '#cc9900',
  };
  return (
    <div style={{
      border: '1px solid #2a2a2a', background: '#181818',
      padding: '10px 12px', marginBottom: '6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0' }}>
          Proposal {proposal.round} of 3 — {proposalTypeLabel(proposal.proposal_type)}
        </span>
        {proposal.response && (
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: responseColors[proposal.response] }}>
            {proposal.response}
          </span>
        )}
        {!proposal.response && index === total - 1 && (
          <span style={{ fontSize: '10px', color: '#cc9900', fontWeight: 'bold' }}>AWAITING RESPONSE</span>
        )}
      </div>
      <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '6px', lineHeight: '1.5' }}>
        From {familyNames[proposal.proposed_by_family] ?? proposal.proposed_by_family}: "{proposal.terms_text}"
      </div>
      {/* Clauses */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {proposal.clauses.duration_hours && (
          <span className="badge-gray" style={{ fontSize: '9px' }}>
            Duration: {proposal.clauses.duration_hours}h
          </span>
        )}
        {proposal.clauses.tribute_amount && (
          <span className="badge-red" style={{ fontSize: '9px' }}>
            Tribute: ${proposal.clauses.tribute_amount.toLocaleString()}
          </span>
        )}
        {proposal.clauses.joint_jobs_enabled && (
          <span className="badge-green" style={{ fontSize: '9px' }}>Joint Ops enabled</span>
        )}
      </div>
      {proposal.responded_at && (
        <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>
          Responded at {new Date(proposal.responded_at).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Counter-proposal form
// ─────────────────────────────────────────────

function CounterForm({ onSubmit, onCancel, proposalType }: {
  onSubmit: (terms: string, clauses: SitdownProposal['clauses']) => void;
  onCancel: () => void;
  proposalType: SitdownProposalType;
}) {
  const [terms, setTerms] = useState('');
  const [duration, setDuration] = useState('');
  const [tribute, setTribute] = useState('');
  const [jointOps, setJointOps] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clauses: SitdownProposal['clauses'] = {};
    if (duration) clauses.duration_hours = parseInt(duration);
    if (tribute)  clauses.tribute_amount = parseInt(tribute);
    if (jointOps) clauses.joint_jobs_enabled = true;
    onSubmit(terms, clauses);
  }

  return (
    <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '14px', marginTop: '10px' }}>
      <p style={{ fontSize: '10px', color: '#5580bb', fontWeight: 'bold', marginBottom: '10px' }}>
        Counter-Proposal — {proposalTypeLabel(proposalType)}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Terms</label>
          <textarea
            value={terms}
            onChange={e => setTerms(e.target.value)}
            rows={2}
            className="game-input"
            style={{ width: '100%', resize: 'none' }}
            placeholder="Describe your counter-terms..."
            required
            data-testid="counter-terms-input"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div className="form-group">
            <label>Duration (hours)</label>
            <input
              type="number" value={duration} onChange={e => setDuration(e.target.value)}
              className="game-input" placeholder="72" min={0}
              data-testid="counter-duration-input"
            />
          </div>
          <div className="form-group">
            <label>Tribute ($)</label>
            <input
              type="number" value={tribute} onChange={e => setTribute(e.target.value)}
              className="game-input" placeholder="0" min={0}
              data-testid="counter-tribute-input"
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '10px', color: '#aaa' }}>
          <input
            type="checkbox" checked={jointOps} onChange={e => setJointOps(e.target.checked)}
            style={{ accentColor: '#ffcc33' }} id="joint-ops"
            data-testid="counter-joint-ops-checkbox"
          />
          <label htmlFor="joint-ops" style={{ textTransform: 'none', fontSize: '10px', color: '#aaa', letterSpacing: 0 }}>
            Enable joint operations
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '7px' }}
            data-testid="submit-counter">
            Send Counter-Proposal
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost" style={{ padding: '7px 12px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Participants panel
// ─────────────────────────────────────────────

function ParticipantsPanel({ sitdown }: { sitdown: Sitdown }) {
  const roleColors: Record<string, string> = {
    DON: '#ffcc33', CONSIGLIERE: '#9955cc', UNDERBOSS: '#5580bb',
  };

  return (
    <SectionPanel title="Participants">
      {(['fam-1', 'fam-2'] as const).map(fid => {
        const famId = fid === 'fam-1' ? sitdown.family_a_id : sitdown.family_b_id;
        const famParticipants = sitdown.participants.filter(p => p.family_id === famId);
        const hasDon = famParticipants.some(p => p.role === 'DON');
        return (
          <div key={famId} style={{ padding: '8px 10px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
              {FAMILY_NAMES[famId] ?? famId}
              {!hasDon && (
                <span style={{ marginLeft: '8px', color: '#cc9900' }}>
                  · Don not yet present
                </span>
              )}
            </div>
            {famParticipants.length > 0 ? (
              famParticipants.map(p => (
                <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', color: roleColors[p.role] ?? '#888',
                    border: `1px solid ${roleColors[p.role] ?? '#888'}33`, padding: '1px 5px' }}>
                    {p.role}
                  </span>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{p.player_id}</span>
                  {p.joined_at && (
                    <span style={{ fontSize: '9px', color: '#444', marginLeft: 'auto' }}>
                      {new Date(p.joined_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '9px', color: '#555' }}>No one present yet</span>
            )}
          </div>
        );
      })}
    </SectionPanel>
  );
}

// ─────────────────────────────────────────────
// Sitdown selector (dev testing)
// ─────────────────────────────────────────────

function SitdownSelector({ current, onChange }: {
  current: string; onChange: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#0d1020', border: '1px solid #1e2840', fontSize: '10px' }}>
      <span style={{ color: '#5580bb', marginRight: '8px' }}>DEV: Load Sitdown</span>
      <select
        value={current}
        onChange={e => onChange(e.target.value)}
        style={{ background: '#111', border: '1px solid #2a3a5a', color: '#e0e0e0', fontSize: '10px', padding: '2px 6px' }}
        data-testid="dev-sitdown-selector"
      >
        {MOCK_SITDOWNS.map(s => (
          <option key={s.id} value={s.id}>
            {s.id} — {FAMILY_NAMES[s.family_a_id]} vs {FAMILY_NAMES[s.family_b_id]} [{s.state}]
          </option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Sitdown page
// ─────────────────────────────────────────────

export default function SitdownPage() {
  const { player, gameRole } = useGame();
  const [, nav] = useLocation();

  // State
  const [sitdownId, setSitdownId] = useState(MOCK_SITDOWNS[0].id);
  const [sitdown, setSitdown] = useState<Sitdown>(MOCK_SITDOWNS[0]);
  const [showCounter, setShowCounter] = useState(false);
  const [devSkip, setDevSkip] = useState(false);
  const [snubEffects, setSnubEffects] = useState<ReturnType<typeof computeSnubEffects>>([]);
  const [resolution, setResolution] = useState<string | null>(null);

  // Derived
  const myFamilyId = player.family_id ?? FAM_CORRADO;
  const isDon = gameRole === 'BOSS';
  const isLeadership = ['BOSS', 'UNDERBOSS', 'CONSIGLIERE'].includes(gameRole);
  const amIFamilyA = myFamilyId === sitdown.family_a_id;
  const myFamily = amIFamilyA ? sitdown.family_a_id : sitdown.family_b_id;
  const otherFamId = amIFamilyA ? sitdown.family_b_id : sitdown.family_a_id;

  const lastProposal = sitdown.proposals[sitdown.proposals.length - 1] ?? null;
  const awaitingMyResponse = lastProposal?.response === null &&
    lastProposal.proposed_by_family !== myFamilyId;
  const canRespond = isDon && sitdown.state === 'ACTIVE' && awaitingMyResponse;
  const canCounter = canRespond && sitdown.proposals.length < 3;
  const isSessionLive = sitdown.state === 'ACTIVE' || devSkip;

  const timeLeft = useCountdown(
    isSessionLive ? (devSkip ? null : sitdown.session_expires_at) : null,
    devSkip,
  );

  // Load sitdown from selector
  function handleLoadSitdown(id: string) {
    const s = MOCK_SITDOWNS.find(x => x.id === id);
    if (s) { setSitdown(s); setSitdownId(id); setResolution(null); setSnubEffects([]); }
  }

  // Accept
  function handleAccept() {
    const updated = acceptSitdownProposal(sitdown, myFamilyId);
    setSitdown(updated);
    setResolution(`Agreement reached on proposal ${updated.agreed_proposal_round}. Diplomatic state will update.`);
  }

  // Decline
  function handleDecline() {
    const updated = declineSitdownProposal(sitdown, myFamilyId);
    setSitdown(updated);
    setResolution('Proposal declined. No state change. Sitdown closed.');
  }

  // Counter
  function handleCounter(terms: string, clauses: SitdownProposal['clauses']) {
    if (!lastProposal) return;
    const updated = counterSitdownProposal(sitdown, myFamilyId, {
      proposal_type: lastProposal.proposal_type,
      terms_text: terms,
      clauses,
    });
    if (!updated) return;
    setSitdown(updated);
    setShowCounter(false);
  }

  // Force snub (dev)
  function handleForceSnub() {
    const snubbed = markSitdownSnubbed(sitdown);
    const effects = computeSnubEffects(snubbed);
    setSitdown(snubbed);
    setSnubEffects(effects);
    setResolution('Sitdown SNUBBED. Debuffs applied.');
  }

  return (
    <div>
      <PageHeader
        title="Sitdown"
        sub="Diplomatic meeting between family leadership."
        action={
          <button
            onClick={() => nav('/diplomacy')}
            className="btn btn-ghost"
            style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={12} /> Diplomacy
          </button>
        }
      />

      {/* ── DEV controls ─────────────────────── */}
      <SitdownSelector current={sitdownId} onChange={handleLoadSitdown} />
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setDevSkip(!devSkip)}
          className="btn btn-ghost"
          style={{ fontSize: '9px', padding: '3px 10px', borderColor: '#1e2840', color: '#5580bb' }}
          data-testid="dev-skip-timer"
        >
          {devSkip ? '▶ Timers active' : '⚡ DEV: Skip timers'}
        </button>
        {sitdown.state === 'ACTIVE' && (
          <button
            onClick={handleForceSnub}
            className="btn btn-ghost"
            style={{ fontSize: '9px', padding: '3px 10px', borderColor: '#4a1010', color: '#cc3333' }}
            data-testid="dev-force-snub"
          >
            DEV: Force Snub
          </button>
        )}
      </div>

      {/* Sitdown header */}
      <div className="panel" style={{ marginBottom: '10px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#e0e0e0', marginBottom: '4px' }}>
              {FAMILY_NAMES[sitdown.family_a_id]} ↔ {FAMILY_NAMES[sitdown.family_b_id]}
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              Regarding: <strong style={{ color: '#ffcc33' }}>{proposalTypeLabel(sitdown.proposal_type)}</strong>
            </div>
          </div>
          <SitdownStateChip state={sitdown.state} />
        </div>

        {/* Timer bar */}
        {(sitdown.state === 'ACTIVE' || devSkip) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#111', border: '1px solid #2a2a2a', padding: '6px 10px',
          }}>
            <Timer size={12} style={{ color: '#cc9900' }} />
            <span style={{ fontSize: '10px', color: '#888' }}>Session time remaining:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffcc33', fontVariantNumeric: 'tabular-nums' }}>
              {timeLeft}
            </span>
            {!devSkip && sitdown.session_expires_at && (
              <span style={{ fontSize: '9px', color: '#444', marginLeft: 'auto' }}>
                Proposal {sitdown.proposals.length}/3
              </span>
            )}
          </div>
        )}

        {/* Invite timer for PENDING */}
        {sitdown.state === 'PENDING' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#1a1500', border: '1px solid #3a3000', padding: '6px 10px',
          }}>
            <Clock size={12} style={{ color: '#cc9900' }} />
            <span style={{ fontSize: '10px', color: '#cc9900' }}>
              Waiting for {FAMILY_NAMES[sitdown.family_b_id]} Don to accept.
              Expires {formatTimeRemaining(sitdown.invite_expires_at)}.
            </span>
          </div>
        )}
      </div>

      {/* Role notice for non-Don leadership */}
      {isLeadership && !isDon && (
        <InfoAlert>
          You can observe and advise, but only the Don can Accept, Decline, or Counter-propose.
        </InfoAlert>
      )}

      {/* Resolution banner */}
      {resolution && (
        <div style={{
          background: sitdown.state === 'AGREED' ? '#0a1a0a' : '#1a0808',
          border: `1px solid ${sitdown.state === 'AGREED' ? '#2a6a2a' : '#4a1010'}`,
          padding: '10px 14px', marginBottom: '12px', fontSize: '11px',
          color: sitdown.state === 'AGREED' ? '#4a9a4a' : '#cc3333',
        }}>
          {sitdown.state === 'AGREED' ? <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} /> : <XCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />}
          {resolution}
        </div>
      )}

      {/* Snub effects */}
      {snubEffects.length > 0 && (
        <div className="panel" style={{ marginBottom: '10px', overflow: 'hidden' }}>
          <div className="panel-header" style={{ background: '#1a0808', borderColor: '#4a1010' }}>
            <span style={{ color: '#cc3333', fontWeight: 'bold', fontSize: '11px' }}>
              ⚠ Snub Effects Applied
            </span>
          </div>
          {snubEffects.map(eff => (
            <div key={eff.id} style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', fontSize: '10px' }}>
              <div style={{ color: eff.effect_type.includes('BUFF') ? '#cc9900' : '#cc3333', fontWeight: 'bold', marginBottom: '3px' }}>
                {eff.effect_type.includes('BUFF') ? '↑ Buff' : '↓ Debuff'} → {FAMILY_NAMES[eff.family_id] ?? eff.family_id}
              </div>
              <div style={{ color: '#aaa' }}>{eff.description}</div>
              <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>
                Expires {formatTimeRemaining(eff.expires_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants */}
      <ParticipantsPanel sitdown={sitdown} />

      {/* Proposal history */}
      {sitdown.proposals.length > 0 && (
        <SectionPanel title={`Proposals (${sitdown.proposals.length}/3 rounds used)`}>
          <div style={{ padding: '10px 12px' }}>
            {sitdown.proposals.map((p, i) => (
              <ProposalRow
                key={p.round}
                proposal={p}
                index={i}
                total={sitdown.proposals.length}
                familyNames={FAMILY_NAMES}
              />
            ))}
          </div>
        </SectionPanel>
      )}

      {/* Empty state for PENDING or no proposals yet */}
      {sitdown.proposals.length === 0 && sitdown.state === 'ACTIVE' && (
        <div className="panel" style={{ padding: '20px', textAlign: 'center', marginBottom: '10px' }}>
          <p style={{ color: '#555', fontSize: '11px' }}>
            No proposals yet. The initiating Don should submit the first proposal.
          </p>
        </div>
      )}

      {/* Response actions — Don only, when awaiting response */}
      {canRespond && !showCounter && sitdown.state === 'ACTIVE' && (
        <div className="panel" style={{ padding: '14px', marginBottom: '10px' }}>
          <p className="label-caps" style={{ marginBottom: '10px' }}>
            Your Response to Proposal {lastProposal.round}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: canCounter ? '8px' : 0 }}>
            <button
              onClick={handleAccept}
              className="btn btn-success"
              style={{ flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              data-testid="accept-proposal"
            >
              <CheckCircle size={13} /> Accept Agreement
            </button>
            <button
              onClick={handleDecline}
              className="btn btn-danger"
              style={{ flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              data-testid="decline-proposal"
            >
              <XCircle size={13} /> Decline
            </button>
          </div>
          {canCounter && (
            <button
              onClick={() => setShowCounter(true)}
              className="btn btn-ghost"
              style={{ width: '100%', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              data-testid="counter-proposal"
            >
              <RefreshCw size={12} />
              Counter-Propose (Round {lastProposal.round + 1}/3)
            </button>
          )}
          {!canCounter && (
            <p style={{ fontSize: '9px', color: '#555', textAlign: 'center', marginTop: '4px' }}>
              All 3 proposal rounds used. Accept or Decline.
            </p>
          )}
        </div>
      )}

      {/* Counter-proposal form */}
      {showCounter && (
        <CounterForm
          proposalType={lastProposal?.proposal_type ?? 'NAP'}
          onSubmit={handleCounter}
          onCancel={() => setShowCounter(false)}
        />
      )}

      {/* Snubbed state display */}
      {sitdown.state === 'SNUBBED' && (
        <InfoAlert variant="danger">
          <AlertTriangle size={12} style={{ display: 'inline', marginRight: '6px' }} />
          <strong>Snubbed by {FAMILY_NAMES[sitdown.snubbed_by_family!] ?? sitdown.snubbed_by_family}.</strong>
          &nbsp;Debuffs have been applied automatically. Political tags updated.
        </InfoAlert>
      )}

      {/* Agreed state — show resulting political shift */}
      {sitdown.state === 'AGREED' && (
        <div className="panel" style={{ padding: '14px', background: '#0a1a0a', border: '1px solid #2a6a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Handshake size={16} style={{ color: '#4a9a4a' }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a9a4a' }}>Deal Agreed</span>
          </div>
          <p style={{ fontSize: '10px', color: '#aaa' }}>
            Proposal {sitdown.agreed_proposal_round} was accepted. Diplomatic state will be updated to reflect the terms.
            Both families' political tags will be updated accordingly.
          </p>
        </div>
      )}
    </div>
  );
}
