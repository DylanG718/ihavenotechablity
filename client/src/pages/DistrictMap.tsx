/**
 * MafiaLife — District Map
 * Route: /districts
 * Mobile-first rewrite: page-stack + district cards with inline turf expand.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { fmt } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import {
  DISTRICTS,
  TURFS,
  BUSINESS_DEFINITIONS,
} from '../lib/worldConfig';
import {
  MOCK_DISTRICT_INFLUENCE,
  MOCK_FRONT_INSTANCES,
  FAMILY_NAMES,
  getDistrictInfluenceSorted,
  getDistrictController,
  calcFrontDailyIncome,
} from '../lib/worldSeed';
import type { DistrictInfluence } from '../../../shared/world';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const THEME_COLORS: Record<string, string> = {
  POLITICAL:   '#5580bb',
  MARITIME:    '#38bdf8',
  RESIDENTIAL: '#4a9a4a',
  INDUSTRIAL:  '#f59e0b',
  GAMBLING:    '#a855f7',
  SUBURBAN:    '#6b7280',
};

const THEME_LABELS: Record<string, string> = {
  POLITICAL:   'Political',
  MARITIME:    'Maritime',
  RESIDENTIAL: 'Residential',
  INDUSTRIAL:  'Industrial',
  GAMBLING:    'Gambling',
  SUBURBAN:    'Suburban',
};

const BONUS_LABELS: Record<string, string> = {
  CORRUPTION:   'Corruption Bonus',
  SMUGGLING:    'Smuggling Bonus',
  PROTECTION:   'Protection Bonus',
  CONSTRUCTION: 'Construction Bonus',
  GAMBLING:     'Gambling Bonus',
  NONE:         'No Special Bonus',
};

const FAMILY_COLORS: Record<string, string> = {
  'fam-1': '#ffcc33',
  'fam-2': '#cc3333',
  'fam-3': '#4a9a4a',
  'fam-4': '#5580bb',
  'fam-5': '#a855f7',
};

function getFamilyColor(familyId: string): string {
  return FAMILY_COLORS[familyId] ?? '#666';
}

function getInfluenceMaxScore(scores: DistrictInfluence[]): number {
  const max = Math.max(...scores.map(s => s.score), 100);
  return max;
}

// ─────────────────────────────────────────────
// District Card
// ─────────────────────────────────────────────

interface DistrictCardProps {
  district: {
    id: string;
    name: string;
    tagline: string;
    theme: string;
    influenceBonusType: string;
    displayOrder: number;
    slug: string;
  };
  playerFamilyId: string | null;
}

function DistrictCard({ district, playerFamilyId }: DistrictCardProps) {
  const [expanded, setExpanded] = useState(false);

  const districtTurfs = TURFS.filter(t => t.districtId === district.id);
  const ownedTurfs = districtTurfs.filter(t => t.familyId !== null);
  const districtFronts = MOCK_FRONT_INSTANCES.filter(f =>
    districtTurfs.some(t => t.id === f.turfId)
  );
  const totalDailyIncome = districtFronts.reduce(
    (sum, f) => sum + calcFrontDailyIncome(f.frontType, f.upgradeLevel),
    0
  );

  const influenceScores = getDistrictInfluenceSorted(district.id);
  const top3 = influenceScores.slice(0, 3);
  const maxScore = getInfluenceMaxScore(influenceScores);
  const controllerId = getDistrictController(district.id);
  const themeColor = THEME_COLORS[district.theme] ?? '#666';

  const playerInfluence = playerFamilyId
    ? influenceScores.find(s => s.familyId === playerFamilyId)
    : null;
  const playerRank = playerInfluence
    ? influenceScores.findIndex(s => s.familyId === playerFamilyId) + 1
    : null;

  return (
    <div className="district-card">
      {/* Header — tappable to show district detail */}
      <div className="district-card__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="district-card__title-row">
            <span className="district-card__name">{district.name}</span>
            <span style={{
              fontSize: '9px', padding: '1px 5px', borderRadius: '2px',
              background: themeColor + '22', color: themeColor, border: `1px solid ${themeColor}44`,
              fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
              flexShrink: 0,
            }}>
              {THEME_LABELS[district.theme]}
            </span>
            <span style={{
              fontSize: '9px', padding: '1px 5px', borderRadius: '2px',
              background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a',
              flexShrink: 0,
            }}>
              {BONUS_LABELS[district.influenceBonusType]}
            </span>
          </div>
          <div className="district-card__tagline">{district.tagline}</div>
        </div>
        <div className="district-card__right">
          <div
            className="district-card__controller"
            style={{ color: controllerId ? FAMILY_COLORS[controllerId] ?? '#ffcc33' : '#cc9900' }}
          >
            {controllerId ? `${FAMILY_NAMES[controllerId] ?? controllerId}` : 'CONTESTED'}
          </div>
          {playerFamilyId && playerRank && (
            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
              Your rank: #{playerRank}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="district-card__stats-row">
        <div className="district-card__stat">
          <span className="label-caps">Turfs</span>
          <span className="district-card__stat-val" style={{ marginLeft: '4px' }}>
            {ownedTurfs.length}/{districtTurfs.length}
          </span>
        </div>
        <div className="district-card__stat">
          <span className="label-caps">Fronts</span>
          <span className="district-card__stat-val" style={{ marginLeft: '4px' }}>{districtFronts.length}</span>
        </div>
        <div className="district-card__stat">
          <span className="label-caps">Income</span>
          <span style={{ marginLeft: '4px', color: '#ffcc33', fontWeight: 600, fontSize: '10px' }}>
            {totalDailyIncome > 0 ? `${fmt(totalDailyIncome)}/day` : '—'}
          </span>
        </div>
      </div>

      {/* Influence bars */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '9px', color: '#555', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
          Influence — Top Families
        </div>
        {top3.length === 0 && (
          <div style={{ fontSize: '10px', color: '#444' }}>No influence data</div>
        )}
        {top3.map(inf => {
          const pct = maxScore > 0 ? (inf.score / maxScore) * 100 : 0;
          const color = getFamilyColor(inf.familyId);
          const isController = inf.familyId === controllerId;
          const isPlayer = inf.familyId === playerFamilyId;
          return (
            <div key={inf.familyId} className="influence-bar">
              <div className="influence-bar__labels">
                <span className="influence-bar__family" style={{
                  color: isController ? color : '#aaa',
                  fontWeight: isController || isPlayer ? 600 : 400,
                }}>
                  {FAMILY_NAMES[inf.familyId] ?? inf.familyId}
                  {isController && <span style={{ marginLeft: '4px', fontSize: '9px', color }}>[CTRL]</span>}
                  {isPlayer && !isController && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#ffcc33' }}>[YOU]</span>}
                </span>
                <span className="influence-bar__score">{inf.score.toLocaleString()}</span>
              </div>
              <div className="influence-bar__track">
                <div className="influence-bar__fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* DEV influence debug — compact */}
      <div style={{ padding: '3px 14px', borderBottom: '1px solid #111', background: '#0d0d0d' }}>
        <div style={{ fontSize: '8px', color: '#333' }}>
          DEV: {influenceScores.map(i => `${FAMILY_NAMES[i.familyId] ?? i.familyId}: ${i.score}`).join(' | ')}
        </div>
      </div>

      {/* Expand / collapse turfs button */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="district-card__expand-btn"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide Turfs' : `View Turfs (${districtTurfs.length})`}
      </button>

      {/* Turf list — inline expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1a1a1a' }}>
          {districtTurfs.map(turf => {
            const turfFronts = MOCK_FRONT_INSTANCES.filter(f => f.turfId === turf.id);
            const turfIncome = turfFronts.reduce(
              (sum, f) => sum + calcFrontDailyIncome(f.frontType, f.upgradeLevel),
              0
            );
            const ownerName = turf.familyId ? (FAMILY_NAMES[turf.familyId] ?? turf.familyId) : 'Unowned';
            const ownerColor = turf.familyId ? (FAMILY_COLORS[turf.familyId] ?? '#666') : '#444';
            const isPlayerTurf = turf.familyId === playerFamilyId;
            return (
              <div key={turf.id} className="turf-row">
                <div className="turf-row__left">
                  <div className="turf-row__name">{turf.name}</div>
                  <div className="turf-row__meta">
                    <span>Slots: {turf.slotCount}</span>
                    <span>Fronts: {turfFronts.length}</span>
                    {turfIncome > 0 && <span style={{ color: '#ffcc33' }}>{fmt(turfIncome)}/day</span>}
                    <span style={{ color: '#555' }}>{turf.qualityTier}</span>
                  </div>
                  {turfFronts.length > 0 && (
                    <div className="turf-row__fronts">
                      {turfFronts.map(f => {
                        const def = BUSINESS_DEFINITIONS.find(b => b.id === f.frontType);
                        return (
                          <span key={f.id} style={{
                            fontSize: '9px', padding: '1px 4px', borderRadius: '2px',
                            background: '#1a1a1a', border: '1px solid #333', color: '#aaa',
                          }}>
                            {def?.displayName ?? f.frontType} Lv{f.upgradeLevel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="turf-row__right">
                  <div className="turf-row__owner" style={{ color: ownerColor }}>{ownerName}</div>
                  {isPlayerTurf && (
                    <a href="#/family/turf" style={{ fontSize: '9px', color: '#cc3333', display: 'block', marginTop: '3px' }}>Manage →</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function DistrictMap() {
  const { player } = useGame();
  const playerFamilyId = player.family_id;

  const sortedDistricts = [...DISTRICTS].sort((a, b) => a.displayOrder - b.displayOrder);

  const totalTurfs = TURFS.length;
  const ownedTurfs = TURFS.filter(t => t.familyId !== null).length;
  const totalFronts = MOCK_FRONT_INSTANCES.length;

  // Player family summary
  const playerDistrictRanks = playerFamilyId
    ? sortedDistricts.map(d => {
        const sorted = getDistrictInfluenceSorted(d.id);
        const rank = sorted.findIndex(s => s.familyId === playerFamilyId) + 1;
        return { districtName: d.name, rank: rank > 0 ? rank : null };
      })
    : [];

  return (
    <div className="page-stack">
      <PageHeader
        title="City Districts"
        sub="District influence, turf control, and front income across the city"
      />

      {/* Summary bar */}
      <div className="summary-bar">
        {[
          { l: 'Districts', v: String(sortedDistricts.length) },
          { l: 'Turfs Owned', v: `${ownedTurfs} / ${totalTurfs}` },
          { l: 'Active Fronts', v: String(totalFronts) },
        ].map(({ l, v }) => (
          <div key={l} className="summary-bar__item">
            <span className="summary-bar__label">{l}</span>
            <span className="summary-bar__val">{v}</span>
          </div>
        ))}
      </div>

      {/* Player family influence summary — chip-bar style */}
      {playerFamilyId && (
        <div className="compact-card">
          <div className="compact-card__header">
            <span className="compact-card__title">Your Family — District Influence</span>
          </div>
          <div style={{ padding: '8px 12px' }}>
            <div className="chip-bar">
              {playerDistrictRanks.map(({ districtName, rank }) => (
                <div key={districtName} style={{
                  padding: '4px 10px', borderRadius: '14px', fontSize: '10px',
                  background: rank === 1 ? '#1a1500' : '#111',
                  border: `1px solid ${rank === 1 ? '#3a2a00' : '#222'}`,
                  color: rank === 1 ? '#ffcc33' : '#666',
                  flexShrink: 0,
                  whiteSpace: 'nowrap' as const,
                }}>
                  {districtName}: {rank ? `#${rank}` : 'None'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Districts */}
      {sortedDistricts.map(district => (
        <DistrictCard
          key={district.id}
          district={district}
          playerFamilyId={playerFamilyId}
        />
      ))}

      <div style={{ fontSize: '9px', color: '#333', marginTop: '4px', fontStyle: 'italic', textAlign: 'center' }}>
        DEV: Influence scores are pre-calculated mock data. Formula: turfs×100 + fronts×50×upgradeLevel + staffed×10
      </div>
    </div>
  );
}
