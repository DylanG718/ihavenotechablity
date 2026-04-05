import { Link, useLocation } from 'wouter';
import { useGame } from '../../lib/gameContext';
import { useAuth } from '../../lib/authContext';
import { can } from '../../lib/permissions';
import { fmt } from '../../lib/mockData';
import { getUnreadNotifications } from '../../lib/opsData';
import { ENABLE_DEV_TOOLS, ENABLE_ADMIN_TOOLS } from '../../lib/env';

// ─────────────────────────────────────────────
// Production nav — player-facing sections only.
// DEV and Admin items are injected conditionally at the bottom
// based on ENABLE_DEV_TOOLS / ENABLE_ADMIN_TOOLS flags.
// ─────────────────────────────────────────────

const PLAYER_NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/',               label: 'Dashboard' },
      { href: '/profile',        label: 'My Profile' },
      { href: '/notifications',  label: 'Notifications', showBadge: true },
      { href: '/stats',          label: 'Round Stats' },
    ],
  },
  {
    label: 'Family',
    familyOnly: true,
    items: [
      { href: '/family',            label: 'Family Overview' },
      { href: '/missions',          label: 'Missions & Heists' },
      { href: '/family/recruit',    label: 'Recruits', capoPlus: true },
      { href: '/family/board',      label: 'Family Board' },
      { href: '/family/turf',       label: 'Turf & Businesses' },
      { href: '/family/inventory',  label: 'Family Vault', capoPlus: true },
      { href: '/family/treasury',   label: 'Treasury', capoPlus: true },
      { href: '/family/feed',       label: 'Family Feed' },
      { href: '/mailbox',           label: 'Mailbox' },
      { href: '/crews',             label: 'Crews' },
    ],
  },
  {
    label: 'Jobs',
    items: [
      { href: '/jobs', label: 'Job Board' },
    ],
  },
  {
    label: 'World',
    items: [
      { href: '/districts',          label: 'District Map' },
      { href: '/world/feed',         label: 'World Feed' },
      { href: '/family-leaderboard', label: 'Top Families' },
      { href: '/season',             label: 'Season Standings' },
      { href: '/obituaries',         label: 'Obituaries' },
    ],
  },
  {
    label: 'Economy',
    items: [
      { href: '/inventory',  label: 'Inventory' },
      { href: '/bank',       label: 'Bank & Stash' },
      { href: '/market',     label: 'Black Market' },
      { href: '/directory',  label: 'Family Directory' },
    ],
  },
  {
    label: 'Diplomacy',
    familyOnly: true,
    items: [
      { href: '/diplomacy',  label: 'Diplomacy' },
      { href: '/sitdown',    label: 'Sitdown Room' },
    ],
  },
  {
    label: 'Underworld',
    items: [
      { href: '/contracts',   label: 'Contract Board' },
      { href: '/hitmen',      label: 'Hitman Registry' },
      { href: '/leaderboard', label: 'Hitman Leaderboard' },
    ],
  },
  {
    label: 'Hitman',
    hitmanOnly: true,
    items: [
      { href: '/downtime', label: 'Downtime Activities' },
      { href: '/prison',   label: 'The Box (Prison)' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/jail',       label: 'County Jail' },
      { href: '/protection', label: 'Sleep / Vacation' },
    ],
  },
  {
    label: 'Combat',
    items: [
      { href: '/armory',    label: 'Armory' },
      { href: '/defenses',  label: 'My Defenses' },
      { href: '/attack',    label: 'Attack' },
    ],
  },
];

// Admin tools — gated behind ENABLE_ADMIN_TOOLS
const ADMIN_NAV = [
  {
    label: '— Admin —',
    adminOnly: true,
    items: [
      { href: '/admin',       label: 'Admin Panel' },
      { href: '/progression', label: 'Rank Progression' },
    ],
  },
];

// Dev-only tools — gated behind ENABLE_DEV_TOOLS
const DEV_NAV = [
  {
    label: '— Dev —',
    devOnly: true,
    items: [
      { href: '/jobs-admin',  label: 'Job Catalog' },
      { href: '/world-admin', label: 'World Config' },
      { href: '/onboarding',  label: 'Onboarding Flow' },
      { href: '/founder',     label: 'Founder Dashboard' },
    ],
  },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  capoPlus?: boolean;
  familyOnly?: boolean;
  hitmanOnly?: boolean;
  showBadge?: boolean;
}

interface SidebarProps {
  onNavClick?: () => void;
}

// ─────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────

export function Sidebar({ onNavClick }: SidebarProps) {
  const [loc]    = useLocation();
  const { player, gameRole, setPlayer, presets } = useGame();
  const { signOut } = useAuth();
  const isHitman  = gameRole === 'SOLO_HITMAN';
  const hasFamily = !!player.family_id;

  const isActive = (href: string) =>
    href === '/' ? loc === '/' : loc.startsWith(href);

  const unreadCount = getUnreadNotifications(player.id);

  // Combine sections based on env flags
  const allSections = [
    ...PLAYER_NAV,
    ...(ENABLE_ADMIN_TOOLS ? ADMIN_NAV : []),
    ...(ENABLE_DEV_TOOLS   ? DEV_NAV   : []),
  ];

  function shouldShowSection(section: typeof PLAYER_NAV[0]) {
    if ((section as { hitmanOnly?: boolean }).hitmanOnly && !isHitman) return false;
    if ((section as { familyOnly?: boolean }).familyOnly && !hasFamily) return false;
    if (isHitman && section.label === 'Family') return false;
    return true;
  }

  function filterItems(items: NavItem[]) {
    return items.filter(item => {
      if (item.capoPlus && !can(gameRole, 'INVITE_RECRUIT')) return false;
      if (item.familyOnly && !hasFamily) return false;
      return true;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Player summary */}
      <div className="classic-player-block" style={{ flexShrink: 0 }}>
        <div className="player-alias">{player.alias}</div>
        <div className="player-role">
          {isHitman ? 'Solo Hitman' : (player.family_role ?? 'Unaffiliated')} · {player.archetype}
        </div>
        <div className="player-cash">{fmt(player.stats.cash)}</div>
        {player.family_id && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            The Corrado Family
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        {allSections.map(section => {
          if (!shouldShowSection(section)) return null;

          const items = filterItems(section.items as NavItem[]);
          if (!items.length) return null;

          // Section label styling: dim for internal sections
          const isInternal = (section as { adminOnly?: boolean; devOnly?: boolean }).adminOnly
            || (section as { adminOnly?: boolean; devOnly?: boolean }).devOnly;

          return (
            <div key={section.label}>
              <div
                className="classic-nav-section nav-section-label"
                style={isInternal ? { color: '#3a3a3a', fontSize: '9px' } : undefined}
              >
                {section.label}
              </div>
              {items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={onNavClick}
                      className={`classic-nav-link nav-item ${active ? 'active' : ''}`}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        ...(isInternal ? { color: '#4a4a4a', fontSize: '11px' } : {}),
                      }}
                    >
                      <span>{item.label}</span>
                      {(item as NavItem).showBadge && unreadCount > 0 && (
                        <span style={{
                          background: '#cc3333', color: '#fff',
                          borderRadius: '10px', fontSize: '8px',
                          padding: '1px 5px', fontWeight: 'bold', lineHeight: '14px',
                          minWidth: '16px', textAlign: 'center',
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </a>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── DEV: role switcher (dev only) ─────────────────── */}
      {ENABLE_DEV_TOOLS && (
        <div className="classic-role-switcher" style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3a3a3a', marginBottom: '6px' }}>
            DEV: Switch Role
          </div>
          <select
            value={player.id}
            onChange={e => { setPlayer(e.target.value); onNavClick?.(); }}
            style={{ width: '100%' }}
            data-testid="dev-role-switcher"
          >
            {presets.map(p => (
              <option key={p.playerId} value={p.playerId}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Sign out ─────────────────────────────────────── */}
      <div style={{ padding: '8px 8px 12px', flexShrink: 0, borderTop: '1px solid #111' }}>
        <button
          onClick={() => { onNavClick?.(); signOut(); }}
          data-testid="button-signout"
          style={{
            width: '100%', background: 'none', border: '1px solid #222',
            color: '#444', cursor: 'pointer', fontSize: '9px',
            padding: '6px', borderRadius: '3px', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Sign Out
        </button>
      </div>

    </div>
  );
}
