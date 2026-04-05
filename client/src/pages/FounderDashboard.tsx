/**
 * FounderDashboard — Operational command center for a new family's Don.
 * Route: /founder (shown instead of regular dashboard for NEW bootstrap_state families)
 *
 * Shows:
 *   - Protection timer (countdown)
 *   - Stabilization checklist with progress
 *   - Treasury snapshot
 *   - Starter inventory
 *   - Priority action list
 *   - Quick links to key management areas
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { useGame } from '../lib/gameContext';
import { MOCK_NEW_FAMILY, MOCK_NEW_FAMILY_ITEMS, ITEM_CATALOG } from '../lib/familyData';
import { evaluateStabilization, NEW_FAMILY_CONFIG } from '../../../shared/familyConfig';
import { fmt } from '../lib/mockData';

function ProtectionTimer({ family }: { family: typeof MOCK_NEW_FAMILY }) {
  if (!family.protection_expires_at) {
    return (
      <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: '#cc4444', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Protection Expired
        </div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          Your family is no longer protected. Stabilize immediately.
        </div>
      </div>
    );
  }

  const expiresAt   = new Date(family.protection_expires_at).getTime();
  const now         = Date.now();
  const msRemaining = Math.max(0, expiresAt - now);
  const daysLeft    = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  const hoursLeft   = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const isUrgent  = daysLeft < 3;
  const accent    = isUrgent ? '#cc4444' : '#818cf8';
  const bg        = isUrgent ? '#1a0808' : '#0a0d1a';
  const border    = isUrgent ? '#3a1010' : '#2a2a5a';

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '9px', color: accent, fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Protection Window {isUrgent ? '— EXPIRING SOON' : ''}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: accent, letterSpacing: '-0.02em' }}>
            {daysLeft}d {hoursLeft}h
          </div>
          <div style={{ fontSize: '10px', color: '#555', marginTop: '3px' }}>
            Until larger families can attack
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: '#555', lineHeight: '1.6' }}>
            Families with {NEW_FAMILY_CONFIG.protection_attack_threshold_members}+<br />
            members are blocked
          </div>
        </div>
      </div>
    </div>
  );
}

function StabilizationChecklist({ family }: { family: typeof MOCK_NEW_FAMILY }) {
  const result = evaluateStabilization({
    family_created_at: family.created_at,
    has_underboss:     family.underboss_ids.length > 0,
    has_consigliere:   family.consigliere_ids.length > 0,
    treasury_balance:  family.treasury,
    now:               new Date().toISOString(),
  });

  const milestones = [
    {
      key: 'underboss',
      label: 'Recruit an Underboss',
      done: result.milestones.underboss.met,
      priority: true,
      action: 'Go to Recruitment →',
      link: '/family/recruit',
    },
    {
      key: 'consigliere',
      label: 'Recruit a Consigliere',
      done: result.milestones.consigliere.met,
      priority: true,
      action: 'Go to Recruitment →',
      link: '/family/recruit',
    },
    {
      key: 'treasury',
      label: `Build treasury to $${(NEW_FAMILY_CONFIG.stabilization.require_minimum_treasury / 1000).toFixed(0)}K`,
      done: result.milestones.treasury.met,
      priority: false,
      note: `Current: ${fmt(result.milestones.treasury.current)}`,
      action: 'View Treasury →',
      link: '/family/treasury',
    },
  ];

  const allMet = result.is_stable;

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${allMet ? '#2a5a2a' : '#2a2a2a'}`, borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: allMet ? '#5ab85a' : '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Stabilization Checklist
        </div>
        <div style={{ fontSize: '9px', color: '#444' }}>
          {milestones.filter(m => m.done).length}/{milestones.length} done
        </div>
      </div>
      <div style={{ fontSize: '9px', color: '#555', marginBottom: '10px', lineHeight: '1.6' }}>
        {result.summary}
      </div>

      {milestones.map(m => (
        <div key={m.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #111' }}>
          <div style={{
            width: '16px', height: '16px', border: `2px solid ${m.done ? '#5ab85a' : m.priority ? '#cc7700' : '#333'}`,
            borderRadius: '3px', flexShrink: 0,
            background: m.done ? '#5ab85a' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {m.done && <span style={{ color: '#000', fontSize: '10px', fontWeight: '900' }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: m.done ? '#5ab85a' : '#c0c0c0', fontWeight: m.priority && !m.done ? '700' : '400' }}>
              {m.label}
              {m.priority && !m.done && (
                <span style={{ fontSize: '9px', color: '#cc7700', marginLeft: '6px', fontWeight: '700' }}>PRIORITY</span>
              )}
            </div>
            {m.note && !m.done && (
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{m.note}</div>
            )}
          </div>
          {!m.done && (
            <Link href={m.link}>
              <a style={{ fontSize: '9px', color: '#cc3333', textDecoration: 'none', flexShrink: 0 }}>{m.action}</a>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FounderDashboard() {
  const { player } = useGame();
  const family = MOCK_NEW_FAMILY;

  const priorityActions = [
    { priority: 1, label: 'Recruit your Underboss', detail: 'Non-negotiable. Operations need a second-in-command.', link: '/family/recruit', cta: 'Recruit →' },
    { priority: 2, label: 'Recruit a Consigliere', detail: 'You need counsel and diplomatic capacity immediately.', link: '/family/recruit', cta: 'Recruit →' },
    { priority: 3, label: 'Run jobs, build the treasury', detail: `Goal: $${(NEW_FAMILY_CONFIG.stabilization.require_minimum_treasury / 1000).toFixed(0)}K minimum.`, link: '/jobs', cta: 'Jobs →' },
    { priority: 4, label: 'Review tax & kick-up settings', detail: 'Set rates that are fair but sustain the family.', link: '/family/treasury', cta: 'Treasury →' },
    { priority: 5, label: 'Issue equipment to trusted members', detail: 'The 2× 9mm Pistols in the vault should go to people you trust.', link: '/family/inventory', cta: 'Vault →' },
    { priority: 6, label: 'Secure early turf', detail: 'Turf generates passive income and builds power score.', link: '/districts', cta: 'World →' },
  ];

  return (
    <div style={{ fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif", background: '#080808', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #111' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#cc3333', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Don's Command Center
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#e0e0e0' }}>
              {family.name || 'Your Family'}
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '3px' }}>
              Founded by {player.alias}
            </div>
          </div>
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: '4px', padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#555', marginBottom: '2px' }}>Status</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#cc7700' }}>BOOTSTRAP</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* Protection timer */}
        <ProtectionTimer family={family} />

        {/* Stabilization checklist */}
        <StabilizationChecklist family={family} />

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          {[
            { label: 'Treasury', value: fmt(family.treasury), color: '#4a9a4a' },
            { label: 'Members', value: (family.members.length + 1).toString(), color: '#e0e0e0' },
            { label: 'Vault Items', value: `${MOCK_NEW_FAMILY_ITEMS.length}`, color: '#e0e0e0' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '5px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', color: '#555', marginBottom: '3px' }}>{stat.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Starter vault */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Family Vault
            </div>
            <Link href="/family/inventory">
              <a style={{ fontSize: '10px', color: '#cc3333', textDecoration: 'none' }}>Manage →</a>
            </Link>
          </div>
          {MOCK_NEW_FAMILY_ITEMS.map(item => {
            const def = ITEM_CATALOG[item.item_definition_id];
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #111', fontSize: '11px' }}>
                <span style={{ color: '#c0c0c0' }}>{def?.name}</span>
                <span style={{ color: '#4a9a4a', fontSize: '9px', fontWeight: '700' }}>IN VAULT</span>
              </div>
            );
          })}
        </div>

        {/* Priority actions */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Priority Actions
          </div>
          {priorityActions.map(action => (
            <div key={action.priority} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #111' }}>
              <div style={{ fontSize: '10px', color: '#333', fontWeight: '700', flexShrink: 0, width: '16px', paddingTop: '2px' }}>
                {action.priority}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#c0c0c0', fontWeight: '600', marginBottom: '2px' }}>{action.label}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>{action.detail}</div>
              </div>
              <Link href={action.link}>
                <a style={{ fontSize: '10px', color: '#cc3333', textDecoration: 'none', flexShrink: 0 }}>{action.cta}</a>
              </Link>
            </div>
          ))}
        </div>

        {/* DEV note */}
        <div style={{ marginTop: '20px', background: '#0d0d00', border: '1px solid #2a2a00', borderRadius: '4px', padding: '10px', fontSize: '10px', color: '#666' }}>
          <strong style={{ color: '#cc9900' }}>DEV</strong> — This is the founder dashboard for a new family.
          In production: a cron job runs <code style={{ color: '#888' }}>evaluate_family_stabilization()</code> daily,
          updating <code style={{ color: '#888' }}>bootstrap_state</code> and firing analytics events.
          Protection expiry is checked server-side on every attack action.
        </div>
      </div>
    </div>
  );
}
