import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGame } from '../lib/gameContext';
import { MOCK_FAMILY, MOCK_PLAYERS, fmt } from '../lib/mockData';
import { can } from '../lib/permissions';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import { RoleBadge, StatusBadge } from '../components/ui/Badges';
import type { FamilyRole, FamilyMember } from '../../../shared/schema';
import { X, ChevronDown, UserPlus, Crown, Shield, Users, Search, CheckCircle, MessageSquare, Briefcase, AlertTriangle } from 'lucide-react';
import { UNIVERSAL_JOBS } from '../lib/jobsData';
import { getFamilyFeed } from '../lib/opsData';

// ── Promotion ladder ─────────────────────────

const NEXT_ROLE: Partial<Record<FamilyRole, FamilyRole>> = {
  RECRUIT: 'ASSOCIATE', ASSOCIATE: 'SOLDIER', SOLDIER: 'CAPO', CAPO: 'UNDERBOSS',
};
const NEXT_ROLE_LABEL: Partial<Record<FamilyRole, string>> = {
  RECRUIT: 'Associate', ASSOCIATE: 'Soldier', SOLDIER: 'Capo', CAPO: 'Underboss',
};

// ── Member card used in the tree ─────────────

function MemberCard({
  member, showActions, onPromote, onKick, promoted, kicked, isBoss,
}: {
  member: FamilyMember;
  showActions: boolean;
  onPromote: (id: string) => void;
  onKick: (id: string) => void;
  promoted: Record<string, boolean>;
  kicked: Record<string, boolean>;
  isBoss: boolean;
}) {
  const p = MOCK_PLAYERS[member.player_id];
  if (!p || kicked[member.player_id]) return null;

  const meetsReqs = member.missions_completed >= 2 && member.money_earned >= 5000;
  const nextLabel = NEXT_ROLE_LABEL[member.role as FamilyRole];
  const isWasPromoted = promoted[member.player_id];

  const roleBg: Record<string, string> = {
    RUNNER:    'border-green-900/60 bg-green-950/10',
    BOSS:      'border-red-900/60 bg-red-950/20',  // BOSS stays for FamilyRole
    UNDERBOSS: 'border-yellow-900/40 bg-yellow-950/10',
    CONSIGLIERE: 'border-yellow-900/40 bg-yellow-950/10',
    CAPO:      'border-blue-900/40 bg-blue-950/10',
    SOLDIER:   'border-border bg-card',
    ASSOCIATE: 'border-border bg-card',
    RECRUIT:   'border-border/40 bg-muted/20',
  };

  return (
    <div className={`border rounded-sm px-3 py-2.5 min-w-[160px] max-w-[200px] ${roleBg[member.role] ?? 'border-border bg-card'}`}
      data-testid={`tree-node-${p.id}`}
    >
      {/* Name + role */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-bold text-foreground truncate">{p.alias}</span>
        {member.role === 'BOSS' && <Crown size={10} className="text-cash shrink-0" />}
      </div>
      <div className="flex items-center gap-1 mb-2">
        <RoleBadge role={member.role} />
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-muted-foreground mb-2">
        <span>{p.archetype}</span>
        <span title="Missions">{member.missions_completed}m</span>
        <span className="text-cash">{fmt(member.money_earned)}</span>
      </div>

      <StatusBadge status={p.player_status} />

      {/* Actions */}
      {showActions && !isBoss && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {nextLabel && !isWasPromoted && (
            <button
              onClick={() => onPromote(member.player_id)}
              disabled={!meetsReqs}
              data-testid={`promote-${p.id}`}
              className={`btn text-xs py-0.5 ${meetsReqs ? 'btn-success' : 'btn-ghost opacity-40'}`}
              title={meetsReqs ? `Promote to ${nextLabel}` : 'Does not meet requirements'}
            >
              ↑ {nextLabel}
            </button>
          )}
          {isWasPromoted && <span className="text-xs text-success">Promoted ✓</span>}
          <button
            onClick={() => onKick(member.player_id)}
            className="btn btn-danger text-xs py-0.5"
            data-testid={`kick-${p.id}`}
          >
            <X size={9} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Connector line SVG helpers ───────────────

function VLine() {
  return <div className="w-px h-5 bg-border mx-auto" />;
}

function HBranch({ count }: { count: number }) {
  if (count <= 1) return <div className="w-px h-5 bg-border mx-auto" />;
  return (
    <div className="relative flex justify-center">
      <div className="absolute top-0 left-0 right-0 flex">
        {/* Horizontal bar connecting children */}
        <div className="flex-1 h-px bg-border mt-5" style={{ marginLeft: '50%', marginRight: '50%' }} />
      </div>
      <div className="w-px h-5 bg-border" />
    </div>
  );
}

// ── Full family tree ─────────────────────────

function FamilyTree({
  canManage, promoted, kicked, onPromote, onKick,
}: {
  canManage: boolean;
  promoted: Record<string, boolean>;
  kicked: Record<string, boolean>;
  onPromote: (id: string) => void;
  onKick: (id: string) => void;
}) {
  const boss        = MOCK_FAMILY.members.find(m => m.role === 'BOSS');
  const underbosses = MOCK_FAMILY.members.filter(m => m.role === 'UNDERBOSS');
  const capos       = MOCK_FAMILY.members.filter(m => m.role === 'CAPO');
  const soldiers    = MOCK_FAMILY.members.filter(m => ['SOLDIER','ASSOCIATE'].includes(m.role));
  const recruits    = MOCK_FAMILY.members.filter(m => m.role === 'RECRUIT');

  const treeCard = (m: FamilyMember, isBoss = false) => (
    <MemberCard
      key={m.player_id}
      member={m}
      showActions={canManage}
      onPromote={onPromote}
      onKick={onKick}
      promoted={promoted}
      kicked={kicked}
      isBoss={isBoss}
    />
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-fit">

        {/* ── BOSS ── */}
        {boss && (
          <div className="flex justify-center mb-0">
            {treeCard(boss, true)}
          </div>
        )}

        {/* Connector to underboss row */}
        {underbosses.length > 0 && <VLine />}

        {/* ── UNDERBOSS row ── */}
        {underbosses.length > 0 && (
          <>
            <div className="flex justify-center gap-6">
              {underbosses.map(m => (
                <div key={m.player_id} className="flex flex-col items-center">
                  {treeCard(m)}
                </div>
              ))}
            </div>
            {/* Horizontal bar */}
            {underbosses.length > 1 && (
              <div className="relative flex justify-center mx-auto" style={{ width: `${underbosses.length * 220}px` }}>
                <div className="absolute top-0 h-px bg-border" style={{ left: '10%', right: '10%' }} />
              </div>
            )}
          </>
        )}

        {/* Connector to capo row */}
        {capos.length > 0 && <VLine />}

        {/* ── CAPO row ── */}
        {capos.length > 0 && (
          <div className="flex justify-center gap-5">
            {capos.map(m => treeCard(m))}
          </div>
        )}

        {/* Connector to soldiers */}
        {soldiers.length > 0 && <VLine />}

        {/* ── SOLDIER / ASSOCIATE row ── */}
        {soldiers.length > 0 && (
          <div className="flex justify-center flex-wrap gap-3">
            {soldiers.map(m => treeCard(m))}
          </div>
        )}

        {/* Recruits — separate, dashed box */}
        {recruits.length > 0 && (
          <>
            <div className="flex justify-center mt-6 mb-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px w-12 border-t border-dashed border-border" />
                <span className="label-caps">Recruits (probationary)</span>
                <div className="h-px w-12 border-t border-dashed border-border" />
              </div>
            </div>
            <div className="flex justify-center flex-wrap gap-3">
              {recruits.map(m => treeCard(m))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Edit Family Modal (Boss only) ─────────────

function EditFamilyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(MOCK_FAMILY.name);
  const [motto, setMotto] = useState(MOCK_FAMILY.motto ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="panel w-full max-w-md" data-testid="edit-family-modal">
        <div className="panel-header">
          <span className="panel-title">Edit Family</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-caps block mb-1.5">Family Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="game-input"
              data-testid="edit-family-name"
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Motto</label>
            <input
              value={motto}
              onChange={e => setMotto(e.target.value)}
              className="game-input"
              placeholder="Family motto..."
              data-testid="edit-family-motto"
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Max Underbosses</label>
            <select className="game-input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3" selected>3</option>
            </select>
          </div>
          <div className="divider pt-4">
            <p className="label-caps mb-2 text-danger">Danger Zone</p>
            <button className="btn btn-danger w-full text-xs">
              Dissolve Family (irreversible)
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-primary py-2 text-sm"
            data-testid="save-family"
          >
            Save Changes
          </button>
          <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Modal ──────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="panel w-full max-w-sm" data-testid="invite-modal">
        <div className="panel-header">
          <span className="panel-title">Invite Recruit</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-caps block mb-1.5">Player Alias or Username</label>
            <input className="game-input" placeholder="Search for a player..." data-testid="invite-search" />
          </div>
          <p className="text-xs text-muted-foreground">
            Invitees join as Recruits with limited access. They must be promoted by a Capo or above.
          </p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-primary py-2 text-sm" data-testid="send-invite">
            Send Invite
          </button>
          <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Player Profile Modal ──────────────────────

type RecruitPlayer = ReturnType<typeof Object.values<typeof MOCK_PLAYERS>>[number];

function PlayerProfileModal({
  player,
  onClose,
}: {
  player: RecruitPlayer;
  onClose: () => void;
}) {
  const [view, setView] = useState<'profile' | 'message' | 'job'>('profile');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobSent, setJobSent] = useState(false);

  const universalJobs = UNIVERSAL_JOBS.slice(0, 5);

  const ARCHETYPE_COLORS: Record<string, string> = {
    EARNER:    '#ffcc33',
    MUSCLE:    '#cc3333',
    SHOOTER:   '#cc3333',
    SCHEMER:   '#6699ff',
    RACKETEER: '#ccaa00',
    BOSS:      '#ffcc33',
  };
  const archetypeColor = ARCHETYPE_COLORS[player.archetype] ?? '#888';

  function sendMessage() {
    if (!msgSubject.trim() || !msgBody.trim()) return;
    setMsgSent(true);
    setTimeout(() => { setMsgSent(false); setView('profile'); }, 2000);
  }

  function sendJob() {
    if (!selectedJob) return;
    setJobSent(true);
    setTimeout(() => { setJobSent(false); setView('profile'); }, 2000);
  }

  const stats = [
    { l: 'Cash',         v: fmt(player.stats.cash), cls: 'text-cash' },
    { l: 'Respect',      v: player.stats.respect,    cls: '' },
    { l: 'Heat',         v: player.stats.heat,        cls: player.stats.heat > 40 ? 'text-heat' : '' },
    { l: 'Strength',     v: player.stats.strength,    cls: '' },
    { l: 'Accuracy',     v: player.stats.accuracy,    cls: '' },
    { l: 'Intelligence', v: player.stats.intelligence, cls: '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="panel-title">{player.alias}</span>
            <StatusBadge status={player.player_status} />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Sub-nav */}
        <div className="flex border-b border-border">
          {(['profile', 'message', 'job'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-xs font-semibold relative transition-colors
                ${view === v
                  ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {v === 'profile' ? 'Profile' : v === 'message' ? 'Send Message' : 'Send Job'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {view === 'profile' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center text-sm font-bold"
                  style={{ background: '#1a1a1a', border: '1px solid #333', color: archetypeColor }}>
                  {player.alias.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{player.alias}</div>
                  <div className="text-xs text-muted-foreground">@{player.username}</div>
                  <div className="text-xs mt-0.5" style={{ color: archetypeColor }}>{player.archetype}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {stats.map(({ l, v, cls }) => (
                  <div key={l} className="panel p-2.5">
                    <div className="label-caps text-xs">{l}</div>
                    <div className={`font-bold text-sm ${cls}`}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setView('message')} className="btn btn-primary text-xs flex-1">
                  <MessageSquare size={11} /> Send Message
                </button>
                <button onClick={() => setView('job')} className="btn btn-ghost text-xs flex-1">
                  <Briefcase size={11} /> Send Job
                </button>
              </div>
            </div>
          )}

          {view === 'message' && (
            <div className="space-y-3">
              {msgSent ? (
                <div className="text-center py-6">
                  <CheckCircle size={24} className="text-success mx-auto mb-2" />
                  <p className="text-sm text-success">Message sent to {player.alias}.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label-caps block mb-1">Subject</label>
                    <input className="game-input" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Subject line..." />
                  </div>
                  <div>
                    <label className="label-caps block mb-1">Message</label>
                    <textarea className="game-input" rows={5} value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Write your message..." style={{ resize: 'vertical' }} />
                  </div>
                  <button onClick={sendMessage} disabled={!msgSubject.trim() || !msgBody.trim()} className={`btn w-full ${msgSubject.trim() && msgBody.trim() ? 'btn-primary' : 'btn-ghost opacity-40'}`}>
                    Send Message
                  </button>
                </>
              )}
            </div>
          )}

          {view === 'job' && (
            <div className="space-y-2">
              {jobSent ? (
                <div className="text-center py-6">
                  <CheckCircle size={24} className="text-success mx-auto mb-2" />
                  <p className="text-sm text-success">Job invite sent to {player.alias}.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">Select a job to send as an invite to this player.</p>
                  {universalJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job.id)}
                      className={`panel p-3 cursor-pointer transition-colors ${selectedJob === job.id ? 'border-primary/60' : 'hover:border-border/60'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{job.name}</span>
                        <span className="text-xs text-cash">{fmt(job.reward_band_min)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{job.lore_tagline}</p>
                    </div>
                  ))}
                  <button onClick={sendJob} disabled={!selectedJob} className={`btn w-full mt-2 ${selectedJob ? 'btn-primary' : 'btn-ghost opacity-40'}`}>
                    Send Job Invite
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Witness Protection Modal ──────────────────

function WitnessProtectionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [step, setStep] = useState(1);
  const { player } = useGame();
  const wpAlias = `${player.alias}-WP${Math.floor(1000 + Math.random() * 9000)}`;
  const cashPenalty = Math.floor(player.stats.cash * 0.3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="panel w-full max-w-md border-red-900/60" style={{ background: 'hsl(0 30% 5%)' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid rgba(204,51,51,0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-danger" />
            <span className="panel-title text-danger">Witness Protection</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <InfoAlert variant="danger">
                <strong>This cannot be undone.</strong> Entering witness protection permanently removes you from the family.
              </InfoAlert>
              <div className="space-y-2 text-xs text-muted-foreground" style={{ lineHeight: 1.6 }}>
                <p>You will be removed from <strong className="text-foreground">{MOCK_FAMILY.name}</strong> immediately.</p>
                <p>Your alias will be changed to: <strong className="text-danger">{wpAlias}</strong></p>
                <p>Cash penalty (FBI seizes assets): <strong className="text-danger">−{fmt(cashPenalty)} (30%)</strong></p>
                <p>You cannot rejoin any family for <strong className="text-foreground">30 days</strong>.</p>
                <p>An obituary will be published for your departure.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="btn btn-danger flex-1">
                  I understand — continue
                </button>
                <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <InfoAlert variant="danger">
                <strong>FINAL CONFIRMATION</strong> — Are you absolutely certain?
              </InfoAlert>
              <p className="text-xs text-muted-foreground">
                Type your alias to confirm: <strong className="text-foreground">{player.alias}</strong>
              </p>
              <ConfirmAliasInput alias={player.alias} onConfirm={onConfirm} onCancel={onClose} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmAliasInput({ alias, onConfirm, onCancel }: { alias: string; onConfirm: () => void; onCancel: () => void }) {
  const [val, setVal] = useState('');
  const matches = val.trim() === alias;
  return (
    <div className="space-y-3">
      <input className="game-input" value={val} onChange={e => setVal(e.target.value)} placeholder={`Type "${alias}" to confirm`} />
      <div className="flex gap-3">
        <button onClick={onConfirm} disabled={!matches} className={`btn flex-1 ${matches ? 'btn-danger' : 'btn-ghost opacity-40'}`}>
          Enter Witness Protection
        </button>
        <button onClick={onCancel} className="btn btn-ghost px-4">Cancel</button>
      </div>
    </div>
  );
}

// ── Recruit Tab ─────────────────────────────────

// All players not in any family and not Hitmen — available for recruitment
const RECRUITABLE_PLAYERS = Object.values(MOCK_PLAYERS).filter(
  p => p.family_id === null && p.archetype !== 'HITMAN'
);

const ARCHETYPE_COLORS: Record<string, string> = {
  EARNER:    'text-cash',
  MUSCLE:    'text-danger',
  SHOOTER:   'text-danger',
  SCHEMER:   'text-blue-400',
  RACKETEER: 'text-yellow-400',
};

function RecruitTab({ canInvite }: { canInvite: boolean }) {
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>('ALL');
  const [profilePlayer, setProfilePlayer] = useState<(typeof MOCK_PLAYERS)[string] | null>(null);

  const archetypes = ['ALL', 'EARNER', 'MUSCLE', 'SHOOTER', 'SCHEMER', 'RACKETEER'];

  const filtered = RECRUITABLE_PLAYERS.filter(p => {
    const matchSearch = search === '' ||
      p.alias.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase());
    const matchArch = filter === 'ALL' || p.archetype === filter;
    return matchSearch && matchArch;
  });

  return (
    <div>
      {/* Permission gate */}
      {!canInvite && (
        <InfoAlert variant="warn">
          Only Capos and above can recruit new members.
        </InfoAlert>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            className="game-input pl-8"
            placeholder="Search by name or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="recruit-search"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {archetypes.map(a => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`btn text-xs ${filter === a ? 'btn-primary' : 'btn-ghost'}`}
              data-testid={`filter-${a.toLowerCase()}`}
            >
              {a === 'ALL' ? 'All' : a.charAt(0) + a.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="label-caps mb-3">
        {filtered.length} player{filtered.length !== 1 ? 's' : ''} available · unaffiliated
      </div>

      {/* Player list */}
      {filtered.length === 0 ? (
        <div className="panel p-8 text-center text-xs text-muted-foreground">
          No unaffiliated players match your search.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div
              key={p.id}
              className="panel p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-border/60 transition-colors"
              onClick={() => setProfilePlayer(p)}
              data-testid={`recruit-row-${p.id}`}
            >
              {/* Left: identity */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-foreground">{p.alias}</span>
                  <span className="text-xs text-muted-foreground">@{p.username}</span>
                  <StatusBadge status={p.player_status} />
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className={`font-semibold ${ARCHETYPE_COLORS[p.archetype] ?? ''}`}>
                    {p.archetype}
                  </span>
                  <span className="text-muted-foreground">{fmt(p.stats.cash)} cash</span>
                  <span className="text-muted-foreground">{p.stats.respect} rep</span>
                  <span className={p.stats.heat > 20 ? 'text-heat' : 'text-muted-foreground'}>
                    {p.stats.heat} heat
                  </span>
                </div>
              </div>

              {/* Right: actions */}
              <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setProfilePlayer(p)}
                  className="btn btn-ghost text-xs"
                  data-testid={`view-profile-${p.id}`}
                >
                  View
                </button>
                {invited[p.id] ? (
                  <span className="flex items-center gap-1.5 text-xs text-success" data-testid={`invited-${p.id}`}>
                    <CheckCircle size={13} /> Invited
                  </span>
                ) : (
                  <button
                    onClick={() => setInvited(x => ({ ...x, [p.id]: true }))}
                    disabled={!canInvite}
                    className={`btn btn-primary text-xs ${!canInvite ? 'opacity-40 cursor-not-allowed' : ''}`}
                    data-testid={`invite-${p.id}`}
                  >
                    <UserPlus size={11} /> Invite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {profilePlayer && (
        <PlayerProfileModal player={profilePlayer} onClose={() => setProfilePlayer(null)} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────

// ── Main Page ─────────────────────────────────
// Mobile-first rewrite: FamilyHeroCard + tab system + Overview tab

export default function Family() {
  const { gameRole, player } = useGame();
  const [loc] = useLocation();

  // Detect /family/recruit path and init tab accordingly
  const initialTab = loc.startsWith('/family/recruit') ? 'recruits' : 'overview';
  const [tab, setTab] = useState<'overview'|'roster'|'recruits'|'territory'>(initialTab as 'overview'|'roster'|'recruits'|'territory');
  const [promoted, setPromoted] = useState<Record<string, boolean>>({});
  const [kicked, setKicked]     = useState<Record<string, boolean>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showWP, setShowWP] = useState(false);
  const [wpDone, setWpDone] = useState(false);

  // Update tab if location changes dynamically
  useEffect(() => {
    if (loc.startsWith('/family/recruit')) {
      setTab('recruits');
    }
  }, [loc]);

  const isBoss      = gameRole === 'BOSS';
  const canManage   = can(gameRole, 'KICK_MEMBER');
  const canInvite   = can(gameRole, 'INVITE_RECRUIT');
  const canTreasury = can(gameRole, 'VIEW_FAMILY_TREASURY');
  const hasFamily   = !!player.family_id;

  const leadership = MOCK_FAMILY.members.filter(m => ['BOSS','UNDERBOSS','CONSIGLIERE','CAPO'].includes(m.role));
  const soldiers   = MOCK_FAMILY.members.filter(m => ['SOLDIER','ASSOCIATE'].includes(m.role));
  const recruits   = MOCK_FAMILY.members.filter(m => m.role === 'RECRUIT');
  const active     = MOCK_FAMILY.members.filter(m => !kicked[m.player_id]);

  const familyFeed = getFamilyFeed(MOCK_FAMILY.id).slice(0, 3);

  const tabs = [
    { id: 'overview' as const,  label: 'Overview',  icon: <Crown size={11} /> },
    { id: 'roster' as const,    label: 'Roster',     icon: <Users size={11} /> },
    { id: 'recruits' as const,  label: 'Recruit',    icon: <UserPlus size={11} /> },
    { id: 'territory' as const, label: 'Territory',  icon: <Shield size={11} /> },
  ];

  function onPromote(id: string) { setPromoted(x => ({ ...x, [id]: true })); }
  function onKick(id: string)    { setKicked(x => ({ ...x, [id]: true })); }

  function handleWPConfirm() {
    setShowWP(false);
    setWpDone(true);
  }

  return (
    <div className="page-stack">
      {/* ── Family Hero Card ── */}
      <div className="family-hero-card">
        <div className="family-hero-card__top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="family-hero-card__name">{MOCK_FAMILY.name}</div>
            <div className="family-hero-card__motto">"{MOCK_FAMILY.motto}"</div>
          </div>
          <div className="family-hero-card__badges">
            {player.family_role && <RoleBadge role={player.family_role} />}
            <StatusBadge status={player.player_status} />
          </div>
        </div>

        {/* Boss controls strip */}
        {(isBoss || canManage) && (
          <div className="boss-strip">
            {canInvite && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)} data-testid="invite-btn">
                <UserPlus size={11} /> Invite Recruit
              </button>
            )}
            {isBoss && (
              <>
                <button className="btn btn-ghost" onClick={() => setShowEdit(true)} data-testid="edit-family-btn">Edit Family</button>
                <button className="btn btn-danger" style={{ fontSize: '10px' }}>Declare War</button>
                <button className="btn btn-ghost">Offer Truce</button>
                <button className="btn btn-ghost">Manage Treasury</button>
                <button className="btn btn-ghost">Post Hit Contract</button>
              </>
            )}
          </div>
        )}

        {/* Stat strip */}
        {canTreasury && (
          <div className="stat-strip">
            {[
              { label: 'Treasury',   value: fmt(MOCK_FAMILY.treasury),                cls: 'text-cash' },
              { label: 'Power',      value: MOCK_FAMILY.power_score.toLocaleString(), cls: '' },
              { label: 'Members',    value: String(active.length),                    cls: '' },
              { label: 'Status',     value: 'Active',                                 cls: 'text-success' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="stat-strip__item">
                <span className="stat-strip__label">{label}</span>
                <span className={`stat-strip__val ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {wpDone && (
        <InfoAlert variant="danger">
          You have entered Witness Protection. Your family affiliation has been removed. You cannot rejoin a family for 30 days.
        </InfoAlert>
      )}

      {/* ── Tab Bar ── */}
      <div className="chip-bar chip-bar--tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`chip${tab === t.id ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Your Role Card */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Your Role</span>
              {player.family_role && <RoleBadge role={player.family_role} />}
            </div>
            <div className="compact-card__body">
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>You can: </span>
                {canManage ? 'promote, kick members, ' : ''}
                {canInvite ? 'invite recruits, ' : ''}
                run missions, view family feed
              </div>
              {player.family_role && ['ASSOCIATE', 'SOLDIER', 'CAPO'].includes(player.family_role) && (
                <div style={{ fontSize: '10px', color: '#555' }}>
                  Complete more missions and earn money to advance your rank.
                </div>
              )}
            </div>
          </div>

          {/* Leadership Block */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Leadership</span>
              <span style={{ fontSize: '10px', color: '#555' }}>{leadership.length} members</span>
            </div>
            <div>
              {leadership.map(m => {
                const p = MOCK_PLAYERS[m.player_id];
                if (!p || kicked[m.player_id]) return null;
                return (
                  <div key={m.player_id} className="member-row">
                    <div className="member-row__rank"><RoleBadge role={m.role} /></div>
                    <span className="member-row__name">{p.alias}</span>
                    <span className="member-row__role" style={{ fontSize: '9px', color: '#666' }}>{p.archetype}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Family Stat Cards — 2x2 grid */}
          <div className="overview-stats-grid">
            {[
              { label: 'Territory',     value: String(MOCK_FAMILY.territory.length),          cls: '' },
              { label: 'Members',       value: String(active.length),                          cls: '' },
              { label: 'Recruits',      value: String(recruits.length),                        cls: recruits.length > 0 ? 'text-warn' : '' },
              { label: 'Power Score',   value: MOCK_FAMILY.power_score.toLocaleString(),       cls: '' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="panel" style={{ padding: '10px' }}>
                <div className="label-caps">{label}</div>
                <div className={`stat-val ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Quick Activity Feed */}
          <div className="compact-card">
            <div className="compact-card__header">
              <span className="compact-card__title">Recent Activity</span>
            </div>
            <div className="compact-card__body" style={{ padding: '6px 12px' }}>
              {familyFeed.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', padding: '6px 0' }}>No recent activity.</div>
              ) : familyFeed.map(e => (
                <div key={e.id} className="feed-item">
                  <div className="feed-item__icon" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666' }}>
                    {e.eventType === 'MEMBER_PROMOTED' ? '↑' :
                     e.eventType === 'WAR_DECLARED' ? '⚔' :
                     e.eventType === 'TERRITORY_SEIZED' ? '🏴' : '●'}
                  </div>
                  <div className="feed-item__body">
                    <div className="feed-item__text">{e.description}</div>
                    <div className="feed-item__time">{new Date(e.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <a href="#/family/feed" className="compact-card__link">View full feed →</a>
          </div>
        </div>
      )}

      {/* ── Roster Tab ── */}
      {tab === 'roster' && (
        <div>
          <div className="compact-card" style={{ marginBottom: '10px' }}>
            <div className="compact-card__header">
              <span className="compact-card__title">Leadership · {leadership.filter(m => !kicked[m.player_id]).length}</span>
            </div>
            <div>
              {leadership.filter(m => !kicked[m.player_id]).map(m => {
                const p = MOCK_PLAYERS[m.player_id];
                if (!p) return null;
                const meetsReqs = m.missions_completed >= 2 && m.money_earned >= 5000;
                const nextLabel = NEXT_ROLE_LABEL[m.role as FamilyRole];
                return (
                  <div key={m.player_id} className="member-row" data-testid={`member-${p.id}`}>
                    <div className="member-row__rank"><RoleBadge role={m.role} /></div>
                    <span className="member-row__name">{p.alias}</span>
                    <span className="member-row__meta">{p.archetype}</span>
                    <StatusBadge status={p.player_status} />
                    {canManage && m.role !== 'BOSS' && (
                      <button onClick={() => onKick(m.player_id)} className="btn btn-danger text-xs" style={{ minHeight: '32px', padding: '2px 8px' }} data-testid={`kick-${p.id}`}>
                        <X size={10} />
                      </button>
                    )}
                    {canManage && nextLabel && !promoted[m.player_id] && (
                      <button onClick={() => onPromote(m.player_id)} disabled={!meetsReqs}
                        className={`btn text-xs ${meetsReqs ? 'btn-success' : 'btn-ghost opacity-40'}`}
                        style={{ minHeight: '32px', padding: '2px 8px' }}
                        data-testid={`promote-${p.id}`}
                      >↑ {nextLabel}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="compact-card" style={{ marginBottom: '10px' }}>
            <div className="compact-card__header">
              <span className="compact-card__title">Soldiers & Associates · {soldiers.filter(m => !kicked[m.player_id]).length}</span>
            </div>
            <div>
              {soldiers.filter(m => !kicked[m.player_id]).map(m => {
                const p = MOCK_PLAYERS[m.player_id];
                if (!p) return null;
                const meetsReqs = m.missions_completed >= 2 && m.money_earned >= 5000;
                const nextLabel = NEXT_ROLE_LABEL[m.role as FamilyRole];
                return (
                  <div key={m.player_id} className="member-row" data-testid={`member-${p.id}`}>
                    <div className="member-row__rank"><RoleBadge role={m.role} /></div>
                    <span className="member-row__name">{p.alias}</span>
                    <span className="member-row__meta">{p.archetype}</span>
                    <StatusBadge status={p.player_status} />
                    {canManage && (
                      <button onClick={() => onKick(m.player_id)} className="btn btn-danger text-xs" style={{ minHeight: '32px', padding: '2px 8px' }} data-testid={`kick-${p.id}`}>
                        <X size={10} />
                      </button>
                    )}
                    {canManage && nextLabel && !promoted[m.player_id] && (
                      <button onClick={() => onPromote(m.player_id)} disabled={!meetsReqs}
                        className={`btn text-xs ${meetsReqs ? 'btn-success' : 'btn-ghost opacity-40'}`}
                        style={{ minHeight: '32px', padding: '2px 8px' }}
                        data-testid={`promote-${p.id}`}
                      >↑ {nextLabel}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recruits section */}
          {recruits.filter(m => !kicked[m.player_id]).length > 0 && (
            <div className="compact-card" style={{ marginBottom: '10px' }}>
              <div className="compact-card__header">
                <span className="compact-card__title">Recruits (Probationary)</span>
                <span className="compact-card__badge">{recruits.filter(m => !kicked[m.player_id]).length}</span>
              </div>
              <div>
                {recruits.filter(m => !kicked[m.player_id]).map(m => {
                  const p = MOCK_PLAYERS[m.player_id];
                  if (!p) return null;
                  const meetsReqs = m.missions_completed >= 2 && m.money_earned >= 5000;
                  return (
                    <div key={m.player_id} className="member-row" data-testid={`member-${p.id}`}>
                      <div className="member-row__rank"><RoleBadge role={m.role} /></div>
                      <span className="member-row__name">{p.alias}</span>
                      <span className="member-row__meta" style={{ color: meetsReqs ? '#4a9a4a' : '#888' }}>
                        {meetsReqs ? 'Ready' : `${m.missions_completed}/2 missions`}
                      </span>
                      {canManage && meetsReqs && !promoted[m.player_id] && (
                        <button onClick={() => onPromote(m.player_id)}
                          className="btn btn-success text-xs"
                          style={{ minHeight: '32px', padding: '2px 8px' }}
                          data-testid={`promote-${p.id}`}
                        >↑ Associate</button>
                      )}
                      {promoted[m.player_id] && <span className="text-xs text-success">✓ Promoted</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Witness Protection */}
          {hasFamily && (
            <div className="panel" style={{ padding: '12px', border: '1px solid rgba(204,51,51,0.2)', background: 'hsl(0 20% 5%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p className="label-caps text-danger" style={{ marginBottom: '3px' }}>Witness Protection</p>
                  <p style={{ fontSize: '10px', color: '#666' }}>Leave the family permanently. Lose 30% cash. Cannot rejoin for 30 days.</p>
                </div>
                <button
                  onClick={() => setShowWP(true)}
                  className="btn btn-danger text-xs"
                  style={{ flexShrink: 0 }}
                  data-testid="witness-protection-btn"
                >
                  <AlertTriangle size={11} /> Enter WP
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recruit Tab ── */}
      {tab === 'recruits' && (
        <RecruitTab canInvite={canInvite} />
      )}

      {/* ── Territory Tab ── */}
      {tab === 'territory' && (
        <div className="compact-card">
          <div>
            {MOCK_FAMILY.territory.map((t, i) => (
              <div key={t} className="turf-item">
                <div className="turf-item__header">
                  <span className="turf-item__name">{t}</span>
                  <span className="badge-green">Controlled</span>
                </div>
                <div className="turf-item__meta">
                  <span className="text-cash">{fmt([12000, 8500, 15000][i] ?? 9000)}/day</span>
                  <span className="text-heat">+{[4, 3, 6][i] ?? 4} heat</span>
                </div>
              </div>
            ))}
            <div className="turf-item" style={{ opacity: 0.5 }}>
              <div className="turf-item__header">
                <span className="turf-item__name">Airport Row</span>
                <span className="badge-red">Rival — Ferrante</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit  && <EditFamilyModal onClose={() => setShowEdit(false)} />}
      {showInvite && <InviteModal    onClose={() => setShowInvite(false)} />}
      {showWP && <WitnessProtectionModal onClose={() => setShowWP(false)} onConfirm={handleWPConfirm} />}
    </div>
  );
}
