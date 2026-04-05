/**
 * InviteCapBadge.tsx — Shows the player's current invite reward multiplier.
 *
 * Displayed on mission/job cards when the player was invited (not self-initiated).
 * Visual states:
 *   100% — Full reward (green)
 *   50%  — Decayed, first tier (yellow)
 *   25%  — Decayed, second tier (orange)
 *   10%  — Floor / minimal reward (red)
 *
 * Hovering/tapping shows a tooltip explaining the soft cap.
 */

import { useState } from 'react';
import type { InviteTracker } from '../../../../shared/diplomacy';
import { INVITE_CAP_FULL_REWARD, INVITE_CAP_HALF_REWARD, INVITE_CAP_QUARTER_REWARD } from '../../../../shared/diplomacy';
import { TrendingDown, Info } from 'lucide-react';

interface Props {
  tracker: InviteTracker;
  /** If false, don't render — this is a personal job, no cap applies */
  isInvited?: boolean;
  /** Optional: base reward to show scaled amount */
  baseReward?: number;
}

function pctLabel(m: number): string {
  return `${Math.round(m * 100)}%`;
}

function capColor(m: number): string {
  if (m >= 1.0) return '#4a9a4a';
  if (m >= 0.5) return '#cc9900';
  if (m >= 0.25) return '#cc7700';
  return '#cc3333';
}

export function InviteCapBadge({ tracker, isInvited = true, baseReward }: Props) {
  const [showTip, setShowTip] = useState(false);
  if (!isInvited) return null;

  const m = tracker.reward_multiplier;
  const color = capColor(m);
  const isDecayed = m < 1.0;

  const remaining = {
    toHalf:    Math.max(0, INVITE_CAP_FULL_REWARD - tracker.count_12h + 1),
    toQuarter: Math.max(0, INVITE_CAP_HALF_REWARD - tracker.count_12h + 1),
    toFloor:   Math.max(0, INVITE_CAP_QUARTER_REWARD - tracker.count_12h + 1),
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={() => setShowTip(!showTip)}
        title="External invite reward multiplier"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: '9px', fontWeight: 'bold', color,
          border: `1px solid ${color}44`, background: `${color}11`,
          padding: '2px 6px', cursor: 'pointer',
        }}
        data-testid="invite-cap-badge"
      >
        {isDecayed && <TrendingDown size={9} />}
        Invite: {pctLabel(m)}
        {baseReward && isDecayed && (
          <span style={{ color: '#888', fontWeight: 'normal' }}>
            &nbsp;(${Math.floor(baseReward * m).toLocaleString()})
          </span>
        )}
      </span>

      {showTip && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 30,
          minWidth: '220px', background: '#1a1a1a', border: '1px solid #2a2a2a',
          padding: '10px', marginTop: '4px', fontSize: '10px', lineHeight: '1.55',
        }}>
          <div style={{ fontWeight: 'bold', color: '#ffcc33', marginBottom: '6px' }}>
            External Invite Reward Cap
          </div>
          <div style={{ color: '#aaa', marginBottom: '6px' }}>
            You've completed <strong style={{ color: '#e0e0e0' }}>{tracker.count_12h}</strong> invited
            jobs in the last 12 hours.
            Your invite rewards are currently at <strong style={{ color }}>{pctLabel(m)}</strong>.
          </div>
          <div style={{ fontSize: '9px', color: '#555', borderTop: '1px solid #2a2a2a', paddingTop: '6px' }}>
            <div>First {INVITE_CAP_FULL_REWARD} jobs — 100% reward</div>
            <div>Jobs {INVITE_CAP_FULL_REWARD + 1}–{INVITE_CAP_HALF_REWARD} — 50% reward</div>
            <div>Jobs {INVITE_CAP_HALF_REWARD + 1}–{INVITE_CAP_QUARTER_REWARD} — 25% reward</div>
            <div>Jobs 10+ — 10% reward (floor)</div>
          </div>
          <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>
            Cap resets every 12 hours. Personal jobs are never capped.
          </div>
          <button
            onClick={() => setShowTip(false)}
            style={{ marginTop: '6px', fontSize: '9px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )}
    </span>
  );
}

/**
 * InviteCapStatus — Larger status block for profile/stats screens.
 */
export function InviteCapStatus({ tracker }: { tracker: InviteTracker }) {
  const m = tracker.reward_multiplier;
  const color = capColor(m);
  const barPct = Math.min(100, (tracker.count_12h / 10) * 100);

  return (
    <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span className="label-caps">External Invite Reward Rate</span>
        <span style={{ fontWeight: 'bold', fontSize: '13px', color }}>{pctLabel(m)}</span>
      </div>

      {/* Progress bar showing cap usage */}
      <div style={{ height: '6px', background: '#1a1a1a', border: '1px solid #2a2a2a', marginBottom: '6px' }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: color, transition: 'width 0.3s' }} />
      </div>

      <div style={{ fontSize: '10px', color: '#888' }}>
        {tracker.count_12h} of 10 cap slots used this 12h window.
        {m < 1.0 && (
          <span style={{ color, marginLeft: '4px' }}>
            Rewards decayed to {pctLabel(m)}.
          </span>
        )}
        {m >= 1.0 && (
          <span style={{ color: '#4a9a4a', marginLeft: '4px' }}>
            Full reward on next {INVITE_CAP_FULL_REWARD - tracker.count_12h + 1} invite{INVITE_CAP_FULL_REWARD - tracker.count_12h + 1 !== 1 ? 's' : ''}.
          </span>
        )}
      </div>
    </div>
  );
}
