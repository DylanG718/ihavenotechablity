/**
 * Armory.tsx — Weapons loadout screen.
 *
 * Shows:
 *   - Player's current weapons with ammo + equipped status
 *   - Full weapon catalog to buy (melee + firearms, sorted by tier)
 *   - Equip primary / secondary from owned weapons
 *   - Heat rating and noise indicator per weapon
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_WEAPON_LOADOUTS } from '../lib/pvpMockData';
import { weaponCategoryColor, heatRating, fmt } from '../lib/pvpEngine';
import { WEAPONS as WEAPON_DEFS } from '../../../shared/pvp';
import type { WeaponId, PlayerWeapon } from '../../../shared/pvp';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import { Volume2, VolumeX } from 'lucide-react';

const ALL_WEAPONS = Object.values(WEAPON_DEFS);

function HeatDot({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' }) {
  const colors: Record<string, string> = {
    LOW: '#4a9a4a', MEDIUM: '#cc9900', HIGH: '#cc7700', EXTREME: '#cc3333',
  };
  return (
    <span style={{
      fontSize: '9px', fontWeight: 'bold', color: colors[level],
      border: `1px solid ${colors[level]}44`, padding: '1px 5px',
    }}>
      {level} HEAT
    </span>
  );
}

function WeaponCard({ weapon, owned, onBuy, onEquip }: {
  weapon: typeof WEAPON_DEFS[WeaponId];
  owned: PlayerWeapon | null;
  onBuy: () => void;
  onEquip: (slot: 'primary' | 'secondary') => void;
}) {
  const catColor = weaponCategoryColor(weapon.category);
  const heat = heatRating(weapon);

  return (
    <div style={{
      border: `1px solid ${owned ? '#2a4a2a' : '#2a2a2a'}`,
      background: owned ? '#0d1a0d' : '#181818',
      padding: '10px 12px', marginBottom: '6px',
    }} data-testid={`weapon-card-${weapon.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>{weapon.name}</span>
            <span style={{ fontSize: '9px', color: catColor, border: `1px solid ${catColor}44`, padding: '1px 5px' }}>
              {weapon.category}
            </span>
            {weapon.creates_noise && (
              <span title="Creates noise — witnesses likely">
                <Volume2 size={10} style={{ color: '#cc3333' }} />
              </span>
            )}
            {!weapon.creates_noise && (
              <span title="Silent weapon">
                <VolumeX size={10} style={{ color: '#4a9a4a' }} />
              </span>
            )}
          </div>
          <p style={{ fontSize: '9px', color: '#666', margin: '0 0 5px 0' }}>{weapon.description}</p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: '#aaa', flexWrap: 'wrap' }}>
            <span>DMG: <strong style={{ color: '#e0e0e0' }}>{weapon.base_damage}</strong></span>
            <span>ACC: <strong style={{ color: '#e0e0e0' }}>{weapon.base_accuracy}%</strong></span>
            {weapon.ammo_capacity && <span>Ammo: <strong style={{ color: '#e0e0e0' }}>{weapon.ammo_capacity}</strong></span>}
            {weapon.upkeep > 0 && <span>Upkeep: <strong style={{ color: '#cc9900' }}>{fmt(weapon.upkeep)}/wk</strong></span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
          <div style={{ marginBottom: '4px' }}>
            <HeatDot level={heat} />
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffcc33' }}>
            {weapon.cost === 0 ? 'Free' : fmt(weapon.cost)}
          </div>
        </div>
      </div>

      {/* Owned status + actions */}
      {owned ? (
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '6px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {owned.is_equipped_primary && (
              <span style={{ fontSize: '9px', color: '#ffcc33', fontWeight: 'bold', border: '1px solid #4a3a00', padding: '1px 6px' }}>
                ★ PRIMARY
              </span>
            )}
            {owned.is_equipped_secondary && (
              <span style={{ fontSize: '9px', color: '#5580bb', fontWeight: 'bold', border: '1px solid #1e2840', padding: '1px 6px' }}>
                ◆ SECONDARY
              </span>
            )}
            {owned.ammo_remaining !== null && (
              <span style={{ fontSize: '9px', color: owned.ammo_remaining < 3 ? '#cc3333' : '#888' }}>
                Ammo: {owned.ammo_remaining}/{weapon.ammo_capacity}
              </span>
            )}
            {!owned.is_equipped_primary && (
              <button onClick={() => onEquip('primary')} className="btn btn-ghost"
                style={{ fontSize: '9px', padding: '2px 8px' }}
                data-testid={`equip-primary-${weapon.id}`}>
                Set Primary
              </button>
            )}
            {!owned.is_equipped_secondary && (
              <button onClick={() => onEquip('secondary')} className="btn btn-ghost"
                style={{ fontSize: '9px', padding: '2px 8px' }}
                data-testid={`equip-secondary-${weapon.id}`}>
                Set Secondary
              </button>
            )}
          </div>
        </div>
      ) : (
        <button onClick={onBuy} className="btn btn-primary"
          style={{ width: '100%', padding: '6px', marginTop: '6px', fontSize: '10px' }}
          data-testid={`buy-weapon-${weapon.id}`}
          disabled={weapon.cost === 0}>
          {weapon.cost === 0 ? 'Always Available' : `Buy — ${fmt(weapon.cost)}`}
        </button>
      )}
    </div>
  );
}

export default function ArmoryPage() {
  const { player } = useGame();
  const [loadout, setLoadout] = useState<PlayerWeapon[]>(
    MOCK_WEAPON_LOADOUTS[player.id] ?? [{ weapon_id: 'FISTS', quantity: 1, ammo_remaining: null, is_equipped_primary: true, is_equipped_secondary: false, purchased_at: new Date().toISOString() }]
  );
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MELEE' | 'FIREARM'>('ALL');
  const [boughtMsg, setBoughtMsg] = useState<string | null>(null);

  const ownedIds = new Set(loadout.map(w => w.weapon_id));
  const equipped = loadout.find(w => w.is_equipped_primary);
  const secondary = loadout.find(w => w.is_equipped_secondary);

  function handleBuy(wid: WeaponId) {
    const def = WEAPON_DEFS[wid];
    setLoadout(prev => [...prev, {
      weapon_id: wid, quantity: 1,
      ammo_remaining: def.ammo_capacity,
      is_equipped_primary: false, is_equipped_secondary: false,
      purchased_at: new Date().toISOString(),
    }]);
    setBoughtMsg(`${def.name} purchased.`);
    setTimeout(() => setBoughtMsg(null), 3000);
  }

  function handleEquip(wid: WeaponId, slot: 'primary' | 'secondary') {
    setLoadout(prev => prev.map(w => ({
      ...w,
      is_equipped_primary:   slot === 'primary'   ? w.weapon_id === wid : w.is_equipped_primary && w.weapon_id !== wid,
      is_equipped_secondary: slot === 'secondary' ? w.weapon_id === wid : w.is_equipped_secondary && w.weapon_id !== wid,
    })));
  }

  const catalogWeapons = ALL_WEAPONS.filter(w =>
    categoryFilter === 'ALL' || w.category === categoryFilter
  );

  return (
    <div>
      <PageHeader title="Armory" sub="Weapons loadout — equip before attacking." />

      {/* Current loadout summary */}
      <SectionPanel title="Active Loadout">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px' }}>
          {[
            { label: 'Primary', weapon: equipped },
            { label: 'Secondary', weapon: secondary },
          ].map(({ label, weapon }) => (
            <div key={label} style={{ background: '#111', border: '1px solid #2a2a2a', padding: '8px 10px' }}>
              <div className="label-caps">{label}</div>
              {weapon ? (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0', marginTop: '3px' }}>
                    {WEAPON_DEFS[weapon.weapon_id].name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                    DMG {WEAPON_DEFS[weapon.weapon_id].base_damage} · ACC {WEAPON_DEFS[weapon.weapon_id].base_accuracy}%
                    {weapon.ammo_remaining !== null && ` · ${weapon.ammo_remaining} ammo`}
                  </div>
                  <HeatDot level={heatRating(WEAPON_DEFS[weapon.weapon_id])} />
                </>
              ) : (
                <div style={{ color: '#555', fontSize: '10px', marginTop: '4px' }}>None equipped</div>
              )}
            </div>
          ))}
        </div>
        {/* Owned weapons count */}
        <div style={{ padding: '6px 12px', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#555' }}>
          {loadout.length} weapon{loadout.length !== 1 ? 's' : ''} in inventory
        </div>
      </SectionPanel>

      {boughtMsg && (
        <div style={{ background: '#0a1a0a', border: '1px solid #2a4a2a', padding: '8px 12px', marginBottom: '10px', fontSize: '10px', color: '#4a9a4a' }}>
          ✓ {boughtMsg}
        </div>
      )}

      {/* Catalog filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {(['ALL', 'MELEE', 'FIREARM'] as const).map(f => (
          <button key={f} onClick={() => setCategoryFilter(f)}
            className={`btn ${categoryFilter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '10px' }}>
            {f === 'ALL' ? 'All Weapons' : f === 'MELEE' ? '🥊 Melee' : '🔫 Firearms'}
          </button>
        ))}
      </div>

      {/* Weapon catalog */}
      <div className="section-title">Weapon Catalog</div>
      {catalogWeapons.map(w => (
        <WeaponCard
          key={w.id}
          weapon={w}
          owned={loadout.find(l => l.weapon_id === w.id) ?? null}
          onBuy={() => handleBuy(w.id)}
          onEquip={(slot) => handleEquip(w.id, slot)}
        />
      ))}
    </div>
  );
}
