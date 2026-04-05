/**
 * Family Treasury Screen
 * Leadership: full treasury view, recent transactions, tax/cut settings.
 * Members: simplified view showing family cut percentage.
 * Businesses: income overview.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { useEconomy } from '../lib/economyContext';
import { MOCK_BUSINESSES, MOCK_TAX_RULES, MOCK_CUT_RULES } from '../lib/economyMockData';
import { applyFamilyTaxAndSplits } from '../lib/economyEngine';
import { fmt } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import { can } from '../lib/permissions';
import type { IncomeSourceType } from '../../../shared/economy';

const BIZ_TYPE_LABELS: Record<string, string> = {
  NUMBERS_OPERATION: 'Numbers Operation',
  PROTECTION_RACKET: 'Protection Racket',
  FRONT_BUSINESS:    'Front Business',
  CHOP_SHOP:         'Chop Shop',
  LOAN_SHARKING:     'Loan Sharking',
  DRUG_DISTRIBUTION: 'Drug Distribution',
};

const INCOME_SOURCE_LABELS: Record<IncomeSourceType, string> = {
  MISSION:          'Missions',
  HEIST:            'Heists',
  CONTRACT:         'Contracts (Hitman)',
  STREET_JOB:       'Street Jobs',
  BLACK_MARKET_SALE:'Black Market Sales',
  BUSINESS_INCOME:  'Business Income',
};

function TaxPreview({ taxRuleId }: { taxRuleId: string }) {
  const rule  = MOCK_TAX_RULES.find(r => r.id === taxRuleId);
  const cut   = MOCK_CUT_RULES.find(c => c.id === taxRuleId.replace('tax', 'cut'));
  if (!rule || !cut) return null;

  const DEMO_AMOUNT = 100000;
  const result = applyFamilyTaxAndSplits(DEMO_AMOUNT, 'MISSION', rule, cut);

  return (
    <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '10px' }}>
      <div style={{ fontWeight: 'bold', color: '#e0e0e0', marginBottom: '4px' }}>{rule.name}</div>
      <div style={{ color: '#888', marginBottom: '8px' }}>{rule.description}</div>
      <div style={{ marginBottom: '6px', color: '#666' }}>Example: ${DEMO_AMOUNT.toLocaleString()} mission payout</div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div><div className="label-caps">Player Net</div><div className="text-cash" style={{ fontWeight: 'bold' }}>{fmt(result.player_net)}</div></div>
        <div><div className="label-caps">Family Share</div><div style={{ color: '#cc9900', fontWeight: 'bold' }}>{fmt(result.family_share)}</div></div>
        <div><div className="label-caps">Sink</div><div style={{ color: '#555' }}>{fmt(result.system_sink)}</div></div>
      </div>
      <div style={{ marginTop: '8px', color: '#555' }}>
        Base rate: {Math.round(rule.base_rate * 100)}%
        {Object.entries(rule.source_overrides).map(([k, v]) => (
          <span key={k} style={{ marginLeft: '8px' }}>{k}: {Math.round(v * 100)}%</span>
        ))}
      </div>
    </div>
  );
}

export default function TreasuryScreen() {
  const { gameRole } = useGame();
  const { familyTreasury } = useEconomy();
  const [activeRule, setActiveRule] = useState('tax-low');

  const isLeadership = can(gameRole, 'VIEW_FAMILY_TREASURY');
  const memberCutRate = Math.round((1 - (MOCK_CUT_RULES[0].player_share)) * 100);

  // Business income totals
  const activeBizIncome  = MOCK_BUSINESSES.filter(b => b.status === 'ACTIVE').reduce((s, b) => s + b.daily_income, 0);
  const disruptedBizIncome = MOCK_BUSINESSES.filter(b => b.status === 'DISRUPTED').reduce((s, b) => s + b.daily_income, 0);
  const heatPerDay = MOCK_BUSINESSES.filter(b => b.status === 'ACTIVE').reduce((s, b) => s + b.heat_generation_per_day, 0);

  // Treasury flows
  const dailyInflow  = activeBizIncome * 0.30; // 30% of biz income goes to treasury (proposed)
  const monthlyProjection = (dailyInflow + 80000) * 30; // rough estimate with missions

  if (!isLeadership) {
    // ── Member view ──
    return (
      <div>
        <PageHeader title="Family Economy" sub="Your cut and family tax information." />
        <SectionPanel title="Your Cut">
          <div style={{ padding: '12px', fontSize: '10px', color: '#aaa', lineHeight: '1.6' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffcc33', marginBottom: '6px' }}>
              You keep {Math.round(MOCK_CUT_RULES[0].player_share * 100)}% of all mission income.
            </div>
            <p>The family takes <strong style={{ color: '#cc9900' }}>{memberCutRate}%</strong> of your gross earnings from missions and heists.</p>
            <p style={{ marginTop: '6px', color: '#666' }}>
              This funds family operations: territory defense, hitman contracts, and shared protection.
              Leadership can view full treasury details.
            </p>
            <div style={{ marginTop: '10px', background: '#181818', border: '1px solid #2a2a2a', padding: '8px', borderLeft: '3px solid #cc9900' }}>
              Active tax rate: <strong style={{ color: '#ffcc33' }}>{Math.round(MOCK_TAX_RULES[0].base_rate * 100)}%</strong> base
              · Heist rate: <strong style={{ color: '#ffcc33' }}>{Math.round((MOCK_TAX_RULES[0].source_overrides.HEIST ?? 0) * 100)}%</strong>
            </div>
          </div>
        </SectionPanel>
      </div>
    );
  }

  // ── Leadership view ──
  return (
    <div>
      <PageHeader title="Family Treasury" sub="Full financial management — leadership only." />

      {/* Treasury top stats */}
      <div className="ml-grid-4" style={{ marginBottom: '10px' }}>
        {[
          { l: 'Treasury Balance',     v: fmt(familyTreasury.balance),                 cls: 'text-cash' },
          { l: 'Inflow This Round',    v: fmt(familyTreasury.total_inflow_this_round),  cls: 'text-success' },
          { l: 'Outflow This Round',   v: fmt(familyTreasury.total_outflow_this_round), cls: 'text-danger' },
          { l: 'Daily Biz Income',     v: fmt(activeBizIncome),                         cls: 'text-cash' },
        ].map(({ l, v, cls }) => (
          <div key={l} className="panel" style={{ padding: '8px 10px' }}>
            <div className="label-caps">{l}</div>
            <div className={`stat-val ${cls}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Quick projections */}
      <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '8px 12px', fontSize: '10px', marginBottom: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <span style={{ color: '#888' }}>Daily biz → treasury: <strong className="text-cash">{fmt(dailyInflow)}</strong></span>
        <span style={{ color: '#888' }}>Active businesses: <strong style={{ color: '#e0e0e0' }}>{MOCK_BUSINESSES.filter(b => b.status === 'ACTIVE').length}</strong></span>
        <span style={{ color: '#888' }}>Heat/day from biz: <strong className="text-heat">{heatPerDay}</strong></span>
        {disruptedBizIncome > 0 && <span style={{ color: '#cc3333' }}>Disrupted lost income: {fmt(disruptedBizIncome)}/day</span>}
      </div>

      <div className="ml-panel-row" style={{ gap: '8px', marginBottom: '10px' }}>
        {/* Recent transactions */}
        <SectionPanel title="Recent Treasury Activity" right="Last 5">
          <div className="ml-table-scroll">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {familyTreasury.recent_transactions.slice(0, 5).map(tx => {
                  const isIn = tx.type === 'FAMILY_TREASURY_IN';
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '9px', color: '#555' }}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                      <td style={{ fontSize: '9px', color: '#888' }}>{isIn ? '▲ In' : '▼ Out'}</td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>{tx.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: isIn ? '#4a9a4a' : '#cc3333' }}>
                        {isIn ? '+' : '−'}{fmt(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        {/* Businesses */}
        <SectionPanel title="Family Businesses">
          <div className="ml-table-scroll">
            <table className="data-table">
              <thead><tr><th>Business</th><th>Type</th><th>Daily</th><th>Heat/d</th><th>Status</th></tr></thead>
              <tbody>
                {MOCK_BUSINESSES.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 'bold' }}>{b.name}</td>
                    <td style={{ color: '#888', fontSize: '9px' }}>{BIZ_TYPE_LABELS[b.type]}</td>
                    <td className="text-cash">{fmt(b.daily_income)}</td>
                    <td className="text-heat">+{b.heat_generation_per_day}</td>
                    <td>
                      {b.status === 'ACTIVE'    && <span className="badge-green">Active</span>}
                      {b.status === 'DISRUPTED' && <span className="badge-yellow">Disrupted</span>}
                      {b.status === 'SEIZED'    && <span className="badge-red">Seized</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>

      {/* Tax/Cut config */}
      <SectionPanel title="Tax & Cut Configuration (Read-only this pass)">
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>
            Three family tax configurations shown. Active rule: <strong style={{ color: '#ffcc33' }}>{MOCK_TAX_RULES[0].name}</strong>.
            Edit controls: proposed feature — not yet implemented.
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {MOCK_TAX_RULES.map(r => (
              <button key={r.id} onClick={() => setActiveRule(r.id)} className={`btn ${activeRule === r.id ? 'btn-primary' : 'btn-ghost'}`} style={{ flexShrink: 0, fontSize: '9px' }}>
                {r.name}
              </button>
            ))}
          </div>

          <TaxPreview taxRuleId={activeRule} />

          <div style={{ marginTop: '10px', fontSize: '9px', color: '#444' }}>
            Proposed default: splits/taxes apply to MISSION, HEIST, STREET_JOB income.
            CONTRACT income (hitman) is never taxed — solo income only.
            BLACK_MARKET_SALE tax: optional, configurable per family. System sink: proposed money drain mechanic.
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
