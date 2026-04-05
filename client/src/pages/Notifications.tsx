/**
 * Notifications — player notification center.
 * Route: /notifications
 */

import { useState } from 'react';
import { PageHeader, SectionPanel, EmptySlate } from '../components/layout/AppShell';
import { useGame } from '../lib/gameContext';
import { getPlayerNotifications } from '../lib/opsData';
import type { PlayerNotification, NotificationType } from '../../../shared/ops';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type NotifCategory = 'ALL' | 'UNREAD' | 'FAMILY' | 'JOBS' | 'SYSTEM';

const FAMILY_TYPES: NotificationType[] = [
  'PROMOTED', 'DEMOTED', 'NEW_CHAIN_MESSAGE', 'FAMILY_APPLICATION_ACCEPTED',
  'FAMILY_APPLICATION_REJECTED', 'NEW_FAMILY_BOARD_POST', 'BUSINESS_ASSIGNMENT_ADDED',
  'BUSINESS_ASSIGNMENT_REMOVED', 'WAR_DECLARED', 'DIPLOMACY_STATE_CHANGED',
];

const JOB_TYPES: NotificationType[] = [
  'JOB_INVITE_RECEIVED', 'PASSIVE_INCOME_PAYOUT',
];

const SYSTEM_TYPES: NotificationType[] = [
  'JAIL_ENTERED', 'JAIL_RELEASED', 'STASH_ROBBERY_ATTEMPTED',
  'SLEEP_MODE_EXPIRING', 'VACATION_EXPIRING', 'SEASON_ENDING_SOON',
  'RANK_ELIGIBLE', 'TURF_ATTACK_INCOMING',
];

function getCategory(type: NotificationType): 'FAMILY' | 'JOBS' | 'SYSTEM' {
  if ((FAMILY_TYPES as string[]).includes(type)) return 'FAMILY';
  if ((JOB_TYPES as string[]).includes(type)) return 'JOBS';
  return 'SYSTEM';
}

// ─────────────────────────────────────────────
// Notification icon
// ─────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationType }) {
  const cat = getCategory(type);
  const color = cat === 'FAMILY' ? '#818cf8' : cat === 'JOBS' ? '#ffcc33' : '#5580bb';
  const symbol = cat === 'FAMILY' ? '👥' : cat === 'JOBS' ? '💼' : '⚙️';

  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      background: `${color}22`, border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', flexShrink: 0,
    }}>
      {symbol}
    </div>
  );
}

// ─────────────────────────────────────────────
// Notification card
// ─────────────────────────────────────────────

function NotifCard({
  notif,
  onMarkRead,
}: {
  notif: PlayerNotification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      onClick={() => !notif.read && onMarkRead(notif.id)}
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        padding: '10px',
        borderBottom: '1px solid #1a1a1a',
        background: notif.read ? 'transparent' : '#110808',
        cursor: notif.read ? 'default' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <NotifIcon type={notif.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: notif.read ? '#888' : '#e0e0e0' }}>
            {notif.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '9px', color: '#444' }}>{relativeTime(notif.createdAt)}</span>
            {!notif.read && (
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cc3333' }} />
            )}
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
          {notif.body}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function NotificationsPage() {
  const { player } = useGame();
  const [rawNotifs, setRawNotifs] = useState<PlayerNotification[]>(
    () => getPlayerNotifications(player.id)
  );
  const [activeTab, setActiveTab] = useState<NotifCategory>('ALL');

  const unreadCount = rawNotifs.filter(n => !n.read).length;

  function markRead(id: string) {
    setRawNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setRawNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  const filtered = rawNotifs.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'FAMILY') return getCategory(n.type) === 'FAMILY';
    if (activeTab === 'JOBS')   return getCategory(n.type) === 'JOBS';
    if (activeTab === 'SYSTEM') return getCategory(n.type) === 'SYSTEM';
    return true;
  });

  const tabs: { id: NotifCategory; label: string }[] = [
    { id: 'ALL',    label: 'All' },
    { id: 'UNREAD', label: `Unread (${unreadCount})` },
    { id: 'FAMILY', label: 'Family' },
    { id: 'JOBS',   label: 'Jobs' },
    { id: 'SYSTEM', label: 'System' },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        sub={`${unreadCount} unread`}
        action={
          unreadCount > 0 ? (
            <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: '10px' }}>
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '12px',
        borderBottom: '1px solid #1a1a1a', paddingBottom: '1px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              fontSize: '10px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? '#cc3333' : '#555',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #cc3333' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <SectionPanel title="">
        {filtered.length === 0 ? (
          <EmptySlate msg="No notifications in this category." />
        ) : (
          filtered.map(n => (
            <NotifCard key={n.id} notif={n} onMarkRead={markRead} />
          ))
        )}
      </SectionPanel>

      {/* DEV note */}
      <div style={{ marginTop: '8px', fontSize: '9px', color: '#333', padding: '4px 8px' }}>
        DEV: Showing notifications for player {player.id}. Switch role to see different sets.
      </div>
    </div>
  );
}
