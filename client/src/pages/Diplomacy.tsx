/**
 * Diplomacy.tsx — Inter-family diplomatic relations screen.
 *
 * Leadership roles: can initiate state transitions and Sitdowns.
 * Non-leadership members: read-only view.
 *
 * Shows:
 *   - All relations for the player's family
 *   - Current state with cooldown timers and influence costs
 *   - Available actions: Propose NAP, Propose Alliance, Offer Peace, Declare War, etc.
 *   - Political tags per opposing family
 *   - Active status effects
 *   - "Request Sitdown" button → navigates to Sitdown screen
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { useLocation } from 'wouter';
import { can } from '../lib/permissions';
import { MOCK_RELATIONS, MOCK_POLITICAL_TAGS, MOCK_STATUS_EFFECTS } from '../lib/diplomacyMockData';
import {
  getRelationsForFamily, otherFamily, canTransitionState,
  formatTimeRemaining, diplomaticStateColor, diplomaticStateLabel,
  proposalTypeLabel, computePoliticalTags,
} from '../lib/diplomacyEngine';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import type { DiplomaticRelation, DiplomaticState, SitdownProposalType } from '../../../shared/diplomacy';
import { VALID_TRANSITIONS, TRANSITION_INFLUENCE_COST } from '../../../shared/diplomacy';
import { Shield, Swords, Handshake, Clock, ChevronRight, AlertTriangle, Info } from 'lucide-react';

// ─── Mock family names lookup ────────────────
const FAMILY_NAMES: Record<string, string> = {
  'fam-1': 'The Corrado Family',
  'fam-2': 'The Ferrante Crew',
  'fam-3': 'West Side Outfit',
  'fam-4': 'The Rizzo Outfit',
};

// ─── Political tag badge ──────────────────────
function PoliticalTagBadge({ familyId }: { familyId: string }) {
  const tags = MOCK_POLITICAL_TAGS[familyId] ?? computePoliticalTags(familyId);
  const [showTip, setShowTip] = useState<string | null>(null);

  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
      {tags.map(tag => (
        <span
          key={tag.id}
          title={tag.description}
          onClick={() => setShowTip(showTip === tag.id ? null : tag.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 6px', border: '1px solid',
            cursor: 'pointer',
            color: tag.is_negative ? '#cc3333' : '#4a9a4a',
            borderColor: tag.is_negative ? '#3a1010' : '#1a3a1a',
            background: tag.is_negative ? '#1a0808' : '#0a1a0a',
          }}
          data-testid={`political-tag-${tag.id}-${familyId}`}
        >
          {tag.is_negative ? <AlertTriangle size={9} /> : <Shield size={9} />}
          {tag.label}
          {tag.expires_at && (
            <span style={{ color: '#666' }}>· {formatTimeRemaining(tag.expires_at)}</span>
          )}
        </span>
      ))}
      {/* Inline tooltip */}
      {showTip && (() => {
        const tag = tags.find(t => t.id === showTip);
        if (!tag) return null;
        return (
          <div style={{
            width: '100%', background: '#181818', border: '1px solid #2a2a2a',
            padding: '6px 10px', fontSize: '10px', color: '#aaa', lineHeight: '1.5',
          }}>
            {tag.description}
            {tag.expires_at && (
              <span style={{ color: '#555', marginLeft: '6px' }}>
                Expires in {formatTimeRemaining(tag.expires_at)}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── State badge ──────────────────────────────
function StateBadge({ state }: { state: DiplomaticState }) {
  const color = diplomaticStateColor(state);
  const icons: Record<DiplomaticState, React.ReactNode> = {
    ALLIED:  <Handshake size={11} />,
    NAP:     <Shield size={11} />,
    AT_WAR:  <Swords size={11} />,
    NEUTRAL: <span style={{ fontSize: '10px' }}>○</span>,
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '10px', fontWeight: 'bold', color,
      border: `1px solid ${color}22`, background: `${color}11`,
      padding: '2px 8px',
    }}>
      {icons[state]}
      {diplomaticStateLabel(state)}
    </span>
  );
}

// ─── Available actions for a relation ────────
interface ActionDef {
  to: DiplomaticState;
  proposalType: SitdownProposalType;
  label: string;
  dangerous?: boolean;
}

function getAvailableActions(state: DiplomaticState): ActionDef[] {
  const map: Record<DiplomaticState, ActionDef[]> = {
    NEUTRAL: [
      { to: 'NAP',     proposalType: 'NAP',  label: 'Propose Non-Aggression Pact' },
      { to: 'AT_WAR',  proposalType: 'WAR',  label: 'Declare War', dangerous: true },
    ],
    NAP: [
      { to: 'ALLIED',  proposalType: 'ALLIANCE',  label: 'Propose Alliance' },
      { to: 'NEUTRAL', proposalType: 'BREAK_NAP', label: 'Dissolve NAP', dangerous: true },
    ],
    ALLIED: [
      { to: 'NAP',     proposalType: 'BREAK_ALLIANCE', label: 'Break Alliance to NAP', dangerous: true },
    ],
    AT_WAR: [
      { to: 'NEUTRAL', proposalType: 'PEACE', label: 'Offer Peace (→ Neutral)' },
      { to: 'NAP',     proposalType: 'PEACE', label: 'Offer Peace (→ NAP)' },
    ],
  };
  return map[state] ?? [];
}

// ─── Relation card ───────────────────────────
function RelationCard({ rel, myFamilyId, canAct, onInitiateSitdown }: {
  rel: DiplomaticRelation;
  myFamilyId: string;
  canAct: boolean;
  onInitiateSitdown: (rel: DiplomaticRelation, proposalType: SitdownProposalType, to: DiplomaticState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [devSkip, setDevSkip] = useState(false);

  const targetId = otherFamily(rel, myFamilyId);
  const targetName = FAMILY_NAMES[targetId] ?? targetId;
  const actions = getAvailableActions(rel.state);

  // Mock family influence (would come from real state)
  const MOCK_INFLUENCE = 300;

  const canChange = new Date(rel.next_change_allowed_at).getTime() <= Date.now() || devSkip;
  const cooldownRemaining = formatTimeRemaining(rel.next_change_allowed_at);

  // Active effects on this relation
  const relEffects = MOCK_STATUS_EFFECTS.filter(e =>
    (e.family_id === myFamilyId && e.target_family_id === targetId) ||
    (e.family_id === targetId && e.target_family_id === myFamilyId)
  );

  return (
    <div
      className="panel"
      style={{ marginBottom: '8px', overflow: 'hidden' }}
      data-testid={`relation-card-${targetId}`}
    >
      {/* Header */}
      <div
        className="panel-header"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>
              {targetName}
            </span>
            <StateBadge state={rel.state} />
          </div>
          <PoliticalTagBadge familyId={targetId} />
        </div>
        <ChevronRight
          size={14}
          style={{
            color: '#555',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </div>

      {expanded && (
        <div style={{ padding: '12px' }}>

          {/* State info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {[
              ['Since', new Date(rel.state_changed_at).toLocaleDateString()],
              ['Influence Spent', rel.influence_spent.toLocaleString()],
              ['Next Change', canChange ? 'Available now' : `In ${cooldownRemaining}`],
              ['Your Influence', MOCK_INFLUENCE.toLocaleString()],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ background: '#111', border: '1px solid #2a2a2a', padding: '6px 8px' }}>
                <div className="label-caps">{l}</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Active effects on this relationship */}
          {relEffects.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p className="label-caps" style={{ marginBottom: '6px' }}>Active Effects</p>
              {relEffects.map(eff => (
                <div key={eff.id} style={{
                  background: '#1a0808', border: '1px solid #3a1010',
                  padding: '6px 10px', marginBottom: '4px', fontSize: '10px', color: '#cc7700',
                }}>
                  {eff.description}
                  <span style={{ color: '#555', marginLeft: '8px' }}>
                    Expires {formatTimeRemaining(eff.expires_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Cooldown notice */}
          {!canChange && !devSkip && (
            <div className="alert-info" style={{
              background: '#0d1020', border: '1px solid #1e2840',
              padding: '7px 10px', marginBottom: '10px', fontSize: '10px', color: '#5580bb',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Clock size={12} />
              Diplomatic cooldown — next change available in {cooldownRemaining}.
              <button
                onClick={() => setDevSkip(true)}
                style={{ marginLeft: 'auto', fontSize: '9px', background: 'none', border: '1px solid #2a3a5a', color: '#5580bb', cursor: 'pointer', padding: '2px 6px' }}
                data-testid={`dev-skip-cooldown-${targetId}`}
              >
                DEV: Skip
              </button>
            </div>
          )}

          {/* Action buttons */}
          {canAct && (
            <div>
              <p className="label-caps" style={{ marginBottom: '8px' }}>
                Available Actions {!canChange && !devSkip ? '(cooldown active)' : ''}
              </p>
              {actions.map(action => {
                const cost = TRANSITION_INFLUENCE_COST[`${rel.state}→${action.to}`] ?? 0;
                const canAfford = MOCK_INFLUENCE >= cost;
                const check = canTransitionState(rel, rel.state, action.to, MOCK_INFLUENCE, { devFastForward: devSkip });
                return (
                  <button
                    key={action.label}
                    onClick={() => onInitiateSitdown(rel, action.proposalType, action.to)}
                    disabled={!check.allowed}
                    data-testid={`action-${action.proposalType}-${targetId}`}
                    style={{
                      width: '100%', marginBottom: '6px',
                      padding: '8px 12px', textAlign: 'left',
                      background: action.dangerous ? '#1a0808' : '#181818',
                      border: `1px solid ${action.dangerous ? '#4a1010' : '#2a2a2a'}`,
                      color: check.allowed
                        ? (action.dangerous ? '#cc3333' : '#e0e0e0')
                        : '#444',
                      cursor: check.allowed ? 'pointer' : 'not-allowed',
                      fontFamily: 'Verdana, sans-serif',
                      fontSize: '11px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>{action.label}</span>
                    <span style={{ fontSize: '10px', color: canAfford ? '#ffcc33' : '#cc3333' }}>
                      {cost} Influence
                      {!check.allowed && check.reason && (
                        <span style={{ color: '#555', marginLeft: '6px', fontSize: '9px' }}>
                          ({check.reason})
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!canAct && (
            <p style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>
              Only Don, Consigliere, or Underboss can initiate diplomatic actions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Status effects summary ───────────────────
function StatusEffectsPanel({ myFamilyId }: { myFamilyId: string }) {
  const now = Date.now();
  const active = MOCK_STATUS_EFFECTS.filter(e =>
    e.family_id === myFamilyId && new Date(e.expires_at).getTime() > now
  );
  const buffs = MOCK_STATUS_EFFECTS.filter(e =>
    e.target_family_id !== null && e.family_id === myFamilyId && new Date(e.expires_at).getTime() > now
  );

  if (active.length === 0 && buffs.length === 0) return null;

  return (
    <SectionPanel title="Active Effects on Your Family">
      {[...active, ...buffs].map(eff => {
        const isDebuff = eff.effect_type.includes('DEBUFF');
        return (
          <div key={eff.id} style={{
            padding: '8px 10px', borderBottom: '1px solid #1a1a1a', fontSize: '10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: isDebuff ? '#cc3333' : '#4a9a4a', fontWeight: 'bold', marginBottom: '2px' }}>
                {isDebuff ? '↓ Debuff' : '↑ Buff'}
                {eff.target_family_id && (
                  <span style={{ color: '#888', marginLeft: '6px', fontSize: '9px' }}>
                    vs {FAMILY_NAMES[eff.target_family_id] ?? eff.target_family_id}
                  </span>
                )}
              </div>
              <div style={{ color: '#aaa' }}>{eff.description}</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                {Object.entries(eff.modifiers).map(([key, val]) => (
                  <span key={key} style={{
                    fontSize: '9px', color: (val as number) < 0 ? '#cc3333' : '#4a9a4a',
                    background: '#151515', padding: '1px 6px', border: '1px solid #2a2a2a',
                  }}>
                    {key.replace(/_/g, ' ')}: {(val as number) > 0 ? '+' : ''}{Math.round((val as number) * 100)}%
                  </span>
                ))}
              </div>
            </div>
            <span style={{ fontSize: '9px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
              {formatTimeRemaining(eff.expires_at)}
            </span>
          </div>
        );
      })}
    </SectionPanel>
  );
}

// ─── Main Diplomacy page ─────────────────────
export default function DiplomacyPage() {
  const { player, gameRole } = useGame();
  const [, nav] = useLocation();

  const myFamilyId = player.family_id ?? 'fam-1';
  const canAct = ['BOSS', 'UNDERBOSS', 'CONSIGLIERE'].includes(gameRole);

  const relations = getRelationsForFamily(myFamilyId);

  // Group by state
  const allied  = relations.filter(r => r.state === 'ALLIED');
  const nap     = relations.filter(r => r.state === 'NAP');
  const war     = relations.filter(r => r.state === 'AT_WAR');
  const neutral = relations.filter(r => r.state === 'NEUTRAL');

  function handleInitiateSitdown(
    rel: DiplomaticRelation,
    proposalType: SitdownProposalType,
    to: DiplomaticState,
  ) {
    const targetId = otherFamily(rel, myFamilyId);
    nav(`/sitdown?family=${targetId}&proposal=${proposalType}&to=${to}`);
  }

  return (
    <div>
      <PageHeader
        title="Diplomacy"
        sub={`${FAMILY_NAMES[myFamilyId] ?? 'Your Family'} — Political relations with all families.`}
      />

      {!player.family_id && (
        <InfoAlert variant="warn">
          You must be a member of a family to access Diplomacy.
        </InfoAlert>
      )}

      {!canAct && player.family_id && (
        <InfoAlert>
          Read-only view. Only Don, Consigliere, and Underboss can initiate diplomatic actions.
        </InfoAlert>
      )}

      {/* Active status effects on MY family */}
      <StatusEffectsPanel myFamilyId={myFamilyId} />

      {/* Relation sections */}
      {war.length > 0 && (
        <>
          <div className="section-title" style={{ color: '#cc3333' }}>
            ⚔ At War ({war.length})
          </div>
          {war.map(r => (
            <RelationCard
              key={r.id} rel={r} myFamilyId={myFamilyId}
              canAct={canAct} onInitiateSitdown={handleInitiateSitdown}
            />
          ))}
        </>
      )}

      {allied.length > 0 && (
        <>
          <div className="section-title" style={{ color: '#4a9a4a' }}>
            ◆ Allied ({allied.length})
          </div>
          {allied.map(r => (
            <RelationCard
              key={r.id} rel={r} myFamilyId={myFamilyId}
              canAct={canAct} onInitiateSitdown={handleInitiateSitdown}
            />
          ))}
        </>
      )}

      {nap.length > 0 && (
        <>
          <div className="section-title" style={{ color: '#5580bb' }}>
            ◇ Non-Aggression Pact ({nap.length})
          </div>
          {nap.map(r => (
            <RelationCard
              key={r.id} rel={r} myFamilyId={myFamilyId}
              canAct={canAct} onInitiateSitdown={handleInitiateSitdown}
            />
          ))}
        </>
      )}

      {neutral.length > 0 && (
        <>
          <div className="section-title">
            Neutral ({neutral.length})
          </div>
          {neutral.map(r => (
            <RelationCard
              key={r.id} rel={r} myFamilyId={myFamilyId}
              canAct={canAct} onInitiateSitdown={handleInitiateSitdown}
            />
          ))}
        </>
      )}

      {relations.length === 0 && (
        <div className="panel" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: '#555', fontSize: '11px' }}>
            No recorded relations. Approach other families via the Families Directory.
          </p>
        </div>
      )}
    </div>
  );
}
