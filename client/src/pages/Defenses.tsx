/**
 * Defenses.tsx — Bodyguards and home defense management.
 *
 * Shows:
 *   - Layered defense stack with HP bars (visual + numeric)
 *   - Bodyguard roster (hire / see status / injured warning)
 *   - Home defense installations (buy / see damage)
 *   - Total defense rating summary
 *   - "How many attackers needed" estimate
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_BODYGUARDS, MOCK_HOME_DEFENSES, getDefenseProfile } from '../lib/pvpMockData';
import { totalDefenseRating, activeLayerIndex, fmt, computeDefenseProfile } from '../lib/pvpEngine';
import { BODYGUARD_DEFS, HOME_DEFENSE_DEFS } from '../../../shared/pvp';
import type { BodyguardTier, HomeDefenseId, PlayerBodyguard, PlayerHomeDefense } from '../../../shared/pvp';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import { Shield, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';

// ─── Defense layer HP bar ──────────────────────
function LayerBar({ label, current, max, rating, isCurrent }: {
  label: string; current: number; max: number; rating: number; isCurrent: boolean;
}) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const color = pct > 60 ? '#4a9a4a' : pct > 30 ? '#cc9900' : '#cc3333';
  return (
    <div style={{
      border: `1px solid ${isCurrent ? '#cc3333' : '#2a2a2a'}`,
      background: isCurrent ? '#1a0808' : '#181818',
      padding: '10px 12px', marginBottom: '6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isCurrent && <span style={{ fontSize: '9px', color: '#cc3333', fontWeight: 'bold' }}>← ACTIVE TARGET</span>}
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: isCurrent ? '#cc3333' : '#e0e0e0' }}>{label}</span>
        </div>
        <span style={{ fontSize: '10px', color: '#888' }}>{current}/{max} HP · Rating {rating}</span>
      </div>
      <div style={{ height: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', marginBottom: '4px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: '9px', color: '#555' }}>{pct}% integrity</div>
    </div>
  );
}

// ─── Bodyguard row ─────────────────────────────
function BodyguardRow({ guard, onHeal }: {
  guard: PlayerBodyguard;
  onHeal: () => void;
}) {
  const def = BODYGUARD_DEFS[guard.tier];
  const pct = Math.round((guard.current_hp / def.max_hp) * 100);
  const statusColor = guard.status === 'ACTIVE' ? '#4a9a4a' : guard.status === 'INJURED' ? '#cc9900' : '#cc3333';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>{def.name}</span>
          <span style={{ fontSize: '9px', color: statusColor, border: `1px solid ${statusColor}44`, padding: '1px 5px' }}>
            {guard.status}
          </span>
        </div>
        <div style={{ height: '5px', background: '#1a1a1a', width: '120px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: statusColor }} />
        </div>
        <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
          {guard.current_hp}/{def.max_hp} HP · Rating {guard.status === 'INJURED' ? Math.floor(def.defense_rating * 0.5) : def.defense_rating}
          {guard.status === 'INJURED' && <span style={{ color: '#cc9900' }}> (−50% injured)</span>}
        </div>
      </div>
      {guard.status === 'INJURED' && (
        <button onClick={onHeal} className="btn btn-ghost"
          style={{ fontSize: '9px', padding: '3px 8px' }}
          data-testid={`heal-guard-${guard.id}`}>
          Heal ${fmt(10000)}
        </button>
      )}
    </div>
  );
}

// ─── Home defense row ──────────────────────────
function HomeDefenseRow({ inst, onRepair }: {
  inst: PlayerHomeDefense;
  onRepair: () => void;
}) {
  const def = HOME_DEFENSE_DEFS[inst.defense_id];
  const pct = Math.round((inst.current_hp / def.max_hp) * 100);
  const statusColor = inst.status === 'ACTIVE' ? '#4a9a4a' : inst.status === 'DAMAGED' ? '#cc9900' : '#cc3333';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>{def.name}</span>
          <span style={{ fontSize: '9px', color: statusColor, border: `1px solid ${statusColor}44`, padding: '1px 5px' }}>
            {inst.status}
          </span>
        </div>
        <div style={{ height: '5px', background: '#1a1a1a', width: '120px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: statusColor }} />
        </div>
        <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
          {inst.current_hp}/{def.max_hp} HP · Rating {def.defense_rating}
        </div>
      </div>
      {inst.status !== 'ACTIVE' && (
        <button onClick={onRepair} className="btn btn-ghost"
          style={{ fontSize: '9px', padding: '3px 8px' }}
          data-testid={`repair-defense-${inst.defense_id}`}>
          Repair {fmt(def.repair_cost)}
        </button>
      )}
    </div>
  );
}

// ─── Shop ──────────────────────────────────────
function DefenseShop({ onBuyBodyguard, onBuyHomeDefense }: {
  onBuyBodyguard: (tier: BodyguardTier) => void;
  onBuyHomeDefense: (id: HomeDefenseId) => void;
}) {
  const [tab, setTab] = useState<'GUARDS' | 'HOME'>('GUARDS');
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        <button onClick={() => setTab('GUARDS')} className={`btn ${tab === 'GUARDS' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
          Bodyguards
        </button>
        <button onClick={() => setTab('HOME')} className={`btn ${tab === 'HOME' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
          Home Defenses
        </button>
      </div>

      {tab === 'GUARDS' && Object.values(BODYGUARD_DEFS).map(def => (
        <div key={def.tier} style={{ border: '1px solid #2a2a2a', background: '#181818', padding: '10px 12px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>{def.name}</span>
              <span style={{ fontSize: '9px', color: '#888', marginLeft: '8px' }}>{def.tier}</span>
            </div>
            <span style={{ fontWeight: 'bold', color: '#ffcc33' }}>{fmt(def.cost)}</span>
          </div>
          <p style={{ fontSize: '9px', color: '#888', marginBottom: '6px' }}>{def.description}</p>
          <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '6px', display: 'flex', gap: '12px' }}>
            <span>Defense: <strong style={{ color: '#e0e0e0' }}>{def.defense_rating}</strong></span>
            <span>HP: <strong style={{ color: '#e0e0e0' }}>{def.max_hp}</strong></span>
            <span>Upkeep: <strong style={{ color: '#cc9900' }}>{fmt(def.weekly_upkeep)}/wk</strong></span>
          </div>
          <button onClick={() => onBuyBodyguard(def.tier)} className="btn btn-primary"
            style={{ width: '100%', padding: '6px', fontSize: '10px' }}
            data-testid={`buy-guard-${def.tier}`}>
            Hire — {fmt(def.cost)}
          </button>
        </div>
      ))}

      {tab === 'HOME' && Object.values(HOME_DEFENSE_DEFS).map(def => (
        <div key={def.id} style={{ border: '1px solid #2a2a2a', background: '#181818', padding: '10px 12px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>{def.name}</span>
            <span style={{ fontWeight: 'bold', color: '#ffcc33' }}>{fmt(def.cost)}</span>
          </div>
          <p style={{ fontSize: '9px', color: '#888', marginBottom: '6px' }}>{def.description}</p>
          <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '6px', display: 'flex', gap: '12px' }}>
            <span>Rating: <strong style={{ color: '#e0e0e0' }}>{def.defense_rating}</strong></span>
            <span>HP: <strong style={{ color: '#e0e0e0' }}>{def.max_hp}</strong></span>
          </div>
          <button onClick={() => onBuyHomeDefense(def.id)} className="btn btn-primary"
            style={{ width: '100%', padding: '6px', fontSize: '10px' }}
            data-testid={`buy-defense-${def.id}`}>
            Install — {fmt(def.cost)}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function DefensesPage() {
  const { player } = useGame();
  const [isHome, setIsHome] = useState(true);
  const [bodyguards, setBodyguards] = useState(MOCK_BODYGUARDS[player.id] ?? []);
  const [homeDefs, setHomeDefs] = useState(MOCK_HOME_DEFENSES[player.id] ?? []);
  const [boughtMsg, setBoughtMsg] = useState<string | null>(null);

  // Recompute defense profile with live local state
  const liveProfile = computeDefenseProfile({
    player_id: player.id,
    player_alias: player.alias,
    role: player.family_role ?? 'UNAFFILIATED',
    player_hp: player.stats.hp,
    max_player_hp: 100,
    is_home: isHome,
    bodyguards,
    home_defenses: isHome ? homeDefs : [],
  });

  const activeIdx = activeLayerIndex(liveProfile);
  const totalRating = totalDefenseRating(liveProfile);

  function handleBuyBodyguard(tier: BodyguardTier) {
    const def = BODYGUARD_DEFS[tier];
    setBodyguards(prev => [...prev, {
      id: `bg-new-${Date.now()}`,
      player_id: player.id, tier,
      current_hp: def.max_hp,
      status: 'ACTIVE',
      hired_at: new Date().toISOString(),
    }]);
    setBoughtMsg(`${def.name} hired.`);
    setTimeout(() => setBoughtMsg(null), 3000);
  }

  function handleBuyHomeDefense(id: HomeDefenseId) {
    const def = HOME_DEFENSE_DEFS[id];
    setHomeDefs(prev => [...prev, {
      id: `hd-new-${Date.now()}`,
      player_id: player.id, defense_id: id,
      current_hp: def.max_hp, status: 'ACTIVE',
      installed_at: new Date().toISOString(),
    }]);
    setBoughtMsg(`${def.name} installed.`);
    setTimeout(() => setBoughtMsg(null), 3000);
  }

  function handleHealGuard(gid: string) {
    setBodyguards(prev => prev.map(g =>
      g.id === gid ? { ...g, status: 'ACTIVE', current_hp: BODYGUARD_DEFS[g.tier].max_hp } : g
    ));
  }

  function handleRepair(hid: string) {
    setHomeDefs(prev => prev.map(d =>
      d.id === hid ? { ...d, status: 'ACTIVE', current_hp: HOME_DEFENSE_DEFS[d.defense_id].max_hp } : d
    ));
  }

  return (
    <div>
      <PageHeader title="My Defenses" sub="Layered protection — bodyguards and home defenses." />

      {/* Context toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button onClick={() => setIsHome(true)} className={`btn ${isHome ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
          🏠 At Home (all layers)
        </button>
        <button onClick={() => setIsHome(false)} className={`btn ${!isHome ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '10px' }}>
          🚶 On Street (guards only)
        </button>
      </div>

      {boughtMsg && (
        <div style={{ background: '#0a1a0a', border: '1px solid #2a4a2a', padding: '8px 12px', marginBottom: '10px', fontSize: '10px', color: '#4a9a4a' }}>
          ✓ {boughtMsg}
        </div>
      )}

      {/* Defense summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {[
          ['Total Defense', totalRating, ''],
          ['Layers', liveProfile.layers.length, ''],
          ['Player HP', `${liveProfile.player_hp}/${liveProfile.max_player_hp}`, liveProfile.player_hp < 50 ? 'text-danger' : ''],
        ].map(([l, v, cls]) => (
          <div key={String(l)} style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px 10px' }}>
            <div className="label-caps">{l}</div>
            <div className={`stat-val ${cls}`} style={{ fontSize: '15px' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Defense layer stack */}
      <div className="section-title">Defense Layers (Outer → Inner)</div>
      {liveProfile.layers.map((layer, i) => (
        <LayerBar
          key={layer.label}
          label={layer.label}
          current={layer.current_hp}
          max={layer.max_hp}
          rating={layer.defense_rating}
          isCurrent={i === activeIdx}
        />
      ))}
      <div style={{
        border: `1px solid ${activeIdx === -1 ? '#cc3333' : '#2a2a2a'}`,
        background: activeIdx === -1 ? '#1a0808' : '#181818',
        padding: '10px 12px', marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeIdx === -1 && <span style={{ fontSize: '9px', color: '#cc3333', fontWeight: 'bold' }}>← EXPOSED</span>}
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: activeIdx === -1 ? '#cc3333' : '#e0e0e0' }}>Player HP (Final Layer)</span>
          </div>
          <span style={{ fontSize: '10px', color: '#888' }}>{liveProfile.player_hp}/{liveProfile.max_player_hp}</span>
        </div>
        <div style={{ height: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div style={{ height: '100%', width: `${(liveProfile.player_hp / liveProfile.max_player_hp) * 100}%`, background: liveProfile.player_hp > 60 ? '#4a9a4a' : '#cc3333' }} />
        </div>
      </div>

      {/* Bodyguards */}
      <SectionPanel title={`Bodyguards (${bodyguards.filter(g => g.status !== 'DEAD').length} active)`}>
        <div style={{ padding: '8px 12px' }}>
          {bodyguards.length === 0 ? (
            <p style={{ color: '#555', fontSize: '10px' }}>No bodyguards hired.</p>
          ) : (
            bodyguards.map(g => (
              <BodyguardRow key={g.id} guard={g} onHeal={() => handleHealGuard(g.id)} />
            ))
          )}
        </div>
      </SectionPanel>

      {/* Home defenses */}
      {isHome && (
        <SectionPanel title={`Home Defenses (${homeDefs.filter(d => d.status !== 'DESTROYED').length} active)`}>
          <div style={{ padding: '8px 12px' }}>
            {homeDefs.length === 0 ? (
              <p style={{ color: '#555', fontSize: '10px' }}>No home defenses installed.</p>
            ) : (
              homeDefs.map(d => (
                <HomeDefenseRow key={d.id} inst={d} onRepair={() => handleRepair(d.id)} />
              ))
            )}
          </div>
        </SectionPanel>
      )}

      {/* Shop */}
      <div className="section-title" style={{ marginTop: '16px' }}>Upgrade Defenses</div>
      <DefenseShop onBuyBodyguard={handleBuyBodyguard} onBuyHomeDefense={handleBuyHomeDefense} />
    </div>
  );
}
