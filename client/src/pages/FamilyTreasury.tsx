/**
 * FamilyTreasury — Treasury balance, transaction ledger, and tax settings.
 * Route: /family/treasury
 *
 * Permissions:
 *   - View balance: CAPO+
 *   - View history: CAPO+
 *   - Set tax/kickup: DON only
 *   - Withdraw: UNDERBOSS+
 *   - Deposit: ASSOCIATE+
 *
 * Mobile-first. Prioritizes clarity over decoration.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import {
  MOCK_TREASURY_TRANSACTIONS,
  MOCK_FAMILY_EXTENDED,
  formatTxAmount,
  TX_TYPE_LABELS,
} from '../lib/familyData';
import type { TreasuryTransaction } from '../../../shared/schema';

type Tab = 'overview' | 'history' | 'settings';

function TxRow({ tx }: { tx: TreasuryTransaction }) {
  const isDeposit = tx.amount >= 0;
  const label = TX_TYPE_LABELS[tx.type] ?? tx.type;

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid #111' }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: isDeposit ? '#4a9a4a' : '#cc4444',
        marginTop: '5px', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: '#c0c0c0', fontWeight: '600', marginBottom: '2px' }}>{label}</div>
        {tx.note && (
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.4', marginBottom: '2px' }}>{tx.note}</div>
        )}
        <div style={{ fontSize: '9px', color: '#333' }}>
          {new Date(tx.created_at).toLocaleDateString()} · Balance after: {formatTxAmount(tx.balance_after)}
        </div>
      </div>
      <div style={{
        fontSize: '13px', fontWeight: '700', color: isDeposit ? '#4a9a4a' : '#cc4444',
        flexShrink: 0,
      }}>
        {formatTxAmount(tx.amount)}
      </div>
    </div>
  );
}

export default function FamilyTreasury() {
  const { player, gameRole } = useGame();
  const [tab, setTab] = useState<Tab>('overview');

  const family = MOCK_FAMILY_EXTENDED;
  const transactions = [...MOCK_TREASURY_TRANSACTIONS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const canView      = ['BOSS', 'UNDERBOSS', 'CONSIGLIERE', 'CAPO'].includes(gameRole ?? '');
  const canWithdraw  = ['BOSS', 'UNDERBOSS'].includes(gameRole ?? '');
  const canSetRates  = gameRole === 'BOSS';
  const canDeposit   = true; // all members

  const [taxRateInput, setTaxRateInput]     = useState(family.tax_rate_pct.toString());
  const [kickupRateInput, setKickupRateInput] = useState(family.kickup_rate_pct.toString());
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleRateSave() {
    const tax = parseInt(taxRateInput);
    const kickup = parseInt(kickupRateInput);
    if (isNaN(tax) || tax < 0 || tax > 50) return showToast('Tax rate must be 0–50%');
    if (isNaN(kickup) || kickup < 0 || kickup > 30) return showToast('Kick-up rate must be 0–30%');
    showToast(`Rates updated — Tax: ${tax}% · Kick-up: ${kickup}%`);
  }

  if (!canView) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
        Treasury is visible to Capo rank and above.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif", background: '#080808', minHeight: '100vh' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#0a1a0a', border: '1px solid #2a5a2a', borderRadius: '4px',
          padding: '8px 16px', fontSize: '11px', color: '#5ab85a', zIndex: 100, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Family</div>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#e0e0e0', marginBottom: '2px' }}>Treasury</div>
        <div style={{ fontSize: '9px', color: '#555' }}>Ledgered · All transactions tracked</div>
      </div>

      {/* Balance hero */}
      <div style={{ margin: '16px 16px 0', padding: '18px', background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: '8px' }}>
        <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Current Balance</div>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#e0e0e0', letterSpacing: '-0.02em' }}>
          ${(family.treasury / 1_000_000).toFixed(2)}M
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#555', marginBottom: '2px' }}>Tax Rate</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#cc9900' }}>{family.tax_rate_pct}%</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#555', marginBottom: '2px' }}>Kick-Up Rate</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#cc9900' }}>{family.kickup_rate_pct}%</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 0' }}>
        {canDeposit && (
          <button
            onClick={() => showToast('Deposit flow — connect to Supabase to enable')}
            style={{ flex: 1, background: '#0a1a0a', border: '1px solid #2a4a2a', color: '#5ab85a', cursor: 'pointer', padding: '10px', fontSize: '11px', fontWeight: '700', borderRadius: '5px' }}
          >
            Deposit
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={() => showToast('Withdrawal flow — connect to Supabase to enable')}
            style={{ flex: 1, background: '#1a0808', border: '1px solid #3a1010', color: '#cc4444', cursor: 'pointer', padding: '10px', fontSize: '11px', fontWeight: '700', borderRadius: '5px' }}
          >
            Withdraw
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', padding: '14px 16px 0', borderBottom: '1px solid #111' }}>
        {(['overview', 'history', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '7px 14px', fontSize: '11px', fontWeight: tab === t ? '700' : '400',
              color: tab === t ? '#e0e0e0' : '#444',
              borderBottom: tab === t ? '2px solid #cc3333' : '2px solid transparent',
              marginBottom: '-1px', textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>What treasury pays for</div>
              {[
                { label: 'Item procurement', desc: 'Weapons, tools, and equipment for the vault' },
                { label: 'Mission expenses', desc: 'Family mission overhead and logistics' },
                { label: 'War reparations', desc: 'Compensation owed after a failed contract blowback' },
                { label: 'Turf expansion', desc: 'Purchasing new territory blocks' },
                { label: 'Member support', desc: 'Bail, medical, and emergency payouts' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '12px', padding: '9px 0', borderBottom: '1px solid #111' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#cc3333', flexShrink: 0, marginTop: '5px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#c0c0c0', fontWeight: '600' }}>{item.label}</div>
                    <div style={{ fontSize: '10px', color: '#555' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Recent Activity</div>
              {transactions.slice(0, 4).map(tx => <TxRow key={tx.id} tx={tx} />)}
              <button
                onClick={() => setTab('history')}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px', marginTop: '10px' }}
              >
                View full history →
              </button>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '14px' }}>
              {transactions.length} transactions on record
            </div>
            {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div>
            {!canSetRates ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#555', fontSize: '12px' }}>
                Only the Don can change tax and kick-up settings.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Family Tax Rate</div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6', marginBottom: '10px' }}>
                    % of each member's job payout automatically deposited to the family treasury.
                    Range: 0–50%.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={taxRateInput}
                      onChange={e => setTaxRateInput(e.target.value)}
                      min={0} max={50}
                      style={{ width: '70px', background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '8px', fontSize: '14px', fontWeight: '700', borderRadius: '4px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: '#555' }}>%</span>
                  </div>
                </div>

                <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Kick-Up Rate</div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6', marginBottom: '10px' }}>
                    % of crew earnings paid to leadership as tribute.
                    Range: 0–30%.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={kickupRateInput}
                      onChange={e => setKickupRateInput(e.target.value)}
                      min={0} max={30}
                      style={{ width: '70px', background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '8px', fontSize: '14px', fontWeight: '700', borderRadius: '4px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: '#555' }}>%</span>
                  </div>
                </div>

                <button
                  onClick={handleRateSave}
                  className="btn btn-primary"
                  style={{ padding: '12px', fontWeight: '700', fontSize: '12px' }}
                >
                  Save Settings
                </button>

                <div style={{ background: '#0d0d00', border: '1px solid #2a2a00', borderRadius: '4px', padding: '10px', fontSize: '10px', color: '#666' }}>
                  <strong style={{ color: '#cc9900' }}>DEV</strong> — Rate changes update local state only.
                  In production, changes go through <code style={{ color: '#888' }}>rpc('update_family_tax_rates')</code> with Don-only permission check + audit log entry.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
