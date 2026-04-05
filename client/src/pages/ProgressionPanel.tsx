/**
 * ProgressionPanel — rank progression, contribution scores, promotion eligibility.
 * Route: /progression
 */

import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import { useGame } from '../lib/gameContext';
import { MOCK_CONTRIBUTION_SCORES, MOCK_PROMOTION_HISTORY } from '../lib/opsData';
import { PROMOTION_THRESHOLDS, WORLD_ACTION_PERMISSIONS, checkPromotionEligibility, canPerformAction } from '../../../shared/ops';
import type { WorldAction } from '../../../shared/ops';
import { fmt } from '../lib/mockData';
import { RoleBadge } from '../components/ui/Badges';

// ─────────────────────────────────────────────
// Rank hierarchy definition
// ─────────────────────────────────────────────

const RANK_HIERARCHY = [
  { rank: 'RECRUIT',     label: 'Recruit',      color: '#555',   desc: 'Probationary member. Limited to starter missions.' },
  { rank: 'ASSOCIATE',   label: 'Associate',    color: '#888',   desc: 'Full junior member. Normal jobs, treasury deposits.' },
  { rank: 'SOLDIER',     label: 'Soldier',      color: '#4a9a4a', desc: 'Proven earner. Basic PvP actions unlocked.' },
  { rank: 'CAPO',        label: 'Capo',         color: '#5580bb', desc: 'Crew commander. Can recruit, promote, and manage operations.' },
  { rank: 'CONSIGLIERE', label: 'Consigliere',  color: '#818cf8', desc: 'Advisor and diplomat. Handles sensitive negotiations.' },
  { rank: 'UNDERBOSS',   label: 'Underboss',    color: '#cc9900', desc: 'Second in command. Full operational authority.' },
  { rank: 'BOSS',        label: 'Boss (Don)',   color: '#cc3333', desc: 'The Don. Absolute authority over all family decisions.' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getNextRank(currentRank: string | null): string | null {
  const order = ['RECRUIT', 'ASSOCIATE', 'SOLDIER', 'CAPO', 'UNDERBOSS'];
  if (!currentRank) return 'ASSOCIATE';
  const idx = order.indexOf(currentRank);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function progressPercent(current: number, required: number): number {
  return Math.min(100, Math.round((current / required) * 100));
}

// ─────────────────────────────────────────────
// Progress bar component
// ─────────────────────────────────────────────

function ProgressBar({ pct, color = '#cc3333' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: pct >= 100 ? '#4a9a4a' : color,
        transition: 'width 0.3s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Requirement row
// ─────────────────────────────────────────────

function RequirementRow({
  label,
  current,
  required,
  isMoney = false,
}: {
  label: string;
  current: number;
  required: number;
  isMoney?: boolean;
}) {
  const met = current >= required;
  const pct = progressPercent(current, required);
  const currentDisplay = isMoney ? fmt(current) : current.toLocaleString();
  const requiredDisplay = isMoney ? fmt(required) : required.toLocaleString();

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>{label}</span>
          {met ? (
            <span style={{ fontSize: '8px', color: '#4a9a4a', fontWeight: 'bold' }}>✓ Met</span>
          ) : (
            <span style={{ fontSize: '8px', color: '#cc9900' }}>⚠ Needed</span>
          )}
        </div>
        <span style={{ fontSize: '9px', color: met ? '#4a9a4a' : '#888' }}>
          {currentDisplay} / {requiredDisplay}
        </span>
      </div>
      <ProgressBar pct={pct} color={met ? '#4a9a4a' : '#cc9900'} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Action list grouped by what the player can do
// ─────────────────────────────────────────────

const ACTION_GROUPS: { label: string; actions: WorldAction[] }[] = [
  {
    label: 'Treasury',
    actions: ['DEPOSIT_TREASURY', 'VIEW_TREASURY', 'WITHDRAW_TREASURY', 'APPROVE_TREASURY_SPEND'],
  },
  {
    label: 'Family Board',
    actions: ['POST_FAMILY_BOARD', 'SEND_CHAIN_MESSAGE', 'ESCALATE_MESSAGE', 'PIN_ANNOUNCEMENT'],
  },
  {
    label: 'Recruitment',
    actions: ['APPLY_TO_FAMILY', 'INVITE_PLAYER', 'APPROVE_APPLICANT', 'REJECT_APPLICANT'],
  },
  {
    label: 'Promotions',
    actions: ['PROMOTE_TO_ASSOCIATE', 'PROMOTE_TO_SOLDIER', 'PROMOTE_TO_CAPO', 'DEMOTE_MEMBER', 'KICK_MEMBER'],
  },
  {
    label: 'Business & Turf',
    actions: ['VIEW_TURF_INCOME', 'PURCHASE_TURF', 'UPGRADE_FRONT', 'PLACE_FRONT_ON_TURF'],
  },
  {
    label: 'Diplomacy',
    actions: ['VIEW_DISTRICT_INFLUENCE', 'PROPOSE_DIPLOMACY', 'PROPOSE_PEACE', 'DECLARE_WAR'],
  },
  {
    label: 'Protection',
    actions: ['TRIGGER_WITNESS_PROTECTION'],
  },
];

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function ProgressionPanel() {
  const { player } = useGame();
  const familyRole = player.family_role ?? null;
  const contribution = MOCK_CONTRIBUTION_SCORES.find(s => s.playerId === player.id);
  const nextRank = getNextRank(familyRole);
  const threshold = nextRank ? PROMOTION_THRESHOLDS[nextRank] : null;

  const eligibility = contribution && nextRank
    ? checkPromotionEligibility(nextRank, contribution)
    : null;

  const promotionHistory = MOCK_PROMOTION_HISTORY
    .filter(p => p.playerId === player.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div>
      <PageHeader
        title="Rank Progression"
        sub={`${player.alias} · ${player.archetype}`}
      />

      {/* Current rank display */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px', background: '#111', border: '1px solid #1a1a1a',
        marginBottom: '12px',
      }}>
        <div style={{ flexShrink: 0 }}>
          {player.family_role ? <RoleBadge role={player.family_role} /> : (
            <span style={{ fontSize: '10px', color: '#555' }}>No rank</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888' }}>Current Rank</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#e0e0e0' }}>
            {player.family_role ?? 'Unaffiliated'}
          </div>
          <div style={{ fontSize: '9px', color: '#444', marginTop: '2px' }}>
            {RANK_HIERARCHY.find(r => r.rank === player.family_role)?.desc ?? 'Join a family to begin your ascent.'}
          </div>
        </div>
      </div>

      {/* Contribution score */}
      {contribution ? (
        <SectionPanel title="Contribution Score">
          <div className="ml-grid-4" style={{ padding: '10px' }}>
            <div>
              <div className="label-caps">Jobs</div>
              <div className="stat-val">{contribution.jobsCompleted}</div>
            </div>
            <div>
              <div className="label-caps">Missions</div>
              <div className="stat-val">{contribution.missionsCompleted}</div>
            </div>
            <div>
              <div className="label-caps">Money Earned</div>
              <div className="stat-val text-cash">{fmt(contribution.moneyEarned)}</div>
            </div>
            <div>
              <div className="label-caps">Loyalty Days</div>
              <div className="stat-val">{contribution.loyaltyDays}</div>
            </div>
          </div>
          <div style={{ padding: '0 10px 10px', display: 'flex', gap: '20px' }}>
            <div>
              <div className="label-caps">Business Jobs</div>
              <div style={{ fontSize: '12px', color: '#5580bb', fontWeight: 'bold' }}>
                {contribution.businessJobsCompleted}
              </div>
            </div>
            <div>
              <div className="label-caps">Passive Income Generated</div>
              <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: 'bold' }}>
                {fmt(contribution.passiveIncomeGenerated)}
              </div>
            </div>
          </div>
        </SectionPanel>
      ) : (
        <div style={{ padding: '10px', color: '#444', fontSize: '10px' }}>
          No contribution data for this player.
        </div>
      )}

      {/* Promotion eligibility */}
      {nextRank && threshold && contribution ? (
        <SectionPanel
          title={`Eligibility: ${nextRank}`}
          right={
            <span style={{ fontSize: '9px', color: eligibility?.eligible ? '#4a9a4a' : '#cc9900' }}>
              {eligibility?.eligible ? 'ELIGIBLE' : 'REQUIREMENTS PENDING'}
            </span>
          }
        >
          <div style={{ padding: '10px' }}>
            <RequirementRow
              label="Jobs Completed"
              current={contribution.jobsCompleted}
              required={threshold.minJobsCompleted}
            />
            <RequirementRow
              label="Money Earned"
              current={contribution.moneyEarned}
              required={threshold.minMoneyEarned}
              isMoney
            />
            <RequirementRow
              label="Missions Completed"
              current={contribution.missionsCompleted}
              required={threshold.minMissionsCompleted}
            />
            <RequirementRow
              label="Loyalty Days"
              current={contribution.loyaltyDays}
              required={threshold.minLoyaltyDays}
            />

            {threshold.requiresLeadershipApproval && (
              <div style={{
                marginTop: '10px', padding: '8px',
                background: '#0a0a1a', border: '1px solid #333',
                fontSize: '9px', color: '#5580bb',
              }}>
                Leadership appointment required. Thresholds gate eligibility, but promotion to {nextRank} requires Boss or Underboss to formally appoint you.
              </div>
            )}

            {threshold.notes && (
              <div style={{ marginTop: '8px', fontSize: '9px', color: '#333', fontStyle: 'italic' }}>
                {threshold.notes}
              </div>
            )}
          </div>
        </SectionPanel>
      ) : nextRank === null ? (
        <div style={{ padding: '10px', color: '#444', fontSize: '10px' }}>
          You are at the highest achievable rank.
        </div>
      ) : null}

      {/* Promotion history */}
      {promotionHistory.length > 0 && (
        <SectionPanel title="Promotion History">
          <div style={{ padding: '10px' }}>
            {promotionHistory.map(p => (
              <div key={p.id} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                paddingBottom: '10px', marginBottom: '10px',
                borderBottom: '1px solid #1a1a1a',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#cc3333', marginTop: '4px', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0', marginBottom: '2px' }}>
                    {p.fromRank} → {p.toRank}
                  </div>
                  <div style={{ fontSize: '9px', color: '#555', marginBottom: '3px' }}>{p.note}</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '8px', color: '#444' }}>
                    <span>{p.reason}</span>
                    <span>·</span>
                    <span>{relativeTime(p.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      )}

      {/* Full rank hierarchy */}
      <SectionPanel title="Rank Hierarchy">
        <div style={{ padding: '10px' }}>
          {RANK_HIERARCHY.map((r, i) => {
            const isCurrent = r.rank === (player.family_role ?? '');
            return (
              <div key={r.rank} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '8px',
                background: isCurrent ? '#1a0808' : 'transparent',
                border: isCurrent ? '1px solid #cc333344' : '1px solid transparent',
                marginBottom: '4px',
              }}>
                <div style={{
                  fontSize: '9px', color: '#333', width: '14px',
                  textAlign: 'right', flexShrink: 0, marginTop: '2px',
                }}>
                  {i + 1}
                </div>
                <div style={{
                  width: '3px', alignSelf: 'stretch', background: r.color,
                  borderRadius: '2px', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: r.color }}>
                      {r.label}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '8px', color: '#cc3333', fontWeight: 'bold' }}>← YOU</span>
                    )}
                  </div>
                  <div style={{ fontSize: '9px', color: '#555' }}>{r.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* Permissions — what I can do */}
      <SectionPanel title="Your Current Permissions">
        <div style={{ padding: '10px' }}>
          {ACTION_GROUPS.map(group => {
            const myActions = group.actions.filter(a => canPerformAction(familyRole, a));
            const lockedActions = group.actions.filter(a => !canPerformAction(familyRole, a));
            return (
              <div key={group.label} style={{ marginBottom: '12px' }}>
                <div className="label-caps" style={{ marginBottom: '6px' }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {myActions.map(a => (
                    <span key={a} style={{
                      fontSize: '8px', padding: '2px 6px',
                      background: '#0a1a0a', border: '1px solid #4a9a4a44',
                      color: '#4a9a4a',
                    }}>
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {lockedActions.map(a => {
                    const required = WORLD_ACTION_PERMISSIONS[a];
                    return (
                      <span key={a} style={{
                        fontSize: '8px', padding: '2px 6px',
                        background: '#111', border: '1px solid #1a1a1a',
                        color: '#333',
                      }}
                        title={`Requires: ${required}`}
                      >
                        {a.replace(/_/g, ' ')}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: '8px', color: '#333', marginTop: '8px' }}>
            Green = available. Dim = locked. Hover locked actions to see minimum rank.
          </div>
        </div>
      </SectionPanel>

      {/* What unlocks at next rank */}
      {nextRank && (
        <SectionPanel title={`What Unlocks at ${nextRank}`}>
          <div style={{ padding: '10px' }}>
            {ACTION_GROUPS.map(group => {
              const unlockHere = group.actions.filter(a => {
                const required = WORLD_ACTION_PERMISSIONS[a];
                return required === nextRank ||
                  (nextRank === 'CAPO' && (required === 'CAPO' || required === 'SOLDIER')) ||
                  (nextRank === 'UNDERBOSS' && required === 'UNDERBOSS');
              });
              if (unlockHere.length === 0) return null;
              return (
                <div key={group.label} style={{ marginBottom: '10px' }}>
                  <div className="label-caps" style={{ marginBottom: '5px', color: '#5580bb' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {unlockHere.map(a => (
                      <span key={a} style={{
                        fontSize: '8px', padding: '2px 6px',
                        background: '#0a0a1a', border: '1px solid #5580bb44',
                        color: '#5580bb',
                      }}>
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
