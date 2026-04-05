/**
 * Dashboard — role-aware entry point.
 * Mobile-first rewrite: HeroCard + NextActionCard layout.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_FAMILY, MOCK_MISSIONS, MOCK_CONTRACTS, MOCK_HITMAN_PROFILES, MOCK_PLAYERS, fmt } from '../lib/mockData';
import { MOCK_JAIL_RECORDS } from '../lib/jailMockData';
import { formatSentenceRemaining, jailTierLabel } from '../lib/jailEngine';
import { can } from '../lib/permissions';
import { PageHeader, SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { StatusBadge, RoleBadge } from '../components/ui/Badges';
import { StatGrid } from '../components/ui/StatGrid';
import { getActiveEvents, getUnreadNotifications, MOCK_CONTRIBUTION_SCORES, getPlayerNotifications, getFamilyFeed } from '../lib/opsData';
import { checkPromotionEligibility, PROMOTION_THRESHOLDS } from '../../../shared/ops';
import { BUSINESS_ASSIGNMENTS_SEED } from '../lib/worldConfig';
import { ALL_JOBS, getPlayerJobStates } from '../lib/jobsData';
import { isOnCooldown } from '../../../shared/jobs';

// ─────────────────────────────────────────────
// Archetype avatar colors
// ─────────────────────────────────────────────

const ARCHETYPE_BG: Record<string, string> = {
  RUNNER:     '#5a8a5a',  // Runner: earthy green for 'flexible path'
  MUSCLE:     '#8833cc',
  SCHEMER:    '#336699',
  FIXER:      '#339966',
  ASSOCIATE:  '#666699',
  EARNER:     '#cc9900',
  ENFORCER:   '#cc5500',
};

function getInitials(alias: string): string {
  return alias.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────
// Live Events Banner
// ─────────────────────────────────────────────

function LiveEventsBanner() {
  const [open, setOpen] = useState(true);
  const activeEvents = getActiveEvents();
  if (activeEvents.length === 0) return null;

  return (
    <div style={{
      background: '#0a1a0a',
      border: '1px solid #4a9a4a55',
      borderRadius: '6px',
      padding: '0',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
          color: '#4a9a4a', minHeight: '40px',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
          ◉ {activeEvents.length} ACTIVE EVENT{activeEvents.length > 1 ? 'S' : ''}
        </span>
        <span style={{ fontSize: '9px', color: '#4a9a4a' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 10px' }}>
          {activeEvents.map(e => (
            <div key={e.id} style={{ marginBottom: '8px', paddingTop: '6px', borderTop: '1px solid #1a2a1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0', marginBottom: '2px' }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic', marginBottom: '4px' }}>
                    {e.flavor}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {e.modifiers.map((m, i) => (
                      <span key={i} style={{
                        fontSize: '8px', padding: '1px 5px',
                        background: m.multiplier > 1 ? '#0a1a0a' : '#1a0808',
                        border: `1px solid ${m.multiplier > 1 ? '#4a9a4a44' : '#cc333344'}`,
                        color: m.multiplier > 1 ? '#4a9a4a' : '#cc3333',
                      }}>
                        {m.type.replace(/_/g, ' ')} ×{m.multiplier}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '8px', color: '#444', flexShrink: 0, textAlign: 'right' }}>
                  Until {new Date(e.endAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// What To Do Next — returns top suggestion
// ─────────────────────────────────────────────

function WhatToDoNext({ playerId }: { playerId: string }) {
  const contribution = MOCK_CONTRIBUTION_SCORES.find(s => s.playerId === playerId);
  const player = MOCK_PLAYERS[playerId];
  const familyRole = player?.family_role ?? null;
  const nextRank = familyRole === 'ASSOCIATE' ? 'SOLDIER' :
    familyRole === 'SOLDIER' ? 'CAPO' :
    familyRole === 'RECRUIT' ? 'ASSOCIATE' : null;

  const eligibility = (contribution && nextRank)
    ? checkPromotionEligibility(nextRank, contribution)
    : null;

  // Build suggestion list
  const suggestions: { text: string; href: string; priority: 'HIGH' | 'MED' | 'LOW' }[] = [];

  suggestions.push({
    text: 'Jobs are available now — run a job to earn and build contribution',
    href: '#/jobs',
    priority: 'HIGH',
  });

  if (eligibility?.eligible && nextRank) {
    suggestions.push({
      text: `You meet the thresholds for ${nextRank} — check your promotion eligibility`,
      href: '#/progression',
      priority: 'HIGH',
    });
  } else if (!eligibility?.eligible && nextRank && contribution) {
    const threshold = PROMOTION_THRESHOLDS[nextRank];
    if (threshold) {
      const jobsLeft = Math.max(0, threshold.minJobsCompleted - contribution.jobsCompleted);
      if (jobsLeft > 0) {
        suggestions.push({
          text: `${jobsLeft} more jobs needed for ${nextRank} eligibility`,
          href: '#/progression',
          priority: 'MED',
        });
      }
    }
  }

  suggestions.push({
    text: 'Get assigned to a front to unlock Business Jobs and passive income',
    href: '#/family/turf',
    priority: 'MED',
  });

  const unread = getUnreadNotifications(playerId);
  if (unread > 0) {
    suggestions.push({
      text: `${unread} unread notification${unread > 1 ? 's' : ''} waiting for you`,
      href: '#/notifications',
      priority: 'MED',
    });
  }

  suggestions.push({
    text: 'Check the Family Board for new posts and strategy updates',
    href: '#/family/board',
    priority: 'LOW',
  });

  const top = suggestions[0];
  if (!top) return null;

  return (
    <div className="next-action-card">
      <div className="next-action-card__label">Next Action</div>
      <div className="next-action-card__title">{top.text}</div>
      <a href={top.href} className="next-action-card__cta">
        {top.priority === 'HIGH' && top.href.includes('jobs') ? 'Go to Jobs →' :
         top.priority === 'HIGH' ? 'View Progression →' :
         top.href.includes('turf') ? 'View Businesses →' :
         top.href.includes('notifications') ? 'View Notifications →' : 'Go →'}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────
// HeroCard — player identity summary
// ─────────────────────────────────────────────

function HeroCard() {
  const { player } = useGame();
  const s = player.stats;
  const avatarBg = ARCHETYPE_BG[player.archetype] ?? '#555';

  return (
    <div className="hero-card">
      <div className="hero-card__top">
        <div className="hero-card__avatar" style={{ background: avatarBg }}>
          {getInitials(player.alias)}
        </div>
        <div className="hero-card__identity">
          <div className="hero-card__alias">{player.alias}</div>
          <div className="hero-card__username">@{player.username} · {player.archetype}</div>
        </div>
        <div className="hero-card__badges">
          {player.family_role && <RoleBadge role={player.family_role} />}
          <StatusBadge status={player.player_status} />
        </div>
      </div>
      <div className="hero-card__stats">
        {[
          { label: 'Cash',    value: fmt(s.cash),       cls: 'text-cash' },
          { label: 'Heat',    value: `${s.heat}/100`,   cls: s.heat > 60 ? 'text-danger' : 'text-warn' },
          { label: 'Respect', value: String(s.respect), cls: '' },
          { label: 'HP',      value: `${s.hp}/100`,     cls: '' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="hero-card__stat">
            <span className="hero-card__stat-label">{label}</span>
            <span className={`hero-card__stat-val ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Family compact card
// ─────────────────────────────────────────────

function FamilyCard({ canTreasury }: { canTreasury: boolean }) {
  const { player } = useGame();
  return (
    <div className="compact-card">
      <div className="compact-card__header">
        <span className="compact-card__title">{MOCK_FAMILY.name}</span>
        <span className="badge-gold">{player.family_role ?? 'Member'}</span>
      </div>
      <div className="compact-card__body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
          <div style={{ fontSize: '12px', color: '#4a9a4a', fontWeight: 600 }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
          <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>{MOCK_FAMILY.members.length}</div>
        </div>
        {canTreasury && (
          <div>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treasury</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }} className="text-cash">{fmt(MOCK_FAMILY.treasury)}</div>
          </div>
        )}
      </div>
      <a href="#/family" className="compact-card__link">View family →</a>
    </div>
  );
}

// ─────────────────────────────────────────────
// Jobs compact card
// ─────────────────────────────────────────────

function JobsCard() {
  const { player } = useGame();
  const jobStates = getPlayerJobStates(player.id);
  const readyCount = ALL_JOBS.filter(j => {
    const s = jobStates[j.id];
    return !s || !isOnCooldown(s, j);
  }).length;
  const cooldownCount = ALL_JOBS.filter(j => {
    const s = jobStates[j.id];
    return s && isOnCooldown(s, j);
  }).length;

  return (
    <div className="compact-card">
      <div className="compact-card__header">
        <span className="compact-card__title">Jobs</span>
        <span className="compact-card__badge">{readyCount} ready</span>
      </div>
      <div className="compact-card__body">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available</div>
            <div style={{ fontSize: '15px', color: '#4a9a4a', fontWeight: 700 }}>{readyCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cooldown</div>
            <div style={{ fontSize: '15px', color: '#888', fontWeight: 700 }}>{cooldownCount}</div>
          </div>
        </div>
      </div>
      <a href="#/jobs" className="compact-card__link">Run jobs →</a>
    </div>
  );
}

// ─────────────────────────────────────────────
// Business compact card
// ─────────────────────────────────────────────

function BusinessCard() {
  const { player } = useGame();
  const assignment = BUSINESS_ASSIGNMENTS_SEED.find(a => a.playerId === player.id);
  if (!assignment) return null;

  const bizName = assignment.businessId.replace('BUSINESS_', '').replace(/_\d+$/, '').replace(/_/g, ' ');

  return (
    <div className="compact-card">
      <div className="compact-card__header">
        <span className="compact-card__title">My Front</span>
        <span style={{ fontSize: '9px', color: '#4a9a4a' }}>Assigned</span>
      </div>
      <div className="compact-card__body">
        <div style={{ fontSize: '13px', color: '#ccc', fontWeight: 600, marginBottom: '4px' }}>{bizName}</div>
        <div style={{ fontSize: '10px', color: '#555' }}>Slot: {assignment.slotDefinitionId.replace(/_/g, ' ')}</div>
      </div>
      <a href="#/family/turf" className="compact-card__link">View front →</a>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications compact card
// ─────────────────────────────────────────────

function NotificationsCard() {
  const { player } = useGame();
  const unread = getUnreadNotifications(player.id);
  const notifications = getPlayerNotifications(player.id).slice(0, 2);

  return (
    <div className="compact-card">
      <div className="compact-card__header">
        <span className="compact-card__title">Notifications</span>
        {unread > 0 && <span className="compact-card__badge">{unread} unread</span>}
      </div>
      <div className="compact-card__body" style={{ padding: '8px 12px' }}>
        {notifications.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>No notifications.</div>
        ) : notifications.map(n => (
          <div key={n.id} style={{
            padding: '5px 0',
            borderBottom: '1px solid #1a1a1a',
            fontSize: '11px',
            color: n.read ? '#666' : '#aaa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {!n.read && <span style={{ color: '#cc3333', marginRight: '4px' }}>●</span>}
            {n.title}
          </div>
        ))}
      </div>
      <a href="#/notifications" className="compact-card__link">View all →</a>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared mini stat card
// ─────────────────────────────────────────────

function StatCard({ label, value, cls = '' }: { label: string; value: React.ReactNode; cls?: string }) {
  return (
    <div className="panel" style={{ padding: '8px 10px' }}>
      <div className="label-caps">{label}</div>
      <div className={`stat-val ${cls}`}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UnaffiliatedDashboard
// ─────────────────────────────────────────────

export function UnaffiliatedDashboard() {
  const { player } = useGame();
  const s = player.stats;

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard — Unaffiliated"
        sub={`${player.alias} · ${player.archetype}`}
        action={<StatusBadge status={player.player_status} />}
      />

      <InfoAlert variant="warn">
        No family affiliation. Find a family to unlock full gameplay, or operate solo at reduced income.
      </InfoAlert>

      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        <StatCard label="Cash"    value={fmt(s.cash)}     cls="text-cash" />
        <StatCard label="Heat"    value={`${s.heat}/100`} cls={s.heat > 60 ? 'text-danger' : 'text-warn'} />
        <StatCard label="Respect" value={s.respect} />
        <StatCard label="HP"      value={`${s.hp}/100`} />
      </div>

      <div className="ml-panel-row" style={{ gap: '8px', marginBottom: '8px' }}>
        <SectionPanel title="Open Families">
          {[
            { name: 'The Corrado Family', power: 8420, members: 6, status: 'Recruiting' },
            { name: 'The Ferrante Crew',  power: 7100, members: 5, status: 'Closed' },
            { name: 'West Side Outfit',   power: 4200, members: 3, status: 'Recruiting' },
          ].map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #1a1a1a', gap: '4px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>{f.members}m · Power {f.power.toLocaleString()}</div>
              </div>
              <button className={`btn ${f.status === 'Recruiting' ? 'btn-primary' : 'btn-ghost'}`} style={{ flexShrink: 0 }} disabled={f.status !== 'Recruiting'}>
                {f.status}
              </button>
            </div>
          ))}
        </SectionPanel>

        <SectionPanel title="Solo Street Jobs">
          {[
            { name: 'Numbers Runner', pay: 800, heat: 3 },
            { name: 'Delivery Boy',   pay: 600, heat: 1 },
            { name: 'Lookout Duty',   pay: 1200, heat: 5 },
          ].map(j => (
            <div key={j.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #1a1a1a', gap: '4px' }}>
              <span style={{ fontSize: '10px' }}>{j.name}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ color: '#ffcc33', fontSize: '10px' }}>{fmt(j.pay)}</span>
                <span style={{ color: '#cc7700', fontSize: '9px' }}>+{j.heat}</span>
                <button className="btn btn-ghost">Run</button>
              </div>
            </div>
          ))}
        </SectionPanel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RecruitDashboard
// ─────────────────────────────────────────────

export function RecruitDashboard() {
  const { player } = useGame();
  const s = player.stats;
  const recruitMissions = MOCK_MISSIONS.filter(m => m.recruit_eligible && m.state === 'OPEN');
  const myMember = MOCK_FAMILY.members.find(m => m.player_id === player.id);

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard — Recruit"
        sub={`${player.alias} · ${MOCK_FAMILY.name}`}
        action={<div style={{ display: 'flex', gap: '4px' }}>
          {player.family_role && <RoleBadge role={player.family_role} />}
          <StatusBadge status={player.player_status} />
        </div>}
      />

      <SectionPanel title="Recruit Status — Restrictions">
        <div style={{ padding: '8px 10px', fontSize: '10px', color: '#aaa', lineHeight: '1.6' }}>
          <strong style={{ color: '#cc9900' }}>You are on probation.</strong> As a Recruit:
          <ul style={{ margin: '5px 0 0 14px', listStyle: 'disc', color: '#888' }}>
            <li>Starter-tier missions only</li>
            <li>No family treasury access</li>
            <li>Cannot hire hitmen, declare war, or manage territory</li>
            <li>Income share: 60% of full-member rate</li>
          </ul>
          <div style={{ marginTop: '6px', color: '#666' }}>
            To promote: <span style={{ color: '#4a9a4a' }}>
              {myMember ? `${myMember.missions_completed}/2 missions` : '2+ missions'},{' '}
              {myMember ? `${fmt(myMember.money_earned)}/$5K earned` : '$5K+ earned'},
              and Capo approval.
            </span>
          </div>
        </div>
      </SectionPanel>

      <div className="ml-grid-4" style={{ margin: '8px 0' }}>
        <StatCard label="Cash"    value={fmt(s.cash)} cls="text-cash" />
        <StatCard label="Heat"    value={`${s.heat}/100`} />
        <StatCard label="Respect" value={s.respect} />
        <StatCard label="HP"      value={`${s.hp}/100`} />
      </div>

      {/* Progress bars */}
      <SectionPanel title="Progress to Associate">
        <div style={{ padding: '8px 10px' }}>
          {[
            { label: 'Missions', current: myMember?.missions_completed ?? 0, required: 2 },
            { label: 'Money Earned', current: myMember?.money_earned ?? 0, required: 5000, isMoney: true },
          ].map(({ label, current, required, isMoney }) => {
            const pct = Math.min(100, Math.round((current / required) * 100));
            return (
              <div key={label} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px', color: '#aaa' }}>
                  <span>{label}</span>
                  <span style={{ color: pct >= 100 ? '#4a9a4a' : '#e0e0e0' }}>
                    {isMoney ? fmt(current) : current} / {isMoney ? fmt(required) : required}
                  </span>
                </div>
                <div style={{ height: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#2a6a2a' : '#4a4a00' }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      <SectionPanel title="Available Missions (Starter Only)" right={`${recruitMissions.length} open`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead><tr><th>Mission</th><th>Type</th><th>Pay</th><th>Heat</th><th></th></tr></thead>
            <tbody>
              {recruitMissions.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 'bold' }}>{m.title}</td>
                  <td style={{ color: '#888' }}>{m.type}</td>
                  <td className="text-cash">{fmt(m.payout)}</td>
                  <td className="text-heat">+{m.heat_cost}</td>
                  <td><a href="#/missions" className="btn btn-primary">View</a></td>
                </tr>
              ))}
              {recruitMissions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#555', padding: '12px' }}>No starter missions open.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// MemberDashboard
// ─────────────────────────────────────────────

export function MemberDashboard() {
  const { player, gameRole } = useGame();
  const canTreasury = can(gameRole, 'VIEW_FAMILY_TREASURY');

  return (
    <div className="page-stack">
      {/* Hero Card */}
      <HeroCard />

      {/* Next Action Card */}
      <WhatToDoNext playerId={player.id} />

      {/* Live Events Banner */}
      <LiveEventsBanner />

      {/* Desktop: two columns */}
      <div className="desktop-two-col">
        <div className="desktop-two-col__main">
          {/* Jobs Card */}
          <JobsCard />

          {/* Business Card */}
          <BusinessCard />

          {/* Notifications Card */}
          <NotificationsCard />
        </div>

        <div className="desktop-two-col__side">
          {/* Family Card */}
          <FamilyCard canTreasury={canTreasury} />

          {/* Leadership block */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Leadership</span>
              <span style={{ fontSize: '10px', color: '#555' }}>{MOCK_FAMILY.name}</span>
            </div>
            <div>
              {MOCK_FAMILY.members
                .filter(m => ['BOSS', 'UNDERBOSS', 'CONSIGLIERE'].includes(m.role))
                .map(m => {
                  const p = MOCK_PLAYERS[m.player_id];
                  return (
                    <div key={m.player_id} className="member-row">
                      <RoleBadge role={m.role} />
                      <span className="member-row__name">{p?.alias ?? m.player_id}</span>
                      <span className="member-row__meta" style={{ color: '#888', fontSize: '10px' }}>{p?.archetype}</span>
                    </div>
                  );
                })
              }
            </div>
            <a href="#/family" className="compact-card__link">View roster →</a>
          </div>
        </div>
      </div>

      {/* DEV banner */}
      <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '7px 12px', fontSize: '10px', color: '#5580bb', borderRadius: '4px' }}>
        <strong>DEV:</strong> Playing as <strong>{player.alias}</strong> ({player.family_role ?? 'Unaffiliated'}).
        Switch role via the sidebar switcher.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FamilyLeadershipDashboard
// ─────────────────────────────────────────────

export function FamilyLeadershipDashboard() {
  const { player, gameRole } = useGame();
  const s = player.stats;
  const openContracts  = MOCK_CONTRACTS.filter(c => c.state === 'OPEN');
  const recruits       = MOCK_FAMILY.members.filter(m => m.role === 'RECRUIT');
  const blowback       = MOCK_CONTRACTS.find(c => c.state === 'FAILED_TRACED' && c.blowback_expires_at);

  return (
    <div className="page-stack">
      {/* Family Hero Card */}
      <div className="family-hero-card">
        <div className="family-hero-card__top">
          <div>
            <div className="family-hero-card__name">{MOCK_FAMILY.name}</div>
            <div className="family-hero-card__motto">"{MOCK_FAMILY.motto}"</div>
          </div>
          <div className="family-hero-card__badges">
            {player.family_role && <RoleBadge role={player.family_role} />}
            <StatusBadge status={player.player_status} />
          </div>
        </div>
        <div className="stat-strip">
          {[
            { label: 'Treasury',  value: fmt(MOCK_FAMILY.treasury),                cls: 'text-cash' },
            { label: 'Power',     value: MOCK_FAMILY.power_score.toLocaleString(), cls: '' },
            { label: 'Members',   value: String(MOCK_FAMILY.members.length),       cls: '' },
            { label: 'Recruits',  value: String(recruits.length),                  cls: recruits.length > 0 ? 'text-warn' : '' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="stat-strip__item">
              <span className="stat-strip__label">{label}</span>
              <span className={`stat-strip__val ${cls}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {blowback && (
        <InfoAlert variant="danger">
          <strong>Blowback Active.</strong> 7-day retaliation window. Compensation paid: {fmt(blowback.price * 2)}.
        </InfoAlert>
      )}

      {/* Next Action */}
      <WhatToDoNext playerId={player.id} />

      {/* Live Events */}
      <LiveEventsBanner />

      {/* Desktop two col */}
      <div className="desktop-two-col">
        <div className="desktop-two-col__main">
          {/* Your Stats */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Your Stats — {player.alias}</span>
            </div>
            <div className="compact-card__body">
              <StatGrid stats={s} role={gameRole} />
            </div>
          </div>

          {/* Jobs */}
          <JobsCard />

          {/* Notifications */}
          <NotificationsCard />
        </div>

        <div className="desktop-two-col__side">
          {/* Treasury Card */}
          <div className="compact-card" style={{ borderLeft: '3px solid #ffcc33' }}>
            <div className="compact-card__header">
              <span className="compact-card__title">Treasury</span>
            </div>
            <div className="compact-card__body">
              <div style={{ fontSize: '22px', fontWeight: 'bold' }} className="text-cash">{fmt(MOCK_FAMILY.treasury)}</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '3px' }}>Family funds</div>
            </div>
            <a href="#/treasury" className="compact-card__link">Manage →</a>
          </div>

          {/* Recruits */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Pending Recruits</span>
              {recruits.length > 0 && <span className="compact-card__badge">{recruits.length}</span>}
            </div>
            {recruits.length === 0 ? (
              <div className="compact-card__body" style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>No recruits pending.</div>
            ) : (
              <>
                <div>
                  {recruits.slice(0, 3).map(m => {
                    const p = MOCK_PLAYERS[m.player_id];
                    const ready = m.missions_completed >= 2 && m.money_earned >= 5000;
                    return (
                      <div key={m.player_id} className="member-row">
                        <span className="member-row__name">{p?.alias ?? m.player_id}</span>
                        <span style={{ fontSize: '10px', color: ready ? '#4a9a4a' : '#555' }}>
                          {ready ? 'Ready' : `${m.missions_completed}/2 missions`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <a href="#/family" className="compact-card__link">Manage family →</a>
              </>
            )}
          </div>

          {/* Contracts */}
          {can(gameRole, 'POST_CONTRACT') && (
            <div className="compact-card">
              <div className="compact-card__header">
                <span className="compact-card__title">Open Contracts</span>
                {openContracts.length > 0 && <span className="compact-card__badge">{openContracts.length}</span>}
              </div>
              {openContracts.length === 0 ? (
                <div className="compact-card__body" style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>None open.</div>
              ) : (
                <>
                  <div>
                    {openContracts.slice(0, 3).map(c => (
                      <div key={c.id} className="member-row">
                        <span className="member-row__name">{c.target_alias}</span>
                        <span className="text-cash" style={{ fontSize: '11px', fontWeight: 600 }}>{fmt(c.price)}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#/contracts" className="compact-card__link">Contract board →</a>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DEV banner */}
      <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '7px 12px', fontSize: '10px', color: '#5580bb', borderRadius: '4px' }}>
        <strong>DEV:</strong> Playing as <strong>{player.alias}</strong> ({player.family_role ?? 'Unaffiliated'}).
        Switch role via the sidebar switcher.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HitmanDashboard
// ─────────────────────────────────────────────

export function HitmanDashboard() {
  const { player } = useGame();
  const s = player.stats;
  const openContracts = MOCK_CONTRACTS.filter(c => c.state === 'OPEN');
  const myProfile = MOCK_HITMAN_PROFILES.find(p => p.player_id === player.id);
  const total = (myProfile?.success_count ?? 0) + (myProfile?.failure_count ?? 0);
  const successRate = total > 0 ? Math.round(((myProfile?.success_count ?? 0) / total) * 100) : 0;

  return (
    <div className="page-stack">
      <PageHeader
        title={player.alias}
        sub={`Solo Hitman · ${myProfile?.reputation_tier ?? '—'}`}
        action={<StatusBadge status={player.player_status} />}
      />

      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        <StatCard label="Contracts"  value={myProfile?.success_count ?? 0} />
        <StatCard label="Success %"  value={`${successRate}%`} cls="text-success" />
        <StatCard label="Streak"     value={`×${myProfile?.current_streak ?? 0}`} cls="text-cash" />
        <StatCard label="Heat"       value={`${s.heat}/100`} cls={s.heat > 60 ? 'text-danger' : 'text-warn'} />
      </div>

      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        <StatCard label="Cash"        value={fmt(s.cash)} cls="text-cash" />
        <StatCard label="Suspicion"   value={s.suspicion} cls={s.suspicion > 60 ? 'text-danger' : ''} />
        <StatCard label="Accuracy"    value={s.accuracy} />
        <StatCard label="Intelligence" value={s.intelligence} />
      </div>

      <div className="ml-panel-row" style={{ gap: '8px' }}>
        <SectionPanel title="Available Contracts" right={`${openContracts.length}`}>
          {openContracts.length === 0 ? (
            <EmptySlate msg="No open contracts." sub="Try downtime activities." />
          ) : (
            <>
              <div className="ml-table-scroll">
                <table className="data-table">
                  <thead><tr><th>Target</th><th>Client</th><th>Price</th><th>Diff</th></tr></thead>
                  <tbody>
                    {openContracts.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 'bold' }}>{c.target_alias}</td>
                        <td style={{ color: '#888' }}>{c.anonymized_poster_id}</td>
                        <td className="text-cash">{fmt(c.price)}</td>
                        <td>{c.target_difficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '5px 8px', borderTop: '1px solid #1a1a1a' }}>
                <a href="#/contracts" style={{ fontSize: '10px', color: '#cc3333' }}>Full contract board →</a>
              </div>
            </>
          )}
        </SectionPanel>

        <SectionPanel title="Downtime Options">
          <div style={{ padding: '8px 10px', fontSize: '10px', color: '#aaa' }}>
            <p style={{ marginBottom: '6px', color: '#666' }}>No active contract. Run a downtime activity:</p>
            {[
              { label: 'Surveillance Job',  desc: 'Map targets, build intel', href: '#/downtime' },
              { label: 'Cleanup Job',       desc: 'Reduce heat, erase trace', href: '#/downtime' },
              { label: 'Training Session',  desc: 'Boost accuracy', href: '#/downtime' },
              { label: 'Safehouse Upgrade', desc: 'Reduce prison risk', href: '#/downtime' },
            ].map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #1a1a1a', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
                  <div style={{ color: '#555', fontSize: '9px' }}>{d.desc}</div>
                </div>
                <a href={d.href} className="btn btn-ghost" style={{ flexShrink: 0 }}>Start</a>
              </div>
            ))}
            <a href="#/downtime" style={{ color: '#cc3333', fontSize: '10px' }}>All downtime →</a>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Jail Status Banner
// ─────────────────────────────────────────────

function JailBanner({ playerId }: { playerId: string }) {
  const record = MOCK_JAIL_RECORDS.find(r =>
    r.player_id === playerId && r.status !== 'RELEASED'
  );
  if (!record) return null;

  const timeLeft = formatSentenceRemaining(record);
  const isEligible = record.status === 'RELEASE_ELIGIBLE';

  return (
    <div style={{
      background: '#1a0808', border: '2px solid #cc3333',
      padding: '10px 14px', marginBottom: '12px',
      fontFamily: 'Verdana, sans-serif',
      borderRadius: '4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#cc3333' }}>
          🔒 You Are Incarcerated — {jailTierLabel(record.tier)}
        </div>
        {isEligible && (
          <span style={{ fontSize: '10px', color: '#4a9a4a', fontWeight: 'bold' }}>Release Eligible</span>
        )}
      </div>
      <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>
        {record.arrested_for}
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', color: isEligible ? '#4a9a4a' : '#cc9900', fontWeight: 'bold' }}>
          {timeLeft}
        </span>
        <span style={{ fontSize: '10px', color: '#555' }}>
          Normal actions blocked. Chat and kites available.
        </span>
        <a href="#/jail" style={{ fontSize: '10px', color: '#cc3333', fontWeight: 'bold' }}>
          → Go to Jail →
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────

export default function Dashboard() {
  const { gameRole, player } = useGame();

  // Jailed player gets their normal dashboard + a jail banner at the top
  const jailRecord = MOCK_JAIL_RECORDS.find(r =>
    r.player_id === player.id && r.status !== 'RELEASED'
  );

  let inner;
  if (gameRole === 'SOLO_HITMAN')                                       inner = <HitmanDashboard />;
  else if (gameRole === 'UNAFFILIATED')                                 inner = <UnaffiliatedDashboard />;
  else if (gameRole === 'RECRUIT')                                      inner = <RecruitDashboard />;
  else if (['BOSS','UNDERBOSS','CONSIGLIERE','CAPO'].includes(gameRole)) inner = <FamilyLeadershipDashboard />;
  else inner = <MemberDashboard />;

  return (
    <>
      <JailBanner playerId={player.id} />
      {inner}
    </>
  );
}
