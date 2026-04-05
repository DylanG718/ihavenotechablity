/**
 * Inventory Screen
 * Shows player's personal inventory with category filters and per-item action menu.
 * Family shared inventory and equip mechanics: future.
 */

import { useState } from 'react';
import { useEconomy } from '../lib/economyContext';
import { ITEM_DEFINITIONS } from '../lib/economyMockData';
import { fmt } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import type { ItemCategory } from '../../../shared/economy';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  WEAPON:     'Weapons',
  TOOL:       'Tools',
  INTEL:      'Intel',
  CONSUMABLE: 'Consumables',
  GEAR:       'Gear',
  CONTRABAND: 'Contraband',
};

const RARITY_COLOR: Record<string, string> = {
  COMMON:   '#888',
  UNCOMMON: '#5580bb',
  RARE:     '#cc9900',
  ELITE:    '#cc3333',
};

export default function InventoryScreen() {
  const { inventory } = useEconomy();
  const [filter, setFilter] = useState<ItemCategory | 'ALL'>('ALL');
  const [actionItem, setActionItem] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories: Array<ItemCategory | 'ALL'> = ['ALL', 'WEAPON', 'TOOL', 'INTEL', 'CONSUMABLE', 'GEAR', 'CONTRABAND'];

  const filtered = inventory.filter(item => {
    const def = ITEM_DEFINITIONS[item.item_definition_id];
    if (filter === 'ALL') return true;
    return def?.category === filter;
  });

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  // Stat modifier display
  function StatMods({ defId }: { defId: string }) {
    const def = ITEM_DEFINITIONS[defId];
    if (!def?.stat_modifiers.length) return <span style={{ color: '#444' }}>—</span>;
    return (
      <>
        {def.stat_modifiers.map(m => (
          <span key={m.stat} style={{ color: m.delta >= 0 ? '#4a9a4a' : '#cc3333', fontSize: '9px', marginRight: '4px' }}>
            {m.delta >= 0 ? '+' : ''}{m.delta} {m.stat}
          </span>
        ))}
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        sub="Personal item inventory. Family shared inventory: coming soon."
      />

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '48px', right: '16px', zIndex: 80, background: '#1a3a1a', border: '1px solid #2a6a2a', color: '#4a9a4a', padding: '6px 12px', fontSize: '10px', fontFamily: 'Verdana, sans-serif' }}>
          {toastMsg}
        </div>
      )}

      {/* Summary row */}
      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        {categories.filter(c => c !== 'ALL').map(cat => {
          const count = inventory.filter(i => ITEM_DEFINITIONS[i.item_definition_id]?.category === cat).length;
          return (
            <div key={cat} className="panel" style={{ padding: '6px 10px' }}>
              <div className="label-caps">{CATEGORY_LABELS[cat as ItemCategory]}</div>
              <div className="stat-val" style={{ fontSize: '14px' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`btn ${filter === c ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}
          >
            {c === 'ALL' ? 'All' : CATEGORY_LABELS[c as ItemCategory]}
          </button>
        ))}
      </div>

      <SectionPanel title="Items" right={`${filtered.length} items`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Rarity</th>
                <th>Qty</th>
                <th>Equipped</th>
                <th>Stat Mods</th>
                <th>Est. Value</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const def = ITEM_DEFINITIONS[item.item_definition_id];
                if (!def) return null;
                const isOpen = actionItem === item.id;
                return (
                  <tr key={item.id} data-testid={`inv-item-${item.id}`}>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{def.name}</div>
                      <div style={{ fontSize: '9px', color: '#555', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {def.description}
                      </div>
                    </td>
                    <td style={{ color: '#888' }}>{CATEGORY_LABELS[def.category]}</td>
                    <td style={{ color: RARITY_COLOR[def.rarity], fontWeight: 'bold', fontSize: '9px' }}>{def.rarity}</td>
                    <td style={{ fontWeight: 'bold' }}>{item.quantity}</td>
                    <td>
                      {item.equipped
                        ? <span className="badge-green">Equipped</span>
                        : <span className="badge-gray">—</span>
                      }
                    </td>
                    <td><StatMods defId={item.item_definition_id} /></td>
                    <td className="text-cash">{fmt(def.base_value * item.quantity)}</td>
                    <td style={{ color: '#555', fontSize: '9px' }}>{item.source.replace(/_/g, ' ')}</td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setActionItem(isOpen ? null : item.id)}
                          className="btn btn-ghost"
                          style={{ fontSize: '9px' }}
                          data-testid={`item-menu-${item.id}`}
                        >
                          ▾ Actions
                        </button>
                        {isOpen && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: '#181818', border: '1px solid #2a2a2a', minWidth: '130px', boxShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}>
                            {def.equippable && (
                              <button onClick={() => { toast(`${def.name} ${item.equipped ? 'unequipped' : 'equipped'}.`); setActionItem(null); }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: '10px', color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {item.equipped ? 'Unequip' : 'Equip'}
                              </button>
                            )}
                            {!def.equippable && (
                              <button onClick={() => { toast(`Used ${def.name}.`); setActionItem(null); }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: '10px', color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Use
                              </button>
                            )}
                            {def.tradable && (
                              <button onClick={() => { toast(`${def.name} listed — go to Black Market.`); setActionItem(null); }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: '10px', color: '#cc9900', background: 'none', border: 'none', cursor: 'pointer' }}>
                                List on Market
                              </button>
                            )}
                            <button onClick={() => { toast(`${def.name} discarded.`); setActionItem(null); }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: '10px', color: '#cc3333', background: 'none', border: 'none', cursor: 'pointer' }}>
                              Discard
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#555', padding: '20px' }}>No items in this category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <div style={{ marginTop: '8px', fontSize: '9px', color: '#444', fontFamily: 'Verdana, sans-serif' }}>
        Equip actions affect stat modifiers in missions. Family shared inventory: proposed feature, not yet implemented.
        Weight limits, durability, and crafting: future systems.
      </div>
    </div>
  );
}
