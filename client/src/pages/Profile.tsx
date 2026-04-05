import { useGame } from '../lib/gameContext';
import { fmt, MOCK_PLAYERS } from '../lib/mockData';
import { ARCHETYPE_MAP } from '../lib/archetypes';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import { StatusBadge, RoleBadge } from '../components/ui/Badges';
import { StatGrid, MiniStatBar } from '../components/ui/StatGrid';
import {
  MOCK_CREWS,
  FAMILY_NAMES,
  calcFrontDailyIncome,
  MOCK_FRONT_INSTANCES,
} from '../lib/worldSeed';
import {
  BUSINESS_ASSIGNMENTS_SEED,
  BUSINESS_SLOT_DEFINITIONS,
  BUSINESS_DEFINITIONS,
} from '../lib/worldConfig';
import { getPlayerJobStates } from '../lib/jobsData';
import { ALL_JOBS } from '../lib/jobsData';

const STAT_KEYS = ['respect','strength','charisma','intelligence','clout','luck','leadership','suspicion','business','accuracy','intimidation'] as const;

const DISTRICT_LABEL: Record<string, string> = {
  DOWNTOWN:        'Downtown',
  WATERFRONT:      'Waterfront',
  NORTH_END:       'North End',
  INDUSTRIAL_BELT: 'Industrial Belt',
  CASINO_STRIP:    'Casino Strip',
  OUTER_BOROUGHS:  'Outer Boroughs',
};

export default function Profile() {
  const { player, gameRole } = useGame();
  const s = player.stats;
  const arch = ARCHETYPE_MAP[player.archetype];
  const WEIGHT_VAL = { HIGH: 85, MEDIUM: 55, LOW: 25 };

  // Crew info
  const playerCrew = player.crew_id ? MOCK_CREWS.find(c => c.id === player.crew_id) : null;
  const crewLeader = playerCrew ? MOCK_PLAYERS[playerCrew.leaderId] : null;

  // Family member info
  const memberInfo = MOCK_PLAYERS['p-boss']
    ? { joined: '2026-01-01T00:00:00Z' } // fallback
    : null;

  // Business assignments for this player
  const myAssignments = BUSINESS_ASSIGNMENTS_SEED.filter(a => a.playerId === player.id);

  // Job stats
  const jobStates = getPlayerJobStates(player.id);
  const jobsRun = Object.values(jobStates).filter(s => s.last_completed_at !== null).length;
  const totalJobsAvailable = ALL_JOBS.length;

  return (
    <div>
      <PageHeader
        title={player.alias}
        sub={`@${player.username} · ${player.archetype} · ${player.affiliation}`}
        action={
          <div className="flex gap-2">
            {player.family_role && <RoleBadge role={player.family_role} />}
            <StatusBadge status={player.player_status} />
          </div>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Cash',    v: fmt(s.cash),  cls: 'text-cash' },
          { l: 'Stash',   v: fmt(s.stash), cls: 'text-cash' },
          { l: 'Heat',    v: `${s.heat}/100`, cls: s.heat > 70 ? 'text-danger' : 'text-warn' },
          { l: 'HP',      v: `${s.hp}/100`,   cls: s.hp < 40 ? 'text-danger' : '' },
        ].map(({ l, v, cls }) => (
          <div key={l} className="panel p-4">
            <span className="label-caps block mb-1">{l}</span>
            <span className={`stat-val ${cls}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* All stats */}
        <div className="lg:col-span-2">
          <SectionPanel title="All Stats">
            <div className="px-4 py-4">
              <StatGrid stats={s} role={gameRole} />
            </div>
          </SectionPanel>
        </div>

        {/* Archetype */}
        <div>
          <SectionPanel title="Archetype">
            <div className="px-4 py-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground">{arch.name}</p>
                <p className="text-xs text-danger italic mt-0.5">{arch.tagline}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{arch.role}</p>

              <div>
                <p className="label-caps mb-2">Stat Weights</p>
                <div className="space-y-1.5">
                  {STAT_KEYS.map(k => {
                    const w = arch.stat_weights[k];
                    if (!w) return null;
                    return <MiniStatBar key={k} label={k} value={WEIGHT_VAL[w]} />;
                  })}
                </div>
              </div>

              <div>
                <p className="label-caps mb-1.5">Bonuses</p>
                <ul className="space-y-1">
                  {arch.starting_bonuses.map(b => (
                    <li key={b} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-success">+</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionPanel>
        </div>
      </div>

      {/* Family info */}
      {player.family_id && (
        <SectionPanel title="Family Affiliation">
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {[
              ['Family',   FAMILY_NAMES[player.family_id] ?? 'Unknown'],
              ['Role',     player.family_role ?? '—'],
              ['Affiliation', player.affiliation],
              ['Status',   player.player_status],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <span className="label-caps block mb-0.5">{l}</span>
                <span className="text-foreground font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </SectionPanel>
      )}

      {/* Crew card */}
      {playerCrew ? (
        <SectionPanel title="Crew Assignment">
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#ffcc33', fontWeight: 700 }}>{playerCrew.name}</div>
                <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                  Role: <span style={{ color: '#aaa' }}>{player.crew_role ?? 'Member'}</span>
                </div>
              </div>
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
                background: '#0d1a0d', border: '1px solid #1a3a1a', color: '#4a9a4a',
              }}>
                {playerCrew.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '10px' }}>
              <div>
                <span className="label-caps block">Leader</span>
                <span style={{ color: '#ccc' }}>{crewLeader?.alias ?? playerCrew.leaderId}</span>
              </div>
              <div>
                <span className="label-caps block">Territory</span>
                <span style={{ color: '#818cf8' }}>
                  {playerCrew.territory.map(s => DISTRICT_LABEL[s] ?? s).join(', ')}
                </span>
              </div>
              <div>
                <span className="label-caps block">Members</span>
                <span style={{ color: '#ccc' }}>{playerCrew.memberIds.length + 1}</span>
              </div>
            </div>
            <p style={{ fontSize: '10px', color: '#666', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.4' }}>
              {playerCrew.description}
            </p>
          </div>
        </SectionPanel>
      ) : player.family_id && (
        <SectionPanel title="Crew Assignment">
          <div style={{ padding: '10px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
            Not assigned to a crew. Ask your Underboss for an assignment.
          </div>
        </SectionPanel>
      )}

      {/* Active front assignments */}
      <SectionPanel title="Front Assignments">
        {myAssignments.length === 0 ? (
          <div style={{ padding: '10px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
            No front assignments. Get assigned by your Underboss to unlock business jobs.
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {myAssignments.map(assign => {
              const slotDef = BUSINESS_SLOT_DEFINITIONS.find(s => s.id === assign.slotDefinitionId);
              const bizType = assign.businessId.replace(/^BUSINESS_/, '').replace(/_\d+$/, '');
              const bizDef = BUSINESS_DEFINITIONS.find(b => b.id === bizType);
              const frontInst = MOCK_FRONT_INSTANCES.find(f => f.frontType === bizType && f.familyId === player.family_id);
              const dailyIncome = frontInst ? calcFrontDailyIncome(frontInst.frontType, frontInst.upgradeLevel) : 0;
              const managerCut = Math.round(dailyIncome * 0.15);

              return (
                <div key={assign.id} style={{
                  padding: '8px 10px', marginBottom: '5px',
                  background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 600 }}>
                      {slotDef?.displayName ?? assign.slotDefinitionId}
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                      {bizDef?.displayName ?? bizType} · Assigned {new Date(assign.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {managerCut > 0 && (
                      <>
                        <div style={{ fontSize: '10px', color: '#ffcc33', fontWeight: 600 }}>
                          {fmt(managerCut)}/day
                        </div>
                        <div style={{ fontSize: '9px', color: '#555' }}>your cut</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionPanel>

      {/* Job stats */}
      <SectionPanel title="Job Stats">
        <div style={{ padding: '10px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { l: 'Jobs Run',       v: String(jobsRun) },
            { l: 'Jobs Available', v: String(totalJobsAvailable) },
            { l: 'Assignments',    v: String(myAssignments.length) },
            { l: 'Crew Role',      v: player.crew_role ?? 'None' },
          ].map(({ l, v }) => (
            <div key={l}>
              <span className="label-caps block">{l}</span>
              <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 10px 8px', fontSize: '9px', color: '#333', fontStyle: 'italic' }}>
          DEV: Job state is mock data seeded per player ID
        </div>
      </SectionPanel>
    </div>
  );
}
