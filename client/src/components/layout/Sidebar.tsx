import { Link, useLocation } from 'wouter';
import { useGame } from '../../lib/gameContext';
import { useAuth } from '../../lib/authContext';
import { can } from '../../lib/permissions';
import { fmt } from '../../lib/mockData';
import { getUnreadNotifications } from '../../lib/opsData';

const NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/',               label: 'Dashboard' },
      { href: '/profile',        label: 'My Profile' },
      { href: '/notifications',  label: 'Notifications', showBadge: true },
      { href: '/stats',          label: 'Round Stats' },
      { href: '/archetype',      label: 'Choose Archetype' },
    ],
  },
  {
    label: 'Family',
    familyOnly: true,
    items: [
      { href: '/family',         label: 'Family Overview' },
      { href: '/missions',       label: 'Missions & Heists' },
      { href: '/family/recruit', label: 'Recruits', capoPlus: true },
      { href: '/family/board',   label: 'Family Board' },
      { href: '/family/turf',      label: 'Turf & Businesses' },
      { href: '/family/inventory',  label: 'Family Vault' },
      { href: '/family/treasury',   label: 'Treasury' },
      { href: '/family/feed',    label: 'Family Feed' },
      { href: '/mailbox',        label: 'Mailbox' },
      { href: '/crews',          label: 'Crews' },
    ],
  },
  {
    label: 'Jobs',
    items: [
      { href: '/jobs',        label: 'Job Board' },
      { href: '/jobs-admin',  label: 'DEV: Job Catalog' },
    ],
  },
  {
    label: 'World',
    items: [
      { href: '/obituaries',         label: 'Obituaries' },
      { href: '/world/feed',         label: 'World Feed' },
      { href: '/family-leaderboard', label: 'Top Families' },
      { href: '/protection',         label: 'Sleep / Vacation' },
      { href: '/districts',          label: 'District Map' },
      { href: '/season',             label: 'Season Standings' },
      { href: '/world-admin',        label: 'DEV: World Config' },
    ],
  },
  {
    label: 'Economy',
    items: [
      { href: '/inventory',  label: 'Inventory' },
      { href: '/bank',       label: 'Bank & Stash' },
      { href: '/market',     label: 'Black Market' },
      { href: '/treasury',   label: 'Treasury',    familyOnly: true },
      { href: '/directory',  label: 'Families' },
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
    label: 'Incarceration',
    items: [
      { href: '/jail',    label: 'County Jail' },
      { href: '/prison',  label: 'The Box (Hitmen)', hitmanOnly: true },
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
  {
    label: 'Underworld',
    items: [
      { href: '/contracts',   label: 'Contract Board' },
      { href: '/hitmen',      label: 'Hitman Registry' },
      { href: '/leaderboard', label: 'Leaderboard' },
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
    label: 'Dev Tools',
    items: [
      { href: '/admin',       label: 'Admin Panel' },
      { href: '/progression', label: 'Rank Progression' },
      { href: '/onboarding',  label: 'Onboarding Flow' },
    ],
  },
];

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

export function Sidebar({ onNavClick }: SidebarProps) {
  const [loc] = useLocation();
  const { player, gameRole, setPlayer, presets } = useGame();
  const { signOut, isConfigured } = useAuth();
  const isHitman  = gameRole === 'SOLO_HITMAN';
  const hasFamily = !!player.family_id;

  const isActive = (href: string) =>
    href === '/' ? loc === '/' : loc.startsWith(href);

  const unreadCount = getUnreadNotifications(player.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Player summary */}
      <div className="classic-player-block" style={{ flexShrink: 0 }}>
        <div className="player-alias">{player.alias}</div>
        <div className="player-role">
          {isHitman ? 'Solo Hitman' : (player.family_role ?? 'Unaffiliated')} • {player.archetype}
        </div>
        <div className="player-cash">{fmt(player.stats.cash)}</div>
        {player.family_id && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Corrado Family</div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        {NAV.map(section => {
          if (section.hitmanOnly && !isHitman) return null;
          if (section.familyOnly && !hasFamily) return null;
          if (isHitman && section.label === 'Family') return null;

          const items = (section.items as NavItem[]).filter(item => {
            if (item.capoPlus && !can(gameRole, 'INVITE_RECRUIT')) return false;
            if (item.familyOnly && !hasFamily) return false;
            return true;
          });
          if (!items.length) return null;

          return (
            <div key={section.label}>
              <div className="classic-nav-section nav-section-label">{section.label}</div>
              {items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={onNavClick}
                      className={`classic-nav-link nav-item ${active ? 'active' : ''}`}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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

      {/* ── DEV: role switcher ─────────────────── */}
      <div className="classic-role-switcher" style={{ flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
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

      {/* ── Sign out ─────────────────── */}
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
          {isConfigured ? 'Sign Out' : 'DEV: Sign Out'}
        </button>
      </div>

    </div>
  );
}
