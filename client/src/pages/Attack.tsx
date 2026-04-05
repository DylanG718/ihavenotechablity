/**
 * Attack.tsx — PvP attack screen.
 *
 * Tabs:
 *   ATTACK    — pick target, pick weapon, context, execute attack
 *   HISTORY   — recent incoming/outgoing attacks
 *   ASSAULT   — active coordinated assault status (family view)
 *
 * Defense layers shown for target before attacking.
 * Outcome modal with damage breakdown, heat added, layer state.
 *
 * CANON: Can only attack if you OWN a weapon (FISTS always available).
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_WEAPON_LOADOUTS, MOCK_ATTACK_HISTORY, MOCK_ASSAULTS, getDefenseProfile } from '../lib/pvpMockData';
import { resolveAttack, outcomeColor, outcomeLabel, fmt, weaponCategoryColor } from '../lib/pvpEngine';
import { WEAPONS as WEAPON_DEFS } from '../../../shared/pvp';
import type { WeaponId, AttackContext, AttackRecord, AttackOutcome, PlayerDefenseProfile } from '../../../shared/pvp';
import { MOCK_PLAYERS } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import { Swords, Shield, AlertTriangle, Clock, Users } from 'lucide-react';

// ─────────────────────────────────────────────
// Target defense preview
// ─────────────────────────────────────────────

function DefensePreview({ profile }: { profile: PlayerDefenseProfile }) {
  const totalHP = profile.layers.reduce((s, l) => s + l.current_hp, 0);
  const totalMax = profile.layers.reduce((s, l) => s + l.max_hp, 0) + profile.max_player_hp;

  return (
    <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '10px 12px', marginBottom: '10px' }}>
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0' }}>
          {profile.player_alias} — Defense Profile
        </span>
        <span style={{ fontSize: '9px', color: '#888' }}>
          {profile.is_home ? '🏠 At Home' : '🚶 Street'}
        </span>
      </div>

      {/* Layer bars */}
      {profile.layers.map((layer, i) => {
        const pct = layer.max_hp > 0 ? Math.round((layer.current_hp / layer.max_hp) * 100) : 0;
        return (
          <div key={layer.label} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '2px' }}>
              <span>{layer.label}</span>
              <span>{layer.current_hp}/{layer.max_hp} HP · Rating {layer.defense_rating}</span>
            </div>
            <div style={{ height: '5px', background: '#1a1a1a' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 50 ? '#4a9a4a' : pct > 20 ? '#cc9900' : '#cc3333' }} />
            </div>
          </div>
        );
      })}

      {/* Player HP */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '2px' }}>
          <span>Player HP (Final)</span>
          <span>{profile.player_hp}/{profile.max_player_hp}</span>
        </div>
        <div style={{ height: '5px', background: '#1a1a1a' }}>
          <div style={{ height: '100%', width: `${(profile.player_hp / profile.max_player_hp) * 100}%`, background: '#cc3333' }} />
        </div>
      </div>

      {profile.layers.length === 0 && (
        <div style={{ fontSize: '9px', color: '#cc9900', marginTop: '4px' }}>
          ⚠ No active defense layers — player HP is directly exposed.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Attack outcome modal
// ─────────────────────────────────────────────

function OutcomeModal({ resolution, onClose }: {
  resolution: ReturnType<typeof resolveAttack>;
  onClose: () => void;
}) {
  const color = outcomeColor(resolution.outcome);
  const label = outcomeLabel(resolution.outcome);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '460px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <span className="panel-title">Attack Outcome</span>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color, marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>{resolution.notes}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
            <tbody>
              {[
                ['Weapon',        resolution.weapon.name,                         '#e0e0e0'],
                ['Damage Dealt',  resolution.damage_dealt > 0 ? `${resolution.damage_dealt} HP` : '—', resolution.damage_dealt > 0 ? color : '#555'],
                ['Layer Hit',     resolution.layer_hit.replace(/_/g, ' '),         '#888'],
                ['Heat Added',    `+${resolution.heat_added}`,                    '#cc7700'],
                ['Suspicion',     `+${resolution.suspicion_added}`,               '#cc9900'],
                ['Family Alerted', resolution.family_alerted ? 'YES' : 'No',      resolution.family_alerted ? '#cc3333' : '#4a9a4a'],
              ].map(([l, v, c]) => (
                <tr key={String(l)}>
                  <td style={{ padding: '4px 0', color: '#888', borderBottom: '1px solid #1a1a1a' }}>{l}</td>
                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: c, textAlign: 'right', borderBottom: '1px solid #1a1a1a' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Updated defense layers */}
          <div style={{ marginBottom: '12px' }}>
            <p className="label-caps" style={{ marginBottom: '6px' }}>Updated Defense State</p>
            <DefensePreview profile={resolution.updated_profile} />
          </div>

          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '8px' }}
            data-testid="close-attack-outcome">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Attack history row
// ─────────────────────────────────────────────

function AttackHistoryRow({ record }: { record: AttackRecord }) {
  const color = outcomeColor(record.outcome);
  const isIncoming = record.target_id === 'p-boss'; // simplistic demo check
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontWeight: 'bold', color: isIncoming ? '#cc3333' : '#e0e0e0' }}>
          {isIncoming ? `← ${record.attacker_alias} attacked you` : `→ You attacked ${record.target_alias}`}
        </span>
        <span style={{ color, fontWeight: 'bold', fontSize: '9px' }}>{outcomeLabel(record.outcome)}</span>
      </div>
      <div style={{ color: '#888' }}>
        {WEAPON_DEFS[record.weapon_id]?.name} · {record.context} · {record.damage_dealt} dmg
        {record.coordinated_assault_id && (
          <span style={{ color: '#5580bb', marginLeft: '6px' }}>📋 Coordinated</span>
        )}
      </div>
      <div style={{ color: '#444', fontSize: '9px', marginTop: '2px' }}>
        {new Date(record.attacked_at).toLocaleString()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Coordinated assault status
// ─────────────────────────────────────────────

function AssaultStatus() {
  const assault = MOCK_ASSAULTS[0]; // active assault against rival boss
  const target = MOCK_PLAYERS['p-rival-boss'];
  const targetProfile = getDefenseProfile('p-rival-boss', true);

  return (
    <div>
      <InfoAlert>
        Coordinated assaults let multiple family members chip away at a target's layers over time.
        Each attack contributes damage to the shared assault record.
      </InfoAlert>

      <div className="panel" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#cc3333' }}>
              Active Assault: {target?.alias ?? assault.target_player_id}
            </div>
            <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
              {assault.attack_ids.length} attacks contributed · Currently targeting: {assault.current_layer.replace(/_/g,' ')}
            </div>
          </div>
          <span style={{ fontSize: '9px', color: '#cc9900', fontWeight: 'bold', border: '1px solid #4a3a00', padding: '2px 8px', height: 'fit-content' }}>
            {assault.status}
          </span>
        </div>

        <DefensePreview profile={targetProfile} />

        <div style={{ fontSize: '10px', color: '#aaa' }}>
          Total damage dealt: <strong style={{ color: '#ffcc33' }}>{assault.total_damage}</strong>
          <span style={{ color: '#555', marginLeft: '8px' }}>
            Last attack {new Date(assault.last_attack_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Attack page
// ─────────────────────────────────────────────

// Attackable targets (not own family, mock)
const TARGETS = [
  { id: 'p-rival-boss',   alias: 'Marco Ferrante',   role: 'BOSS',      family: 'The Ferrante Crew' },
  { id: 'p-rival-capo',   alias: 'Nico Russo',        role: 'CAPO',      family: 'The Ferrante Crew' },
  { id: 'p-hitman-1',     alias: 'The Iceman',        role: 'HITMAN',    family: 'Independent' },
];

export default function AttackPage() {
  const { player, gameRole, applyStatDeltas } = useGame();
  const [tab, setTab] = useState<'ATTACK' | 'HISTORY' | 'ASSAULT'>('ATTACK');

  // Attack form state
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [weaponId, setWeaponId] = useState<WeaponId>('PISTOL_9MM');
  const [context, setContext] = useState<AttackContext>('HOME');
  const [joinCoord, setJoinCoord] = useState(false);

  // Outcome
  const [resolution, setResolution] = useState<ReturnType<typeof resolveAttack> | null>(null);

  // My loadout
  const myLoadout = MOCK_WEAPON_LOADOUTS[player.id] ?? [{ weapon_id: 'FISTS' }];
  const equippedWeapons = myLoadout.filter(w => w.is_equipped_primary || w.is_equipped_secondary);
  const equippedIds = new Set(equippedWeapons.map(w => w.weapon_id));

  // Ensure selected weapon is owned
  const selectedWeaponDef = WEAPON_DEFS[weaponId];
  const targetProfile = getDefenseProfile(targetId, context === 'HOME');

  function handleAttack() {
    const result = resolveAttack({
      weapon_id: weaponId,
      attacker_stats: player.stats,
      target_profile: targetProfile,
      context,
      planning_bonus: 0,
    });
    applyStatDeltas({ heat: result.heat_added, suspicion: result.suspicion_added });
    setResolution(result);
  }

  return (
    <div>
      <PageHeader title="Attack" sub="PvP — must own weapon to attack. Defense layers must be depleted before HP." />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {([
          { id: 'ATTACK',  icon: <Swords size={11} />,  label: 'Attack' },
          { id: 'HISTORY', icon: <Clock size={11} />,   label: 'History' },
          { id: 'ASSAULT', icon: <Users size={11} />,   label: 'Coordinated' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── ATTACK tab ── */}
      {tab === 'ATTACK' && (
        <div>
          <InfoAlert>
            Attacks must deplete all defense layers before reaching player HP.
            Multiple family members can coordinate to strip a heavily defended target.
          </InfoAlert>

          {/* Target selector */}
          <SectionPanel title="Select Target">
            <div style={{ padding: '8px 12px' }}>
              {TARGETS.map(t => {
                const tProfile = getDefenseProfile(t.id, context === 'HOME');
                return (
                  <label key={t.id} style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    padding: '8px', marginBottom: '4px', cursor: 'pointer',
                    background: targetId === t.id ? '#1a0808' : '#181818',
                    border: `1px solid ${targetId === t.id ? '#cc3333' : '#2a2a2a'}`,
                  }}>
                    <input type="radio" name="target" value={t.id}
                      checked={targetId === t.id}
                      onChange={() => setTargetId(t.id)}
                      style={{ accentColor: '#cc3333' }}
                      data-testid={`target-${t.id}`}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>
                        {t.alias}
                        <span style={{ fontWeight: 'normal', fontSize: '9px', color: '#888', marginLeft: '6px' }}>
                          {t.role} · {t.family}
                        </span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                        Layers: {tProfile.layers.length} · Defense Rating: {tProfile.layers.reduce((s, l) => s + l.defense_rating, 0)}
                      </div>
                    </div>
                    <Shield size={12} style={{ color: '#888' }} />
                  </label>
                );
              })}
            </div>
          </SectionPanel>

          {/* Target defense preview */}
          <div className="section-title">Target Defense State</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button onClick={() => setContext('HOME')} className={`btn ${context === 'HOME' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
              🏠 Home Attack
            </button>
            <button onClick={() => setContext('STREET')} className={`btn ${context !== 'HOME' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
              🚶 Street Attack
            </button>
          </div>
          <DefensePreview profile={getDefenseProfile(targetId, context === 'HOME')} />

          {/* Weapon selector */}
          <SectionPanel title="Select Weapon">
            <div style={{ padding: '8px 12px' }}>
              <p style={{ fontSize: '9px', color: '#555', marginBottom: '8px' }}>
                Only weapons you own can be used. Equip from Armory to see them here first.
              </p>
              {myLoadout.map(w => {
                const def = WEAPON_DEFS[w.weapon_id];
                if (!def) return null;
                return (
                  <label key={w.weapon_id} style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    padding: '7px 8px', marginBottom: '4px', cursor: 'pointer',
                    background: weaponId === w.weapon_id ? '#0d1a0d' : '#181818',
                    border: `1px solid ${weaponId === w.weapon_id ? '#2a6a2a' : '#2a2a2a'}`,
                  }}>
                    <input type="radio" name="weapon" value={w.weapon_id}
                      checked={weaponId === w.weapon_id}
                      onChange={() => setWeaponId(w.weapon_id as WeaponId)}
                      style={{ accentColor: '#4a9a4a' }}
                      data-testid={`weapon-select-${w.weapon_id}`}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>
                        {def.name}
                        {w.is_equipped_primary && <span style={{ fontSize: '9px', color: '#ffcc33', marginLeft: '6px' }}>★ PRIMARY</span>}
                      </div>
                      <div style={{ fontSize: '9px', color: '#888' }}>
                        DMG {def.base_damage} · ACC {def.base_accuracy}% · Heat +{def.heat_on_use}
                        {w.ammo_remaining !== null && ` · ${w.ammo_remaining} ammo`}
                      </div>
                    </div>
                    <span style={{ fontSize: '9px', color: weaponCategoryColor(def.category) }}>{def.category}</span>
                  </label>
                );
              })}
            </div>
          </SectionPanel>

          {/* Coordinated assault option */}
          <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '10px 12px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '10px', color: '#aaa' }}>
              <input type="checkbox" checked={joinCoord} onChange={e => setJoinCoord(e.target.checked)}
                style={{ accentColor: '#5580bb' }} data-testid="join-coordinated" />
              Join family coordinated assault on this target
            </label>
            <p style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>
              Your damage will contribute to the shared assault record. Family members chip away layers together over time.
            </p>
          </div>

          {/* Attack button */}
          <button
            onClick={handleAttack}
            className="btn btn-danger"
            style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}
            data-testid="execute-attack"
          >
            ⚔ Attack {TARGETS.find(t => t.id === targetId)?.alias} with {selectedWeaponDef?.name}
          </button>

          {/* Heat warning for firearms */}
          {selectedWeaponDef?.creates_noise && (
            <div style={{ marginTop: '8px', padding: '6px 10px', background: '#1a0808', border: '1px solid #3a1010', fontSize: '9px', color: '#cc3333' }}>
              ⚠ Firearm attack creates noise. High heat on failure. Target's family will be alerted.
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY tab ── */}
      {tab === 'HISTORY' && (
        <div>
          <p style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>Recent attacks involving your family.</p>
          {MOCK_ATTACK_HISTORY.map(r => (
            <AttackHistoryRow key={r.id} record={r} />
          ))}
        </div>
      )}

      {/* ── ASSAULT tab ── */}
      {tab === 'ASSAULT' && <AssaultStatus />}

      {/* Outcome modal */}
      {resolution && <OutcomeModal resolution={resolution} onClose={() => setResolution(null)} />}
    </div>
  );
}
