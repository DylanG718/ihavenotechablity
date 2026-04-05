/**
 * MafiaLife — Crew Management
 * Route: /crews
 *
 * Shows family crews, their members, territory, and active fronts.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_PLAYERS, fmt } from '../lib/mockData';
import { can } from '../lib/permissions';
import { PageHeader, SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { RoleBadge } from '../components/ui/Badges';
import {
  MOCK_CREWS,
  MOCK_FRONT_INSTANCES,
  getCrewsByFamily,
  FAMILY_NAMES,
  calcFrontDailyIncome,
} from '../lib/worldSeed';
import { TURFS, DISTRICTS } from '../lib/worldConfig';
import type { Crew } from '../../../shared/world';
import { useToast } from '../hooks/use-toast';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const DISTRICT_LABEL: Record<string, string> = {
  DOWNTOWN:        'Downtown',
  WATERFRONT:      'Waterfront',
  NORTH_END:       'North End',
  INDUSTRIAL_BELT: 'Industrial Belt',
  CASINO_STRIP:    'Casino Strip',
  OUTER_BOROUGHS:  'Outer Boroughs',
};

function getCrewFronts(crew: Crew) {
  // Get all turfs in the crew's territory districts
  const crewTurfIds = TURFS
    .filter(t => t.familyId === crew.familyId && crew.territory.includes(
      DISTRICTS.find(d => d.id === t.districtId)?.slug ?? ''
    ))
    .map(t => t.id);
  return MOCK_FRONT_INSTANCES.filter(f => crewTurfIds.includes(f.turfId));
}

function getPlayerAlias(playerId: string): string {
  return MOCK_PLAYERS[playerId]?.alias ?? playerId;
}

function getPlayerRole(playerId: string): string {
  return MOCK_PLAYERS[playerId]?.family_role ?? '—';
}

// ─────────────────────────────────────────────
// Crew Detail Modal
// ─────────────────────────────────────────────

function CrewDetailModal({ crew, onClose }: { crew: Crew; onClose: () => void }) {
  const crewFronts = getCrewFronts(crew);
  const totalIncome = crewFronts.reduce(
    (sum, f) => sum + calcFrontDailyIncome(f.frontType, f.upgradeLevel),
    0
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', padding: '16px',
    }}>
      <div style={{
        background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '4px',
        width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '13px', color: '#ffcc33', fontWeight: 700 }}>{crew.name}</h2>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {FAMILY_NAMES[crew.familyId] ?? crew.familyId}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '12px 14px' }}>
          {/* Description */}
          <p style={{ fontSize: '10px', color: '#888', marginBottom: '12px', lineHeight: '1.5', fontStyle: 'italic' }}>
            {crew.description}
          </p>

          {/* Leader */}
          <div style={{ marginBottom: '10px' }}>
            <span className="label-caps block" style={{ marginBottom: '4px' }}>Crew Leader</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#ffcc33', fontWeight: 600 }}>
                {getPlayerAlias(crew.leaderId)}
              </span>
              <span style={{ fontSize: '9px', padding: '1px 5px', background: '#1a1500', border: '1px solid #3a2a00', color: '#cc9900', borderRadius: '2px' }}>
                {getPlayerRole(crew.leaderId)}
              </span>
            </div>
          </div>

          {/* Members */}
          <div style={{ marginBottom: '10px' }}>
            <span className="label-caps block" style={{ marginBottom: '6px' }}>Members ({crew.memberIds.length})</span>
            {crew.memberIds.map(pid => (
              <div key={pid} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 8px', marginBottom: '3px',
                background: '#111', borderRadius: '2px', border: '1px solid #1a1a1a',
              }}>
                <span style={{ fontSize: '10px', color: '#ccc' }}>{getPlayerAlias(pid)}</span>
                <span style={{ fontSize: '9px', color: '#666' }}>{getPlayerRole(pid)}</span>
              </div>
            ))}
          </div>

          {/* Territory */}
          <div style={{ marginBottom: '10px' }}>
            <span className="label-caps block" style={{ marginBottom: '4px' }}>Territory</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {crew.territory.map(slug => (
                <span key={slug} style={{
                  fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
                  background: '#15091a', border: '1px solid #3a1a5a', color: '#818cf8',
                }}>
                  {DISTRICT_LABEL[slug] ?? slug}
                </span>
              ))}
            </div>
          </div>

          {/* Front assignments */}
          <div>
            <span className="label-caps block" style={{ marginBottom: '6px' }}>
              Active Fronts ({crewFronts.length}) — {fmt(totalIncome)}/day
            </span>
            {crewFronts.length === 0 && (
              <div style={{ fontSize: '10px', color: '#444', fontStyle: 'italic' }}>No fronts in this crew's territory</div>
            )}
            {crewFronts.map(f => (
              <div key={f.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '4px 8px', marginBottom: '2px',
                background: '#111', borderRadius: '2px', border: '1px solid #1a1a1a',
              }}>
                <span style={{ fontSize: '10px', color: '#aaa' }}>{f.frontType} Lv{f.upgradeLevel}</span>
                <span style={{ fontSize: '10px', color: '#ffcc33' }}>{fmt(calcFrontDailyIncome(f.frontType, f.upgradeLevel))}/day</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Crew Card
// ─────────────────────────────────────────────

function CrewCard({ crew, isPlayerCrew, onClick }: { crew: Crew; isPlayerCrew: boolean; onClick: () => void }) {
  const crewFronts = getCrewFronts(crew);
  const totalIncome = crewFronts.reduce(
    (sum, f) => sum + calcFrontDailyIncome(f.frontType, f.upgradeLevel),
    0
  );
  const allMembers = [crew.leaderId, ...crew.memberIds];

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px', marginBottom: '8px', cursor: 'pointer',
        background: isPlayerCrew ? '#0d1400' : '#111',
        border: `1px solid ${isPlayerCrew ? '#2a3a00' : '#222'}`,
        borderRadius: '3px',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '12px', color: isPlayerCrew ? '#ccff33' : '#ccc', fontWeight: 700 }}>
            {crew.name}
            {isPlayerCrew && (
              <span style={{ marginLeft: '6px', fontSize: '9px', color: '#ccff33', background: '#1a2200', padding: '1px 5px', borderRadius: '2px', border: '1px solid #2a3a00' }}>
                YOUR CREW
              </span>
            )}
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
            Leader: <span style={{ color: '#aaa' }}>{getPlayerAlias(crew.leaderId)}</span>
            <span style={{ marginLeft: '4px', color: '#444' }}>({getPlayerRole(crew.leaderId)})</span>
          </div>
        </div>
        <span style={{
          fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
          background: crew.status === 'ACTIVE' ? '#0d1a0d' : '#1a0808',
          border: `1px solid ${crew.status === 'ACTIVE' ? '#1a3a1a' : '#3a1010'}`,
          color: crew.status === 'ACTIVE' ? '#4a9a4a' : '#cc3333',
          flexShrink: 0,
        }}>
          {crew.status}
        </span>
      </div>

      {/* Members */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {allMembers.map(pid => (
          <span key={pid} style={{
            fontSize: '9px', padding: '1px 5px', borderRadius: '2px',
            background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa',
          }}>
            {getPlayerAlias(pid)}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '10px', flexWrap: 'wrap' }}>
        <div>
          <span className="label-caps">Territory</span>
          <span style={{ color: '#818cf8', marginLeft: '4px' }}>
            {crew.territory.map(s => DISTRICT_LABEL[s] ?? s).join(', ')}
          </span>
        </div>
        <div>
          <span className="label-caps">Fronts</span>
          <span style={{ color: '#ccc', marginLeft: '4px' }}>{crewFronts.length}</span>
        </div>
        {totalIncome > 0 && (
          <div>
            <span className="label-caps">Income</span>
            <span style={{ color: '#ffcc33', marginLeft: '4px' }}>{fmt(totalIncome)}/day</span>
          </div>
        )}
        <div>
          <span className="label-caps">Members</span>
          <span style={{ color: '#ccc', marginLeft: '4px' }}>{allMembers.length}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function Crews() {
  const { player, gameRole } = useGame();
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const { toast } = useToast();

  const playerFamilyId = player.family_id;
  const playerCrewId = player.crew_id;

  // Show player's family crews first, then all others (DEV)
  const familyCrews = playerFamilyId ? getCrewsByFamily(playerFamilyId) : [];
  const otherCrews = MOCK_CREWS.filter(c => c.familyId !== playerFamilyId);

  const canCreateCrew = can(gameRole, 'PROMOTE_TO_UNDERBOSS'); // Underboss+

  function handleCreateCrew() {
    toast({ title: 'Crew Created', description: 'New crew established. (DEV: simulated)' });
  }

  return (
    <div>
      <PageHeader
        title="Family Crews"
        sub="Manage the street-level crews that run your territory"
        action={
          canCreateCrew ? (
            <button className="btn btn-primary" style={{ fontSize: '10px' }} onClick={handleCreateCrew}>
              + Create Crew
            </button>
          ) : undefined
        }
      />

      {!playerFamilyId && (
        <InfoAlert>
          You are not affiliated with a family. Join a family to manage crews.
        </InfoAlert>
      )}

      {/* Player's family crews */}
      {playerFamilyId && (
        <SectionPanel
          title={`Your Family Crews — ${familyCrews.length} crew${familyCrews.length !== 1 ? 's' : ''}`}
        >
          <div style={{ padding: '8px' }}>
            {familyCrews.length === 0 && (
              <EmptySlate msg="No crews yet." sub="Create a crew to organize your soldiers." />
            )}
            {familyCrews.map(crew => (
              <CrewCard
                key={crew.id}
                crew={crew}
                isPlayerCrew={crew.id === playerCrewId}
                onClick={() => setSelectedCrew(crew)}
              />
            ))}
          </div>
        </SectionPanel>
      )}

      {/* DEV: other families' crews */}
      <SectionPanel title="DEV — All Family Crews">
        <div style={{ padding: '4px 8px 4px', borderBottom: '1px solid #111' }}>
          <div style={{ fontSize: '9px', color: '#444', fontStyle: 'italic' }}>
            Dev view showing crews for all families. In production, rival crew details are hidden.
          </div>
        </div>
        <div style={{ padding: '8px' }}>
          {otherCrews.map(crew => (
            <CrewCard
              key={crew.id}
              crew={crew}
              isPlayerCrew={false}
              onClick={() => setSelectedCrew(crew)}
            />
          ))}
        </div>
      </SectionPanel>

      {/* Detail modal */}
      {selectedCrew && (
        <CrewDetailModal
          crew={selectedCrew}
          onClose={() => setSelectedCrew(null)}
        />
      )}
    </div>
  );
}
