/**
 * FamilyInventory — Family vault + item issuance management.
 * Route: /family/inventory
 *
 * Don + Underboss: can issue items.
 * Capo+: can view.
 * Lower ranks: no access.
 *
 * Mobile-first. Shows:
 *   - Vault items (available, issued, lost/consumed)
 *   - Active issuances
 *   - Issue action
 *   - Audit log (recent)
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { can } from '../lib/permissions';
import {
  MOCK_FAMILY_ITEMS,
  MOCK_ISSUANCES,
  MOCK_AUDIT_LOG,
  ITEM_CATALOG,
  getVaultItems,
  getActiveIssuances,
} from '../lib/familyData';
import { MOCK_PLAYERS } from '../lib/mockData';
import type { FamilyItemInstance, FamilyItemIssuance } from '../../../shared/schema';

type Tab = 'vault' | 'issued' | 'log';

const STATE_LABEL: Record<string, string> = {
  IN_FAMILY_VAULT: 'In Vault',
  ISSUED: 'Issued',
  IN_USE: 'In Use',
  CONSUMED: 'Consumed',
  RETURNED: 'Returned',
  LOST: 'Lost',
  CONFISCATED: 'Confiscated',
};

const STATE_COLOR: Record<string, string> = {
  IN_FAMILY_VAULT: '#4a9a4a',
  ISSUED: '#cc9900',
  IN_USE: '#5580bb',
  CONSUMED: '#555',
  RETURNED: '#4a9a4a',
  LOST: '#cc4444',
  CONFISCATED: '#cc4444',
};

function IssueItemModal({
  item,
  onIssue,
  onCancel,
}: {
  item: FamilyItemInstance;
  onIssue: (toPlayerId: string, purpose: string, note: string) => void;
  onCancel: () => void;
}) {
  const [toPlayer, setToPlayer] = useState('');
  const [purpose, setPurpose]   = useState<string>('GENERAL');
  const [note, setNote]         = useState('');
  const def = ITEM_CATALOG[item.item_definition_id];
  const members = Object.values(MOCK_PLAYERS).filter(p => p.family_id === 'fam-1' && p.id !== 'p-boss');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '520px',
        background: '#0e0e0e', borderTop: '2px solid #cc3333',
        borderRadius: '10px 10px 0 0', padding: '24px 20px 32px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '900', color: '#e0e0e0', marginBottom: '4px' }}>Issue Item</div>
        <div style={{ fontSize: '11px', color: '#555', marginBottom: '20px' }}>{def?.name}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Issue To</label>
            <select
              value={toPlayer}
              onChange={e => setToPlayer(e.target.value)}
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', color: toPlayer ? '#e0e0e0' : '#555', padding: '10px', fontSize: '12px', borderRadius: '4px' }}
            >
              <option value="">Select member…</option>
              {members.map(p => (
                <option key={p.id} value={p.id}>{p.alias} ({p.family_role})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Purpose</label>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px', fontSize: '12px', borderRadius: '4px' }}
            >
              <option value="JOB">Job</option>
              <option value="HIT">Hit / Contract</option>
              <option value="MISSION">Family Mission</option>
              <option value="PROTECTION">Personal Protection</option>
              <option value="GENERAL">General Use</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. For the waterfront job tonight"
              maxLength={120}
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => toPlayer && onIssue(toPlayer, purpose, note)}
            disabled={!toPlayer}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontWeight: '700', opacity: toPlayer ? 1 : 0.4 }}
          >
            Issue Item
          </button>
          <button
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ width: '100%', padding: '10px', fontSize: '11px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FamilyInventory() {
  const { player, gameRole } = useGame();
  const [tab, setTab] = useState<Tab>('vault');
  const [issuingItem, setIssuingItem] = useState<FamilyItemInstance | null>(null);
  const [items, setItems] = useState<FamilyItemInstance[]>(MOCK_FAMILY_ITEMS);
  const [issuances, setIssuances] = useState<FamilyItemIssuance[]>(MOCK_ISSUANCES);
  const [toast, setToast] = useState<string | null>(null);

  const canIssue = can(gameRole, 'ISSUE_ITEM_TO_MEMBER' as never) || gameRole === 'BOSS' || gameRole === 'UNDERBOSS';
  const canView  = can(gameRole, 'VIEW_FAMILY_INVENTORY' as never) || ['BOSS', 'UNDERBOSS', 'CAPO', 'CONSIGLIERE'].includes(gameRole ?? '');

  const vaultItems    = getVaultItems(items);
  const activeIssued  = getActiveIssuances(issuances);

  function handleIssue(toPlayerId: string, purpose: string, note: string) {
    if (!issuingItem) return;
    // Update item state
    setItems(prev => prev.map(i =>
      i.id === issuingItem.id ? { ...i, state: 'ISSUED' as const, current_holder_id: toPlayerId } : i
    ));
    // Add issuance record
    const issuanceId = `iss-${Date.now()}`;
    setIssuances(prev => [...prev, {
      id: issuanceId,
      family_id: 'fam-1',
      item_instance_id: issuingItem.id,
      item_definition_id: issuingItem.item_definition_id,
      issued_to_player_id: toPlayerId,
      issued_by_player_id: player.id,
      issued_at: new Date().toISOString(),
      purpose: purpose as FamilyItemIssuance['purpose'],
      purpose_reference_id: null,
      status: 'ACTIVE',
      returned_at: null,
      notes: note || null,
    }]);
    setIssuingItem(null);
    setToast('Item issued');
    setTimeout(() => setToast(null), 2500);
  }

  function handleReturn(issuance: FamilyItemIssuance) {
    setIssuances(prev => prev.map(i => i.id === issuance.id ? { ...i, status: 'RETURNED' as const, returned_at: new Date().toISOString() } : i));
    setItems(prev => prev.map(i => i.id === issuance.item_instance_id ? { ...i, state: 'IN_FAMILY_VAULT' as const, current_holder_id: null } : i));
    setToast('Item returned to vault');
    setTimeout(() => setToast(null), 2500);
  }

  if (!canView) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
        You do not have permission to view the family inventory.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif", background: '#080808', minHeight: '100vh' }}>
      {issuingItem && (
        <IssueItemModal
          item={issuingItem}
          onIssue={handleIssue}
          onCancel={() => setIssuingItem(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#0a1a0a', border: '1px solid #2a5a2a', borderRadius: '4px',
          padding: '8px 16px', fontSize: '11px', color: '#5ab85a', zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Family</div>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#e0e0e0', marginBottom: '4px' }}>Vault & Equipment</div>
        <div style={{ fontSize: '11px', color: '#555' }}>
          {vaultItems.length} in vault · {activeIssued.length} active issuances
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', padding: '14px 16px 0', borderBottom: '1px solid #111' }}>
        {(['vault', 'issued', 'log'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '7px 14px', fontSize: '11px', fontWeight: tab === t ? '700' : '400',
              color: tab === t ? '#e0e0e0' : '#444',
              borderBottom: tab === t ? '2px solid #cc3333' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'vault' ? 'Vault' : t === 'issued' ? `Issued (${activeIssued.length})` : 'Log'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* VAULT TAB */}
        {tab === 'vault' && (
          <div>
            {items.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '40px 0' }}>
                No items in family inventory.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map(item => {
                const def = ITEM_CATALOG[item.item_definition_id];
                const stateColor = STATE_COLOR[item.state] ?? '#555';
                const inVault = item.state === 'IN_FAMILY_VAULT';

                return (
                  <div key={item.id} style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#e0e0e0', marginBottom: '3px' }}>
                          {def?.name ?? item.item_definition_id}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', color: '#555', background: '#111', padding: '2px 6px', borderRadius: '3px' }}>
                            {def?.category}
                          </span>
                          <span style={{ fontSize: '9px', color: '#555', background: '#111', padding: '2px 6px', borderRadius: '3px' }}>
                            {def?.tier}
                          </span>
                        </div>
                        {item.current_holder_id && (
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            With: {MOCK_PLAYERS[item.current_holder_id]?.alias ?? item.current_holder_id}
                          </div>
                        )}
                        {item.notes && (
                          <div style={{ fontSize: '10px', color: '#444', marginTop: '3px' }}>
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <div style={{ fontSize: '9px', color: stateColor, fontWeight: '700', letterSpacing: '0.04em' }}>
                          {STATE_LABEL[item.state] ?? item.state}
                        </div>
                        {inVault && canIssue && (
                          <button
                            onClick={() => setIssuingItem(item)}
                            style={{ background: '#1a0808', border: '1px solid #3a1010', color: '#cc4444', cursor: 'pointer', fontSize: '9px', padding: '4px 8px', borderRadius: '3px', fontWeight: '700', letterSpacing: '0.04em' }}
                          >
                            Issue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DEV info */}
            <div style={{ marginTop: '20px', background: '#0d0d00', border: '1px solid #2a2a00', borderRadius: '4px', padding: '10px', fontSize: '10px', color: '#666' }}>
              <strong style={{ color: '#cc9900' }}>DEV</strong> — Items are mock data.
              Issuing updates local state only. In production, all issuance goes through
              <code style={{ color: '#888' }}> rpc('issue_family_item')</code> with server-side permission + race-condition checks.
            </div>
          </div>
        )}

        {/* ISSUED TAB */}
        {tab === 'issued' && (
          <div>
            {activeIssued.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '40px 0' }}>
                No items currently issued.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {issuances.map(iss => {
                const def  = ITEM_CATALOG[iss.item_definition_id];
                const to   = MOCK_PLAYERS[iss.issued_to_player_id];
                const by   = MOCK_PLAYERS[iss.issued_by_player_id];
                const isActive = iss.status === 'ACTIVE';

                return (
                  <div key={iss.id} style={{ background: '#0e0e0e', border: `1px solid ${isActive ? '#2a2010' : '#1a1a1a'}`, borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#e0e0e0', marginBottom: '3px' }}>
                          {def?.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                          To: <strong style={{ color: '#c0c0c0' }}>{to?.alias}</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>
                          Issued by: {by?.alias} · Purpose: {iss.purpose}
                        </div>
                        {iss.notes && (
                          <div style={{ fontSize: '10px', color: '#444', marginTop: '3px', fontStyle: 'italic' }}>
                            {iss.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <div style={{ fontSize: '9px', color: iss.status === 'ACTIVE' ? '#cc9900' : iss.status === 'RETURNED' ? '#4a9a4a' : '#cc4444', fontWeight: '700' }}>
                          {iss.status}
                        </div>
                        {isActive && canIssue && (
                          <button
                            onClick={() => handleReturn(iss)}
                            style={{ background: '#0a1a0a', border: '1px solid #2a4a2a', color: '#5ab85a', cursor: 'pointer', fontSize: '9px', padding: '4px 8px', borderRadius: '3px', fontWeight: '700' }}
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === 'log' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MOCK_AUDIT_LOG.map(entry => (
                <div key={entry.id} style={{ padding: '10px 14px', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#c0c0c0', lineHeight: '1.5' }}>{entry.summary}</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#444', flexShrink: 0 }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#333', marginTop: '4px', letterSpacing: '0.04em' }}>
                    {entry.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
