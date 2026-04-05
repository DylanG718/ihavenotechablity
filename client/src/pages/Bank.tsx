/**
 * Bank & Stash Screen
 * Shows wallet / bank / stash balances with deposit/withdraw/move forms.
 * Tax hooks and raid mechanics: future.
 */

import { useState } from 'react';
import { useEconomy } from '../lib/economyContext';
import { fmt } from '../lib/mockData';
import { BANK_LARGE_WITHDRAWAL_THRESHOLD, BANK_LARGE_WITHDRAWAL_FEE_RATE } from '../lib/economyEngine';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';

type Action = 'DEPOSIT' | 'WITHDRAW' | 'TO_STASH' | 'FROM_STASH' | null;

function TransactionRow({ tx }: { tx: any }) {
  const isIn  = ['MISSION_PAYOUT','CONTRACT_PAYOUT','SYSTEM_REWARD','BANK_WITHDRAWAL','STASH_WITHDRAWAL','TRANSFER_IN'].includes(tx.type);
  const color = isIn ? '#4a9a4a' : '#cc3333';
  return (
    <tr>
      <td style={{ fontSize: '9px', color: '#555', whiteSpace: 'nowrap' }}>{new Date(tx.timestamp).toLocaleDateString()}</td>
      <td style={{ color: '#888', fontSize: '9px' }}>{tx.type.replace(/_/g, ' ')}</td>
      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>{tx.description}</td>
      <td style={{ color, fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {isIn ? '+' : '−'}{fmt(tx.amount)}
      </td>
      <td style={{ textAlign: 'right', color: '#888', whiteSpace: 'nowrap' }}>{fmt(tx.balance_after)}</td>
    </tr>
  );
}

function MoneyForm({ action, onSubmit, onCancel, walletCash, bankBalance, stashBalance }: {
  action: Action;
  onSubmit: (amount: number) => void;
  onCancel: () => void;
  walletCash: number;
  bankBalance: number;
  stashBalance: number;
}) {
  const [input, setInput] = useState('');
  const amount = parseInt(input.replace(/\D/g, ''), 10) || 0;

  const labels: Record<NonNullable<Action>, { title: string; from: string; to: string; max: number }> = {
    DEPOSIT:    { title: 'Deposit to Bank',    from: `Wallet: ${fmt(walletCash)}`,  to: 'Bank', max: walletCash },
    WITHDRAW:   { title: 'Withdraw from Bank', from: `Bank: ${fmt(bankBalance)}`,   to: 'Wallet', max: bankBalance },
    TO_STASH:   { title: 'Move to Stash',      from: `Wallet: ${fmt(walletCash)}`,  to: 'Stash', max: walletCash },
    FROM_STASH: { title: 'Move from Stash',    from: `Stash: ${fmt(stashBalance)}`, to: 'Wallet', max: stashBalance },
  };
  const meta = action ? labels[action] : null;
  if (!meta) return null;

  const largeWithdrawFee = action === 'WITHDRAW' && amount > BANK_LARGE_WITHDRAWAL_THRESHOLD
    ? Math.floor(amount * BANK_LARGE_WITHDRAWAL_FEE_RATE)
    : 0;
  const netAmount = amount - largeWithdrawFee;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '380px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <span className="panel-title">{meta.title}</span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px' }}>✕</button>
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>
            From: <strong style={{ color: '#e0e0e0' }}>{meta.from}</strong>
            {' → '}To: <strong style={{ color: '#ffcc33' }}>{meta.to}</strong>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div className="label-caps" style={{ marginBottom: '4px' }}>Amount</div>
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="game-input"
              placeholder="0"
              max={meta.max}
              data-testid="money-amount-input"
            />
            <div style={{ fontSize: '9px', color: '#555', marginTop: '3px' }}>
              Max: {fmt(meta.max)}
            </div>
          </div>

          {largeWithdrawFee > 0 && (
            <div style={{ background: '#1a1500', border: '1px solid #3a2a00', padding: '6px 8px', fontSize: '10px', color: '#cc9900', marginBottom: '10px' }}>
              Large withdrawal fee (1%): {fmt(largeWithdrawFee)}<br />
              <span style={{ color: '#888' }}>Net received: {fmt(netAmount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => amount > 0 && amount <= meta.max && onSubmit(amount)}
              disabled={amount <= 0 || amount > meta.max}
              className={`btn ${amount > 0 && amount <= meta.max ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, padding: '7px' }}
              data-testid="confirm-money-action"
            >
              Confirm
            </button>
            <button onClick={onCancel} className="btn btn-ghost" style={{ padding: '7px 14px' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BankScreen() {
  const { walletCash, bank, stash, transactions, depositToBank, withdrawFromBank, moveToStash, moveFromStash } = useEconomy();
  const [action, setAction] = useState<Action>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleAction(amount: number) {
    let r: { ok: boolean; error?: string; fee?: number };
    switch (action) {
      case 'DEPOSIT':    r = depositToBank(amount);    break;
      case 'WITHDRAW':   r = withdrawFromBank(amount); break;
      case 'TO_STASH':   r = moveToStash(amount);      break;
      case 'FROM_STASH': r = moveFromStash(amount);    break;
      default: return;
    }
    setAction(null);
    if (r.ok) {
      const fee = (r as any).fee ?? 0;
      setResult({ ok: true, msg: fee > 0 ? `Done. Fee paid: ${fmt(fee)}.` : 'Done.' });
    } else {
      setResult({ ok: false, msg: (r as any).error ?? 'Error.' });
    }
    setTimeout(() => setResult(null), 3000);
  }

  const totalWealth = walletCash + bank.balance + stash.hidden_balance;

  return (
    <div>
      <PageHeader title="Bank & Stash" sub="Manage your money. Stash funds are hidden but can be raided in advanced mechanics." />

      {result && (
        <InfoAlert variant={result.ok ? undefined : 'danger'}>
          {result.msg}
        </InfoAlert>
      )}

      {/* Balance overview */}
      <div className="ml-grid-3" style={{ marginBottom: '10px' }}>
        {[
          { l: 'On Hand (Wallet)',  v: fmt(walletCash),          cls: 'text-cash',    sub: 'Spendable immediately' },
          { l: 'Bank Balance',      v: fmt(bank.balance),        cls: 'text-cash',    sub: 'Protected, taxable' },
          { l: 'Stash (Hidden)',    v: fmt(stash.hidden_balance), cls: 'text-warn',    sub: `Discoverability: ${stash.discoverability_level}/100` },
        ].map(({ l, v, cls, sub }) => (
          <div key={l} className="panel" style={{ padding: '10px 12px' }}>
            <div className="label-caps">{l}</div>
            <div className={`stat-val ${cls}`}>{v}</div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: '#666', fontFamily: 'Verdana, sans-serif', marginBottom: '10px', padding: '6px 10px', background: '#181818', border: '1px solid #2a2a2a' }}>
        Total wealth: <strong style={{ color: '#ffcc33' }}>{fmt(totalWealth)}</strong>
        {' · '}
        Lifetime deposited: {fmt(bank.total_deposited)}
        {' · '}
        Lifetime withdrawn: {fmt(bank.total_withdrawn)}
      </div>

      {/* Bank actions */}
      <div className="ml-panel-row" style={{ gap: '8px', marginBottom: '10px' }}>
        <SectionPanel title="Bank Operations">
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', lineHeight: '1.5' }}>
              The bank is safer than your wallet but subject to fees on large withdrawals
              (over {fmt(50000)}: 1% fee). Tax rules may apply in future updates.
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setAction('DEPOSIT')}  data-testid="btn-deposit">Deposit</button>
              <button className="btn btn-ghost"   onClick={() => setAction('WITHDRAW')} data-testid="btn-withdraw">Withdraw</button>
            </div>
          </div>
        </SectionPanel>

        <SectionPanel title="Stash Operations">
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', lineHeight: '1.5' }}>
              Stash funds are hidden. No direct tax. Risk: stash can be raided by enemies
              if discoverability is high. Larger stashes are more detectable.
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setAction('TO_STASH')}   data-testid="btn-to-stash">Move to Stash</button>
              <button className="btn btn-ghost"   onClick={() => setAction('FROM_STASH')} data-testid="btn-from-stash">Recover from Stash</button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '9px', color: '#555' }}>
              Discoverability: {stash.discoverability_level}/100
              {stash.discoverability_level > 50 && <span style={{ color: '#cc3333' }}> — HIGH RISK</span>}
            </div>
          </div>
        </SectionPanel>
      </div>

      {/* ── STASH section ── */}
      <SectionPanel title="STASH" right="Hidden cache">
        <div style={{ padding: '10px 12px' }}>
          {/* Vulnerability warning */}
          <div style={{ background: '#1a1500', border: '1px solid #3a2a00', padding: '6px 8px', fontSize: '10px', color: '#cc9900', marginBottom: '10px', lineHeight: '1.5' }}>
            ⚠ Stash vulnerability: Enemies can rob up to <strong>20%</strong> of your stash during attacks.
            Higher discoverability increases raid risk.
          </div>

          {/* Balance + capacity */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: '#888' }}>
              <span>Current Stash</span>
              <span style={{ color: '#cc9900', fontWeight: 'bold' }}>{fmt(stash.hidden_balance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10px', color: '#888' }}>
              <span>Capacity</span>
              <span>{fmt(stash.hidden_balance)} / {fmt(500000)}</span>
            </div>
            {/* Capacity bar */}
            <div style={{ background: '#111', border: '1px solid #222', height: '6px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (stash.hidden_balance / 500000) * 100)}%`,
                background: stash.hidden_balance > 400000 ? '#cc3333' : stash.hidden_balance > 200000 ? '#cc9900' : '#4a9a4a',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: '9px', color: '#444', marginTop: '3px' }}>
              {Math.round((stash.hidden_balance / 500000) * 100)}% full · Base capacity $500K
            </div>
          </div>

          {/* Discoverability */}
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Discoverability risk:</div>
          <div style={{ background: '#111', border: '1px solid #222', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{
              height: '100%',
              width: `${stash.discoverability_level}%`,
              background: stash.discoverability_level > 70 ? '#cc3333' : stash.discoverability_level > 40 ? '#cc9900' : '#4a9a4a',
            }} />
          </div>
          <div style={{ fontSize: '9px', color: '#555' }}>
            {stash.discoverability_level}/100
            {stash.discoverability_level > 70 && <span style={{ color: '#cc3333' }}> — CRITICAL: enemy raids likely</span>}
            {stash.discoverability_level > 40 && stash.discoverability_level <= 70 && <span style={{ color: '#cc9900' }}> — ELEVATED: reduce stash size</span>}
            {stash.discoverability_level <= 40 && <span style={{ color: '#4a9a4a' }}> — LOW: safe</span>}
          </div>
        </div>
      </SectionPanel>

      {/* Transaction log */}
      <SectionPanel title="Transaction History" right={`${transactions.length} entries`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Balance After</th></tr></thead>
            <tbody>
              {transactions.slice(0, 15).map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </tbody>
          </table>
        </div>
        {transactions.length > 15 && (
          <div style={{ padding: '5px 8px', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#555', textAlign: 'right' }}>
            Showing 15 of {transactions.length} entries. Full ledger: coming soon.
          </div>
        )}
      </SectionPanel>

      {action && (
        <MoneyForm
          action={action}
          onSubmit={handleAction}
          onCancel={() => setAction(null)}
          walletCash={walletCash}
          bankBalance={bank.balance}
          stashBalance={stash.hidden_balance}
        />
      )}
    </div>
  );
}
