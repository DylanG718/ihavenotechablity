/**
 * Families Directory Screen
 * Scouting-level info only — no sensitive internal data exposed.
 * Browse, filter, view profile, request recruit.
 */

import { useState } from 'react';
import { MOCK_FAMILY_DIRECTORY } from '../lib/economyMockData';
import { fmt } from '../lib/mockData';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import type { FamilyDirectoryEntry, FamilyTier, FamilySizeBand } from '../../../shared/economy';
import { MOCK_POLITICAL_TAGS, FAM_CORRADO, FAM_FERRANTE, FAM_WESTSIDE } from '../lib/diplomacyMockData';
import { useGame } from '../lib/gameContext';
import { AlertTriangle, Shield } from 'lucide-react';

// Map directory family names to our diplomacy family IDs
const DIR_TO_FAM_ID: Record<string, string> = {
  'The Corrado Family': FAM_CORRADO,
  'The Ferrante Crew':  FAM_FERRANTE,
  'West Side Outfit':   FAM_WESTSIDE,
};

/** Inline political tags for family cards — only shown to affiliated players */
function DirectoryPoliticalTags({ familyName, viewerHasFamily }: { familyName: string; viewerHasFamily: boolean }) {
  if (!viewerHasFamily) return null;
  const famId = DIR_TO_FAM_ID[familyName];
  if (!famId) return null;
  const tags = MOCK_POLITICAL_TAGS[famId] ?? [];
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px' }}>
      {tags.slice(0, 2).map(tag => (
        <span key={tag.id} title={tag.description} style={{
          fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '1px 5px', border: '1px solid',
          color: tag.is_negative ? '#cc3333' : '#4a9a4a',
          borderColor: tag.is_negative ? '#3a1010' : '#1a3a1a',
          background: tag.is_negative ? '#1a0808' : '#0a1a0a',
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          cursor: 'help',
        }}>
          {tag.is_negative ? <AlertTriangle size={8} /> : <Shield size={8} />}
          {tag.label}
        </span>
      ))}
    </div>
  );
}

const TIER_COLOR: Record<FamilyTier, string> = {
  RISING: '#888', ESTABLISHED: '#5580bb', DOMINANT: '#cc9900', LEGENDARY: '#cc3333',
};
const AGGRESSION_COLOR: Record<string, string> = {
  PEACEFUL: '#4a9a4a', MODERATE: '#cc9900', AGGRESSIVE: '#cc7700', WARMONGER: '#cc3333',
};
const PLAYSTYLE_LABELS: Record<string, string> = {
  BUSINESS_FOCUSED: 'Business', WAR_FOCUSED: 'War', BALANCED: 'Balanced',
  STEALTH: 'Stealth', POLITICAL: 'Political',
};
const SIZE_LABELS: Record<FamilySizeBand, string> = {
  SMALL: 'Small (1–5)', MEDIUM: 'Medium (6–15)', LARGE: 'Large (16–30)', EMPIRE: 'Empire (30+)',
};

function TierBadge({ tier, label }: { tier: FamilyTier; label?: string }) {
  return (
    <span style={{ fontSize: '9px', color: TIER_COLOR[tier], border: `1px solid ${TIER_COLOR[tier]}`, padding: '1px 5px', fontFamily: 'Verdana, sans-serif', fontWeight: 'bold' }}>
      {label ?? tier}
    </span>
  );
}

function FamilyProfile({ entry, onClose }: { entry: FamilyDirectoryEntry; onClose: () => void }) {
  const [requested, setRequested] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#ffcc33' }}>{entry.name}</span>
            <span style={{ color: '#888', marginLeft: '8px', fontSize: '10px' }}>Don: {entry.don_alias}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px' }}>✕</button>
        </div>

        <div style={{ padding: '14px' }}>
          {/* Tagline */}
          <div style={{ background: '#1a0d0d', border: '1px solid #3a1010', padding: '8px 10px', marginBottom: '12px', fontSize: '11px', color: '#cc9900', fontStyle: 'italic' }}>
            "{entry.tagline}"
          </div>

          {/* Scouting stats */}
          <div className="ml-grid-4" style={{ marginBottom: '12px' }}>
            {[
              { l: 'Strength',   v: <TierBadge tier={entry.strength_tier} /> },
              { l: 'Wealth',     v: <TierBadge tier={entry.wealth_tier} /> },
              { l: 'Reputation', v: <TierBadge tier={entry.reputation_tier} /> },
              { l: 'Aggression', v: <span style={{ fontSize: '9px', color: AGGRESSION_COLOR[entry.aggression_tier], fontWeight: 'bold' }}>{entry.aggression_tier}</span> },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#181818', border: '1px solid #1a1a1a', padding: '6px 8px' }}>
                <div className="label-caps">{l}</div>
                <div style={{ marginTop: '3px' }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="ml-grid-3" style={{ marginBottom: '12px' }}>
            {[
              { l: 'Size',        v: SIZE_LABELS[entry.size_band] },
              { l: 'Members',     v: `~${entry.member_count}` },
              { l: 'Territory',   v: entry.territory_count },
              { l: 'Businesses',  v: entry.business_count },
              { l: 'Round Wins',  v: entry.wins_this_round },
              { l: 'Founded',     v: `Round ${entry.founded_round}` },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#181818', border: '1px solid #1a1a1a', padding: '6px 8px' }}>
                <div className="label-caps">{l}</div>
                <div style={{ fontSize: '11px', color: '#e0e0e0', marginTop: '2px' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Playstyle tags */}
          <div style={{ marginBottom: '12px' }}>
            <div className="label-caps" style={{ marginBottom: '5px' }}>Playstyle</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {entry.playstyle_tags.map(t => (
                <span key={t} className="badge-blue">{PLAYSTYLE_LABELS[t] ?? t}</span>
              ))}
            </div>
          </div>

          {/* Note: scouting level only */}
          <div style={{ fontSize: '9px', color: '#444', borderTop: '1px solid #1a1a1a', paddingTop: '8px', marginBottom: '12px' }}>
            This is scouting-level information. Internal details (treasury balance, full member list, strategy) are not exposed in the directory.
          </div>

          {/* Recruit request */}
          {entry.recruiting_open ? (
            <button
              onClick={() => setRequested(true)}
              disabled={requested}
              className={`btn ${requested ? 'btn-ghost' : 'btn-primary'} w-full`}
              style={{ width: '100%', padding: '8px', fontSize: '11px' }}
              data-testid={`request-join-${entry.id}`}
            >
              {requested ? 'Request Sent — Awaiting Response' : 'Request to Join as Recruit'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#cc3333', padding: '8px', border: '1px solid #3a1010', background: '#1a0808' }}>
              This family is not currently recruiting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DirectoryScreen() {
  const [search, setSearch]             = useState('');
  const [sizeFilter, setSizeFilter]     = useState<FamilySizeBand | 'ALL'>('ALL');
  const [recruitFilter, setRecruitFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [selected, setSelected]         = useState<FamilyDirectoryEntry | null>(null);
  const { player } = useGame();
  const viewerHasFamily = !!player.family_id;

  const filtered = MOCK_FAMILY_DIRECTORY.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.don_alias.toLowerCase().includes(search.toLowerCase())) return false;
    if (sizeFilter !== 'ALL' && f.size_band !== sizeFilter) return false;
    if (recruitFilter === 'OPEN'   && !f.recruiting_open) return false;
    if (recruitFilter === 'CLOSED' && f.recruiting_open) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Families Directory"
        sub="Scouting-level public information. No sensitive data exposed."
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or don..."
          className="game-input"
          style={{ width: '200px' }}
          data-testid="dir-search"
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['ALL','SMALL','MEDIUM','LARGE','EMPIRE'] as const).map(s => (
            <button key={s} onClick={() => setSizeFilter(s)} className={`btn ${sizeFilter === s ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '9px', flexShrink: 0 }}>
              {s === 'ALL' ? 'All Sizes' : SIZE_LABELS[s as FamilySizeBand].split(' ')[0]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['ALL','OPEN','CLOSED'] as const).map(r => (
            <button key={r} onClick={() => setRecruitFilter(r)} className={`btn ${recruitFilter === r ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '9px', flexShrink: 0 }}>
              {r === 'ALL' ? 'Any Status' : r === 'OPEN' ? 'Recruiting' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        {[
          { l: 'Total Families', v: MOCK_FAMILY_DIRECTORY.length },
          { l: 'Recruiting',     v: MOCK_FAMILY_DIRECTORY.filter(f => f.recruiting_open).length },
          { l: 'Dominant+',      v: MOCK_FAMILY_DIRECTORY.filter(f => ['DOMINANT','LEGENDARY'].includes(f.strength_tier)).length },
          { l: 'At War',         v: MOCK_FAMILY_DIRECTORY.filter(f => f.aggression_tier === 'WARMONGER').length },
        ].map(({ l, v }) => (
          <div key={l} className="panel" style={{ padding: '8px 10px' }}>
            <div className="label-caps">{l}</div>
            <div className="stat-val">{v}</div>
          </div>
        ))}
      </div>

      <SectionPanel title="Families" right={`${filtered.length} found`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Family</th>
                <th>Don</th>
                <th>Size</th>
                <th>Members</th>
                <th>Strength</th>
                <th>Wealth</th>
                <th>Aggression</th>
                <th>Playstyle</th>
                <th>Territory</th>
                <th>Recruiting</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} onClick={() => setSelected(f)} style={{ cursor: 'pointer' }} data-testid={`dir-row-${f.id}`}>
                  <td style={{ fontWeight: 'bold', color: '#ffcc33', whiteSpace: 'nowrap' }}>
                    {f.name}
                    <DirectoryPoliticalTags familyName={f.name} viewerHasFamily={viewerHasFamily} />
                  </td>
                  <td style={{ color: '#aaa' }}>{f.don_alias}</td>
                  <td style={{ color: '#888', fontSize: '9px' }}>{f.size_band}</td>
                  <td>~{f.member_count}</td>
                  <td><TierBadge tier={f.strength_tier} /></td>
                  <td><TierBadge tier={f.wealth_tier} /></td>
                  <td style={{ color: AGGRESSION_COLOR[f.aggression_tier], fontSize: '9px', fontWeight: 'bold' }}>{f.aggression_tier}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                      {f.playstyle_tags.slice(0, 2).map(t => (
                        <span key={t} style={{ fontSize: '8px', color: '#5580bb', border: '1px solid #254060', padding: '0 3px' }}>{PLAYSTYLE_LABELS[t]}</span>
                      ))}
                    </div>
                  </td>
                  <td>{f.territory_count}</td>
                  <td>
                    {f.recruiting_open
                      ? <span className="badge-green">Open</span>
                      : <span className="badge-gray">Closed</span>
                    }
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{f.wins_this_round}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: '#555', padding: '20px' }}>No families match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 8px', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#444', fontFamily: 'Verdana, sans-serif' }}>
          Click any row to view family profile. Scouting info only — no internal data exposed.
        </div>
      </SectionPanel>

      {selected && <FamilyProfile entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
